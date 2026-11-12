"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { updateTag } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { redirect } from "next/navigation";
import { HOJE_SQL, banco, bancoConfigurado } from "@/lib/banco";
import {
  ehAdministracaoFixa,
  encerrarSessao,
  iniciarSessao,
  ipDaVisita,
  muitasTentativas,
  novaVersaoDeSessao,
  pode,
  registrarErro,
  usuarioAtual,
  type Papel,
  type Usuario,
} from "@/lib/auth";
import { destinoSeguro } from "@/lib/painel";
import { nomeDoPapel } from "@/lib/papeis";
import { gerarSenhaProvisoria, problemaNaSenhaNova, resumirSenha, senhaConfere } from "@/lib/senhas";
import { COLUNAS_HORARIO, TAG_CAMPANHAS, TAG_CARDAPIO, TAG_LOJA } from "@/lib/dados";
import { escreverHorario, lerHorario } from "@/lib/horarios";
import { TRACOS, ehTraco, normalizarWhatsApp } from "@/lib/loja";
import { TAMANHO_MAXIMO_FOTO, TIPOS_DE_FOTO, pastaDeFotos } from "@/lib/fotos";
import { TIPOS_CAMPANHA } from "@/lib/campanhas-modelo";
import { slugificar } from "@/lib/texto";
import type { OndeAparece, Selo, TipoCampanha } from "@/lib/tipos";

// Ações do painel. Cada uma confere a sessão antes de mexer no banco.

export interface Resultado {
  ok: boolean;
  mensagem: string;
  id?: string;
  // Por que não deu certo: o aviso oferece "Entrar de novo" ou "Tentar de novo".
  motivo?: "sessao" | "rede" | "servidor";
  // Senha provisória recém-criada em Acessos (só aparece nesta resposta).
  convite?: Convite;
}

export interface Convite {
  nome: string;
  email: string;
  senha: string;
  // AAAA-MM-DD (horário de Brasília) em que a senha provisória vence.
  vence: string;
}

const DEMO: Resultado = {
  ok: true,
  mensagem: "Modo demonstração: a alteração aparece aqui, mas não é salva (o banco não está configurado).",
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const COR = /^#[0-9a-fA-F]{6}$/;
const SELOS: Selo[] = ["nenhum", "novo", "mais_vendido"];
const ONDE: OndeAparece[] = ["ano_todo", "so_campanhas"];

class Invalido extends Error {}

const SESSAO_TERMINOU: Resultado = { ok: false, motivo: "sessao", mensagem: "Sua sessão terminou. Entre de novo para continuar." };

type Autorizacao = { usuario: Usuario; bloqueio?: undefined } | { usuario?: undefined; bloqueio: Resultado };

// Confere no banco quem está pedindo e se o papel dessa pessoa permite a ação.
async function autorizar(minimo: Papel): Promise<Autorizacao> {
  if (!bancoConfigurado()) return { bloqueio: DEMO };
  const usuario = await usuarioAtual();
  if (!usuario) return { bloqueio: SESSAO_TERMINOU };
  if (usuario.trocarSenha) return { bloqueio: { ok: false, mensagem: "Crie a sua senha antes de continuar." } };
  if (!pode(usuario, minimo)) {
    return { bloqueio: { ok: false, mensagem: "Seu acesso não permite fazer isso. Fale com a administração." } };
  }
  return { usuario };
}

async function emTransacao<T>(trabalho: (c: PoolConnection) => Promise<T>): Promise<T> {
  const conexao = await (await banco()).getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await trabalho(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

function falha(erro: unknown): Resultado {
  if (erro instanceof Invalido) return { ok: false, mensagem: erro.message };
  console.error("[painel]", erro);
  return { ok: false, motivo: "servidor", mensagem: "Não deu para salvar agora. Tente de novo em instantes." };
}

function inteiro(valor: unknown, min: number, max: number, nome: string): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw new Invalido(`Confira o campo "${nome}".`);
  return n;
}

function textoObrigatorio(valor: unknown, max: number, nome: string): string {
  const t = String(valor ?? "").trim();
  if (!t) throw new Invalido(`Preencha o campo "${nome}".`);
  if (t.length > max) throw new Invalido(`O campo "${nome}" passou de ${max} letras.`);
  return t;
}

function textoOpcional(valor: unknown, max: number): string {
  return String(valor ?? "").trim().slice(0, max);
}

async function idLivre(c: PoolConnection, tabela: "doces" | "campanhas", base: string): Promise<string> {
  const raiz = base || "item";
  for (let n = 1; ; n++) {
    const candidato = n === 1 ? raiz : `${raiz}-${n}`;
    const [linhas] = await c.query<RowDataPacket[]>(`SELECT 1 FROM ${tabela} WHERE id = ?`, [candidato]);
    if (linhas.length === 0) return candidato;
  }
}

// Grava a quantidade de hoje de um doce, com a hora e quem salvou.
async function gravarQuantidade(c: PoolConnection, doceId: string, quantidade: number, usuario: Usuario): Promise<void> {
  await c.query(
    `INSERT INTO estoque_dia (doce_id, data, quantidade, atualizado_em, atualizado_por) VALUES (?, ${HOJE_SQL}, ?, UTC_TIMESTAMP(), ?)
     ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade), atualizado_em = VALUES(atualizado_em), atualizado_por = VALUES(atualizado_por)`,
    [doceId, quantidade, usuario.nome.slice(0, 120)],
  );
}

// Quantidades do dia e doce em destaque.
export async function salvarEstoque(quantidades: Record<string, number>, destaqueId: string | null): Promise<Resultado> {
  const { usuario, bloqueio } = await autorizar("estoque");
  if (bloqueio) return bloqueio;
  try {
    await emTransacao(async (c) => {
      const [doces] = await c.query<RowDataPacket[]>("SELECT id, sob_encomenda FROM doces");
      const existentes = new Map(doces.map((d) => [d.id as string, Boolean(d.sob_encomenda)]));
      for (const [id, quantidade] of Object.entries(quantidades)) {
        if (!existentes.has(id) || existentes.get(id)) continue;
        const q = inteiro(quantidade, 0, 9999, "quantidade");
        await gravarQuantidade(c, id, q, usuario);
      }
      // Escolher o destaque da vitrine é para Equipe e Administração.
      if (destaqueId && existentes.has(destaqueId) && pode(usuario, "equipe")) {
        await c.query("UPDATE doces SET destaque = (id = ?)", [destaqueId]);
      }
    });
    updateTag(TAG_CARDAPIO);
    return { ok: true, mensagem: "Pronto! A vitrine já mostra as quantidades de hoje." };
  } catch (erro) {
    return falha(erro);
  }
}

// Sabores ou tamanhos do formulário: [{ nome, precoCentavos }] (precoCentavos null = preço
// do doce). Aceita também a lista antiga só com nomes.
function lerSabores(valor: FormDataEntryValue | null): { nome: string; precoCentavos: number | null }[] {
  const lidos = JSON.parse(String(valor ?? "[]")) as unknown;
  if (!Array.isArray(lidos)) throw new Invalido("Confira os sabores ou tamanhos.");
  const sabores: { nome: string; precoCentavos: number | null }[] = [];
  for (const item of lidos) {
    const bruto: { nome?: unknown; precoCentavos?: unknown } = typeof item === "object" && item ? item : { nome: item };
    const nome = String(bruto.nome ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (!nome) continue;
    if (sabores.some((s) => s.nome.toLowerCase() === nome.toLowerCase())) throw new Invalido(`O sabor "${nome}" aparece duas vezes.`);
    const preco = bruto.precoCentavos == null || bruto.precoCentavos === "" ? null : inteiro(bruto.precoCentavos, 1, 10_000_000, `Preço de ${nome}`);
    sabores.push({ nome, precoCentavos: preco });
  }
  return sabores;
}

// Cria ou atualiza a ficha de um doce. Recebe FormData por causa da foto.
export async function salvarDoce(dados: FormData): Promise<Resultado> {
  const { usuario, bloqueio } = await autorizar("equipe");
  if (bloqueio) return bloqueio;
  try {
    const idAtual = textoOpcional(dados.get("id"), 80);
    const nome = textoObrigatorio(dados.get("nome"), 120, "Nome do doce");
    const categoriaId = textoObrigatorio(dados.get("categoriaId"), 40, "Categoria");
    const precoCentavos = inteiro(dados.get("precoCentavos"), 1, 10_000_000, "Preço");
    const unidade = textoOpcional(dados.get("unidade"), 40) || "por unidade";
    const descricao = textoOpcional(dados.get("descricao"), 2000);
    const composicao = textoOpcional(dados.get("composicao"), 2000);
    const conservacao = textoOpcional(dados.get("conservacao"), 1000);
    const selo = String(dados.get("selo")) as Selo;
    const onde = String(dados.get("ondeAparece")) as OndeAparece;
    if (!SELOS.includes(selo) || !ONDE.includes(onde)) throw new Invalido("Confira o selo e onde o doce aparece.");
    // null = não informado; [] = nenhum destes.
    const alergenicosLidos = JSON.parse(String(dados.get("alergenicos") ?? "null")) as unknown;
    const alergenicos = Array.isArray(alergenicosLidos) ? TRACOS.filter((t) => alergenicosLidos.includes(t)) : null;
    // contem_gluten e contem_lactose seguem gravadas (trigo e leite) para quem ainda lê o banco antigo.
    const contemGluten = alergenicos === null || alergenicos.includes("trigo");
    const contemLactose = alergenicos === null || alergenicos.includes("leite");
    const sobEncomenda = dados.get("sobEncomenda") === "1";
    const prazoDias = sobEncomenda ? inteiro(dados.get("prazoDias"), 1, 60, "Prazo de preparo") : null;
    const quantidade = sobEncomenda ? 0 : inteiro(dados.get("quantidade"), 0, 9999, "Quantidade hoje");
    const ativo = dados.get("ativo") !== "0";
    const sabores = lerSabores(dados.get("sabores"));
    const campanhaIds = (JSON.parse(String(dados.get("campanhaIds") ?? "[]")) as unknown[]).map(String);
    const foto = dados.get("foto");
    const arquivo = foto instanceof File && foto.size > 0 ? foto : null;
    if (arquivo) {
      if (!TIPOS_DE_FOTO[arquivo.type]) throw new Invalido("A foto precisa ser JPG, PNG ou WebP.");
      if (arquivo.size > TAMANHO_MAXIMO_FOTO) throw new Invalido("A foto passou de 5 MB.");
    }

    const id = await emTransacao(async (c) => {
      const [categorias] = await c.query<RowDataPacket[]>("SELECT 1 FROM categorias WHERE id = ?", [categoriaId]);
      if (categorias.length === 0) throw new Invalido("Escolha uma categoria válida.");

      // Mesma ordem das colunas no UPDATE e no INSERT abaixo.
      const campos = [
        nome, categoriaId, descricao, precoCentavos, unidade, contemGluten, contemLactose,
        alergenicos === null ? null : alergenicos.join(","), composicao, conservacao, selo, sobEncomenda, prazoDias, onde, ativo,
      ];

      let docId = idAtual;
      if (docId) {
        const [res] = await c.query<RowDataPacket[]>("SELECT 1 FROM doces WHERE id = ?", [docId]);
        if (res.length === 0) throw new Invalido("Esse doce não existe mais.");
        await c.query(
          `UPDATE doces SET nome = ?, categoria_id = ?, descricao = ?, preco_centavos = ?, unidade = ?, contem_gluten = ?,
             contem_lactose = ?, alergenicos = ?, composicao = ?, conservacao = ?, selo = ?, sob_encomenda = ?, prazo_dias = ?,
             onde_aparece = ?, ativo = ? WHERE id = ?`,
          [...campos, docId],
        );
      } else {
        docId = await idLivre(c, "doces", slugificar(nome));
        const [ordem] = await c.query<RowDataPacket[]>("SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM doces");
        await c.query(
          `INSERT INTO doces (nome, categoria_id, descricao, preco_centavos, unidade, contem_gluten, contem_lactose,
             alergenicos, composicao, conservacao, selo, sob_encomenda, prazo_dias, onde_aparece, ativo, id, ordem)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...campos, docId, ordem[0].proxima],
        );
      }

      // Regrava os sabores com o nome e o preço que vieram do formulário (vazio = preço do
      // doce). A sacola de quem compra guarda a opção pelo nome, não pelo id.
      await c.query("DELETE FROM sabores WHERE doce_id = ?", [docId]);
      for (const [i, sabor] of sabores.entries()) {
        await c.query("INSERT INTO sabores (doce_id, nome, preco_centavos, ordem) VALUES (?, ?, ?, ?)", [
          docId,
          sabor.nome,
          sabor.precoCentavos,
          i,
        ]);
      }

      await c.query("DELETE FROM campanha_doces WHERE doce_id = ?", [docId]);
      if (campanhaIds.length > 0) {
        const [validas] = await c.query<RowDataPacket[]>("SELECT id FROM campanhas WHERE id IN (?)", [campanhaIds]);
        for (const v of validas) {
          await c.query("INSERT INTO campanha_doces (campanha_id, doce_id) VALUES (?, ?)", [v.id, docId]);
        }
      }

      if (!sobEncomenda) await gravarQuantidade(c, docId, quantidade, usuario);

      if (arquivo) {
        const pasta = pastaDeFotos();
        await mkdir(pasta, { recursive: true });
        const nomeArquivo = `${docId}-${Date.now().toString(36)}.${TIPOS_DE_FOTO[arquivo.type]}`;
        await writeFile(path.join(pasta, nomeArquivo), Buffer.from(await arquivo.arrayBuffer()));
        // A foto nova vira a principal.
        const [menor] = await c.query<RowDataPacket[]>("SELECT COALESCE(MIN(ordem), 1) - 1 AS ordem FROM fotos WHERE doce_id = ?", [docId]);
        await c.query("INSERT INTO fotos (doce_id, caminho, ordem) VALUES (?, ?, ?)", [docId, nomeArquivo, menor[0].ordem]);
      }
      return docId;
    });

    updateTag(TAG_CARDAPIO);
    return { ok: true, mensagem: ativo ? "Ficha salva. Já aparece na vitrine." : "Ficha salva. O doce está fora da vitrine.", id };
  } catch (erro) {
    return falha(erro);
  }
}

export interface DadosCampanha {
  id: string | null;
  tipo: TipoCampanha;
  nome: string;
  inicio: string;
  fim: string;
  limiteEncomenda: string | null;
  fraseBanner: string;
  cor: string;
  docesIds: string[];
}

// A frase cabe em duas linhas curtas no banner.
const LIMITE_FRASE = 60;

export async function salvarCampanha(dados: DadosCampanha): Promise<Resultado> {
  const { bloqueio } = await autorizar("equipe");
  if (bloqueio) return bloqueio;
  try {
    if (!TIPOS_CAMPANHA.includes(dados.tipo)) throw new Invalido("Escolha a data da campanha.");
    const nome = textoObrigatorio(dados.nome, 120, "Nome da campanha");
    if (!DATA.test(dados.inicio) || !DATA.test(dados.fim)) throw new Invalido("Preencha o começo e o fim da campanha.");
    if (dados.fim < dados.inicio) throw new Invalido("A campanha precisa terminar depois de começar.");
    const limite = dados.limiteEncomenda ? String(dados.limiteEncomenda) : null;
    if (limite && !DATA.test(limite)) throw new Invalido("Confira o último dia para encomendar.");
    if (limite && (limite < dados.inicio || limite > dados.fim)) {
      throw new Invalido("O último dia para encomendar precisa ficar entre o começo e o fim da campanha.");
    }
    const cor = COR.test(dados.cor) ? dados.cor : "#3A1D13";
    const frase = String(dados.fraseBanner ?? "").trim();
    if (frase.length > LIMITE_FRASE) throw new Invalido(`A frase do banner passou de ${LIMITE_FRASE} letras. Encurte para caber no banner.`);
    const docesIds = Array.isArray(dados.docesIds) ? dados.docesIds.map(String) : [];

    const id = await emTransacao(async (c) => {
      const campos = [dados.tipo, nome, dados.inicio, dados.fim, limite, frase, cor];
      let campanhaId = dados.id ? textoOpcional(dados.id, 80) : "";
      if (campanhaId) {
        const [res] = await c.query<RowDataPacket[]>("SELECT 1 FROM campanhas WHERE id = ?", [campanhaId]);
        if (res.length === 0) throw new Invalido("Essa campanha não existe mais.");
        await c.query(
          "UPDATE campanhas SET tipo = ?, nome = ?, inicio = ?, fim = ?, limite_encomenda = ?, frase_banner = ?, cor = ?, rascunho = 0 WHERE id = ?",
          [...campos, campanhaId],
        );
      } else {
        campanhaId = await idLivre(c, "campanhas", `${slugificar(nome)}-${dados.inicio.slice(0, 4)}`);
        await c.query(
          "INSERT INTO campanhas (tipo, nome, inicio, fim, limite_encomenda, frase_banner, cor, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [...campos, campanhaId],
        );
      }
      await c.query("DELETE FROM campanha_doces WHERE campanha_id = ?", [campanhaId]);
      if (docesIds.length > 0) {
        const [validos] = await c.query<RowDataPacket[]>("SELECT id FROM doces WHERE id IN (?)", [docesIds]);
        for (const d of validos) {
          await c.query("INSERT INTO campanha_doces (campanha_id, doce_id) VALUES (?, ?)", [campanhaId, d.id]);
        }
      }
      return campanhaId;
    });

    updateTag(TAG_CAMPANHAS);
    updateTag(TAG_CARDAPIO);
    return { ok: true, mensagem: "Campanha salva. Ela entra e sai da vitrine sozinha nas datas escolhidas.", id };
  } catch (erro) {
    return falha(erro);
  }
}

export async function pausarCampanha(id: string, pausada: boolean): Promise<Resultado> {
  const { bloqueio } = await autorizar("equipe");
  if (bloqueio) return bloqueio;
  try {
    const db = await banco();
    await db.query("UPDATE campanhas SET pausada = ? WHERE id = ?", [pausada, id]);
    updateTag(TAG_CAMPANHAS);
    return { ok: true, mensagem: pausada ? "Campanha pausada: saiu da vitrine." : "Campanha de volta na vitrine." };
  } catch (erro) {
    return falha(erro);
  }
}

// --- Dados da loja ---

export interface DadosDaLoja {
  whatsapp: string;
  // De domingo a sábado; null = fechado.
  horarios: ({ abre: string; fecha: string } | null)[];
  retirada: string;
  entrega: string;
  pagamento: string;
  tracos: string[];
}

const DIAS_DO_ERRO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

// WhatsApp, horário de cada dia e textos que aparecem para quem compra.
export async function salvarLoja(dados: DadosDaLoja): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    const whatsapp = normalizarWhatsApp(String(dados.whatsapp ?? ""));
    if (!whatsapp) throw new Invalido("Confira o WhatsApp: escreva o DDD e o número, por exemplo (21) 98063-1673.");
    const lista = Array.isArray(dados.horarios) ? dados.horarios : [];
    const horarios = COLUNAS_HORARIO.map((_, dia) => {
      const h = lista[dia];
      if (!h) return "";
      const lido = lerHorario(`${h.abre}-${h.fecha}`);
      if (!lido) throw new Invalido(`Confira o horário de ${DIAS_DO_ERRO[dia]}: a loja precisa fechar depois de abrir.`);
      return escreverHorario(lido);
    });
    const textos = [dados.retirada, dados.entrega, dados.pagamento].map((t) => textoOpcional(t, 80));
    const tracos = (Array.isArray(dados.tracos) ? dados.tracos : []).filter(ehTraco);
    const db = await banco();
    await db.query(
      `INSERT INTO loja (id, whatsapp, ${COLUNAS_HORARIO.join(", ")}, retirada, entrega, pagamento, tracos)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE whatsapp = VALUES(whatsapp), ${COLUNAS_HORARIO.map((c) => `${c} = VALUES(${c})`).join(", ")},
         retirada = VALUES(retirada), entrega = VALUES(entrega), pagamento = VALUES(pagamento), tracos = VALUES(tracos)`,
      [whatsapp, ...horarios, ...textos, [...new Set(tracos)].join(",")],
    );
    updateTag(TAG_LOJA);
    return { ok: true, mensagem: "Dados salvos. A vitrine e os links do WhatsApp já usam os dados novos." };
  } catch (erro) {
    return falha(erro);
  }
}

// --- Acessos ---

const PAPEIS: Papel[] = ["admin", "equipe", "estoque"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIXA = "Essa pessoa é da Administração fixa, configurada no servidor. Para mudar, fale com quem cuida do site.";
const PRECISA_ADMIN = "O painel precisa de pelo menos uma pessoa na Administração.";

async function outrasPessoasNaAdministracao(c: PoolConnection, excetoId: number): Promise<number> {
  const [linhas] = await c.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM usuarios WHERE papel = 'admin' AND ativo = 1 AND id <> ?",
    [excetoId],
  );
  return Number(linhas[0].total);
}

async function pessoaAtiva(c: PoolConnection, id: number): Promise<{ email: string; nome: string; papel: Papel }> {
  const [linhas] = await c.query<RowDataPacket[]>("SELECT email, nome, papel FROM usuarios WHERE id = ? AND ativo = 1", [id]);
  if (!linhas[0]) throw new Invalido("Essa pessoa não tem mais acesso. Atualize a página.");
  return { email: linhas[0].email, nome: linhas[0].nome || linhas[0].email, papel: linhas[0].papel };
}

// Grava uma senha provisória nova (vale 7 dias), pede a troca no primeiro acesso e
// derruba as sessões que a pessoa tinha. A senha só existe nesta resposta.
async function criarProvisoria(c: PoolConnection, id: number, nome: string, email: string): Promise<Convite> {
  const senha = gerarSenhaProvisoria();
  await c.query(
    `UPDATE usuarios SET senha_hash = ?, trocar_senha = 1, senha_provisoria_expira = UTC_TIMESTAMP() + INTERVAL 7 DAY,
       sessao_versao = sessao_versao + 1 WHERE id = ?`,
    [await resumirSenha(senha), id],
  );
  const [linhas] = await c.query<RowDataPacket[]>(
    "SELECT DATE_FORMAT(CONVERT_TZ(senha_provisoria_expira, '+00:00', '-03:00'), '%Y-%m-%d') AS vence FROM usuarios WHERE id = ?",
    [id],
  );
  return { nome, email, senha, vence: linhas[0].vence };
}

// Dá acesso ao painel: nome, e-mail (qualquer um) e o que a pessoa pode fazer.
export async function adicionarAcesso(dados: { nome: string; email: string; papel: Papel }): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    const nome = textoObrigatorio(dados.nome, 120, "Nome");
    const email = String(dados.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 190) throw new Invalido("Confira o e-mail.");
    if (!PAPEIS.includes(dados.papel)) throw new Invalido("Escolha o que a pessoa pode fazer.");
    const papel = ehAdministracaoFixa(email) ? "admin" : dados.papel;
    const convite = await emTransacao(async (c) => {
      const [existe] = await c.query<RowDataPacket[]>("SELECT ativo FROM usuarios WHERE email = ? FOR UPDATE", [email]);
      if (existe[0]?.ativo) throw new Invalido("Esse e-mail já tem acesso.");
      // Quem já teve acesso e foi removido volta com os dados novos.
      await c.query(
        `INSERT INTO usuarios (email, nome, papel) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nome = VALUES(nome), papel = VALUES(papel), ativo = 1, tutorial_visto = 0, ultimo_acesso = NULL`,
        [email, nome, papel],
      );
      const [linhas] = await c.query<RowDataPacket[]>("SELECT id FROM usuarios WHERE email = ?", [email]);
      return criarProvisoria(c, linhas[0].id, nome, email);
    });
    return { ok: true, mensagem: `Pronto! ${nome} já tem acesso. Mande o convite com a senha provisória.`, convite };
  } catch (erro) {
    return falha(erro);
  }
}

// "Esqueci a senha": a administração gera uma provisória nova para a pessoa.
export async function gerarSenhaNova(id: number): Promise<Resultado> {
  const { usuario, bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    if (id === usuario.id) throw new Invalido("Para trocar a sua própria senha, use Minha conta.");
    const convite = await emTransacao(async (c) => {
      const pessoa = await pessoaAtiva(c, id);
      return criarProvisoria(c, id, pessoa.nome, pessoa.email);
    });
    return { ok: true, mensagem: `Senha nova criada. ${convite.nome} saiu do painel nos outros aparelhos.`, convite };
  } catch (erro) {
    return falha(erro);
  }
}

export async function mudarPapel(id: number, papel: Papel): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    if (!PAPEIS.includes(papel)) throw new Invalido("Escolha o que a pessoa pode fazer.");
    const nome = await emTransacao(async (c) => {
      const pessoa = await pessoaAtiva(c, id);
      if (ehAdministracaoFixa(pessoa.email)) throw new Invalido(FIXA);
      if (papel !== "admin" && (await outrasPessoasNaAdministracao(c, id)) === 0) throw new Invalido(PRECISA_ADMIN);
      await c.query("UPDATE usuarios SET papel = ? WHERE id = ?", [papel, id]);
      return pessoa.nome;
    });
    return { ok: true, mensagem: `${nome} agora é ${nomeDoPapel(papel)}.` };
  } catch (erro) {
    return falha(erro);
  }
}

// Remover não apaga a pessoa: marca como inativa (o histórico fica) e derruba as sessões.
export async function removerAcesso(id: number): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    const nome = await emTransacao(async (c) => {
      const pessoa = await pessoaAtiva(c, id);
      if (ehAdministracaoFixa(pessoa.email)) throw new Invalido(FIXA);
      if (pessoa.papel === "admin" && (await outrasPessoasNaAdministracao(c, id)) === 0) throw new Invalido(PRECISA_ADMIN);
      await c.query(
        `UPDATE usuarios SET ativo = 0, senha_hash = NULL, trocar_senha = 0, senha_provisoria_expira = NULL,
           sessao_versao = sessao_versao + 1 WHERE id = ?`,
        [id],
      );
      return pessoa.nome;
    });
    return { ok: true, mensagem: `Acesso removido. ${nome} não entra mais no painel.` };
  } catch (erro) {
    return falha(erro);
  }
}

// --- Minha conta ---

export async function salvarNome(nome: string): Promise<Resultado> {
  const { usuario, bloqueio } = await autorizar("estoque");
  if (bloqueio) return bloqueio;
  try {
    const limpo = textoObrigatorio(nome, 120, "Seu nome");
    await (await banco()).query("UPDATE usuarios SET nome = ? WHERE id = ?", [limpo, usuario.id]);
    return { ok: true, mensagem: "Nome salvo." };
  } catch (erro) {
    return falha(erro);
  }
}

// Confere a senha nova e grava. Aumenta a versão da sessão (os outros aparelhos
// saem) e renova o cookie deste celular.
async function gravarSenha(usuario: Usuario, nova: string): Promise<void> {
  const db = await banco();
  await db.query(
    "UPDATE usuarios SET senha_hash = ?, trocar_senha = 0, senha_provisoria_expira = NULL WHERE id = ?",
    [await resumirSenha(nova), usuario.id],
  );
  await iniciarSessao(usuario.id, await novaVersaoDeSessao(usuario.id));
}

async function senhaGuardada(id: number): Promise<{ hash: string | null; provisoria: boolean }> {
  const [linhas] = await (await banco()).query<RowDataPacket[]>(
    "SELECT senha_hash, senha_provisoria_expira IS NOT NULL AS provisoria FROM usuarios WHERE id = ?",
    [id],
  );
  return { hash: linhas[0]?.senha_hash ?? null, provisoria: Boolean(Number(linhas[0]?.provisoria)) };
}

function ehChaveDeEmergencia(senha: string): boolean {
  return Boolean(process.env.PAINEL_SENHA) && senha === process.env.PAINEL_SENHA;
}

export async function trocarSenha(atual: string, nova: string): Promise<Resultado> {
  const { usuario, bloqueio } = await autorizar("estoque");
  if (bloqueio) return bloqueio;
  try {
    const ip = await ipDaVisita();
    if (await muitasTentativas(usuario.email, ip)) throw new Invalido("Muitas tentativas. Espere 15 minutos e tente de novo.");
    if (!(await senhaConfere(String(atual ?? ""), (await senhaGuardada(usuario.id)).hash))) {
      await registrarErro(usuario.email, ip);
      throw new Invalido("A senha atual não confere.");
    }
    const problema = problemaNaSenhaNova(String(nova ?? ""), usuario.email);
    if (problema) throw new Invalido(problema);
    if (nova === atual) throw new Invalido("A senha nova precisa ser diferente da atual.");
    if (ehChaveDeEmergencia(nova)) throw new Invalido("Escolha outra senha.");
    await gravarSenha(usuario, nova);
    return { ok: true, mensagem: "Senha trocada. Nos outros celulares, entre de novo com a senha nova." };
  } catch (erro) {
    return falha(erro);
  }
}

export interface EstadoCriarSenha {
  erro: string | null;
}

// Primeiro acesso (ou chave de emergência): cria a senha da pessoa e segue para o painel.
export async function criarSenha(_anterior: EstadoCriarSenha, dados: FormData): Promise<EstadoCriarSenha> {
  if (!bancoConfigurado()) redirect("/painel");
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?motivo=expirou");
  const volta = destinoSeguro(dados.get("volta")) ?? "/painel";
  if (!usuario.trocarSenha) redirect(volta);
  const nova = String(dados.get("senha") ?? "");
  const problema = problemaNaSenhaNova(nova, usuario.email);
  if (problema) return { erro: problema };
  if (ehChaveDeEmergencia(nova)) return { erro: "Escolha outra senha." };
  try {
    const guardada = await senhaGuardada(usuario.id);
    if (guardada.provisoria && (await senhaConfere(nova, guardada.hash))) {
      return { erro: "Essa é a senha provisória. Crie uma senha nova, só sua." };
    }
    await gravarSenha(usuario, nova);
  } catch (erro) {
    console.error("[painel]", erro);
    return { erro: "Não deu para salvar agora. Tente de novo em instantes." };
  }
  redirect(volta);
}

// "Sair de todos os aparelhos": derruba todas as sessões da pessoa, inclusive esta.
export async function sairDeTodos(): Promise<void> {
  const usuario = await usuarioAtual();
  if (usuario && bancoConfigurado()) await novaVersaoDeSessao(usuario.id);
  await encerrarSessao();
  redirect("/entrar?motivo=todos");
}

// Não abre mais o tutorial sozinho para essa pessoa.
export async function marcarTutorialVisto(): Promise<void> {
  if (!bancoConfigurado()) return;
  const usuario = await usuarioAtual();
  if (!usuario) return;
  await (await banco()).query("UPDATE usuarios SET tutorial_visto = 1 WHERE id = ?", [usuario.id]);
}
