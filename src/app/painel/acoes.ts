"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { updateTag } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { HOJE_SQL, banco, bancoConfigurado } from "@/lib/banco";
import { pode, usuarioAtual, type Papel, type Usuario } from "@/lib/auth";
import { TAG_CAMPANHAS, TAG_CARDAPIO } from "@/lib/dados";
import { TAMANHO_MAXIMO_FOTO, TIPOS_DE_FOTO, pastaDeFotos } from "@/lib/fotos";
import { TIPOS_CAMPANHA } from "@/lib/campanhas-modelo";
import { slugificar } from "@/lib/texto";
import type { OndeAparece, Selo, TipoCampanha } from "@/lib/tipos";

// Ações do painel. Cada uma confere a sessão antes de mexer no banco.

export interface Resultado {
  ok: boolean;
  mensagem: string;
  id?: string;
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

type Autorizacao = { usuario: Usuario; bloqueio?: undefined } | { usuario?: undefined; bloqueio: Resultado };

// Confere no banco quem está pedindo e se o papel dessa pessoa permite a ação.
async function autorizar(minimo: Papel): Promise<Autorizacao> {
  if (!bancoConfigurado()) return { bloqueio: DEMO };
  const usuario = await usuarioAtual();
  if (!usuario) return { bloqueio: { ok: false, mensagem: "Sua sessão acabou. Entre de novo no painel." } };
  if (!pode(usuario, minimo)) {
    return { bloqueio: { ok: false, mensagem: "Seu acesso não permite fazer isso. Fale com a administradora." } };
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
  return { ok: false, mensagem: "Não deu para salvar agora. Tente de novo em instantes." };
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
        await c.query(
          `INSERT INTO estoque_dia (doce_id, data, quantidade) VALUES (?, ${HOJE_SQL}, ?) ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade)`,
          [id, q],
        );
      }
      // Escolher o destaque da vitrine é para equipe e administradora.
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

// Cria ou atualiza a ficha de um doce. Recebe FormData por causa da foto.
export async function salvarDoce(dados: FormData): Promise<Resultado> {
  const { bloqueio } = await autorizar("equipe");
  if (bloqueio) return bloqueio;
  try {
    const idAtual = textoOpcional(dados.get("id"), 80);
    const nome = textoObrigatorio(dados.get("nome"), 120, "Nome do doce");
    const categoriaId = textoObrigatorio(dados.get("categoriaId"), 40, "Categoria");
    const precoCentavos = inteiro(dados.get("precoCentavos"), 0, 10_000_000, "Preço");
    const unidade = textoOpcional(dados.get("unidade"), 40) || "por unidade";
    const descricao = textoOpcional(dados.get("descricao"), 2000);
    const composicao = textoOpcional(dados.get("composicao"), 2000);
    const conservacao = textoOpcional(dados.get("conservacao"), 1000);
    const selo = String(dados.get("selo")) as Selo;
    const onde = String(dados.get("ondeAparece")) as OndeAparece;
    if (!SELOS.includes(selo) || !ONDE.includes(onde)) throw new Invalido("Confira o selo e onde o doce aparece.");
    const contemGluten = dados.get("contemGluten") === "1";
    const contemLactose = dados.get("contemLactose") === "1";
    const sobEncomenda = dados.get("sobEncomenda") === "1";
    const prazoDias = sobEncomenda ? inteiro(dados.get("prazoDias"), 1, 60, "Prazo de preparo") : null;
    const quantidade = sobEncomenda ? 0 : inteiro(dados.get("quantidade"), 0, 9999, "Quantidade hoje");
    const ativo = dados.get("ativo") !== "0";
    const sabores = (JSON.parse(String(dados.get("sabores") ?? "[]")) as unknown[])
      .map((s) => String(s).trim().slice(0, 80))
      .filter(Boolean);
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
        composicao, conservacao, selo, sobEncomenda, prazoDias, onde, ativo,
      ];

      let docId = idAtual;
      if (docId) {
        const [res] = await c.query<RowDataPacket[]>("SELECT 1 FROM doces WHERE id = ?", [docId]);
        if (res.length === 0) throw new Invalido("Esse doce não existe mais.");
        await c.query(
          `UPDATE doces SET nome = ?, categoria_id = ?, descricao = ?, preco_centavos = ?, unidade = ?, contem_gluten = ?,
             contem_lactose = ?, composicao = ?, conservacao = ?, selo = ?, sob_encomenda = ?, prazo_dias = ?,
             onde_aparece = ?, ativo = ? WHERE id = ?`,
          [...campos, docId],
        );
      } else {
        docId = await idLivre(c, "doces", slugificar(nome));
        const [ordem] = await c.query<RowDataPacket[]>("SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM doces");
        await c.query(
          `INSERT INTO doces (nome, categoria_id, descricao, preco_centavos, unidade, contem_gluten, contem_lactose,
             composicao, conservacao, selo, sob_encomenda, prazo_dias, onde_aparece, ativo, id, ordem)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...campos, docId, ordem[0].proxima],
        );
      }

      await c.query("DELETE FROM sabores WHERE doce_id = ?", [docId]);
      for (const [i, sabor] of sabores.entries()) {
        await c.query("INSERT INTO sabores (doce_id, nome, ordem) VALUES (?, ?, ?)", [docId, sabor, i]);
      }

      await c.query("DELETE FROM campanha_doces WHERE doce_id = ?", [docId]);
      if (campanhaIds.length > 0) {
        const [validas] = await c.query<RowDataPacket[]>("SELECT id FROM campanhas WHERE id IN (?)", [campanhaIds]);
        for (const v of validas) {
          await c.query("INSERT INTO campanha_doces (campanha_id, doce_id) VALUES (?, ?)", [v.id, docId]);
        }
      }

      if (!sobEncomenda) {
        await c.query(
          `INSERT INTO estoque_dia (doce_id, data, quantidade) VALUES (?, ${HOJE_SQL}, ?) ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade)`,
          [docId, quantidade],
        );
      }

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

export async function salvarCampanha(dados: DadosCampanha): Promise<Resultado> {
  const { bloqueio } = await autorizar("equipe");
  if (bloqueio) return bloqueio;
  try {
    if (!TIPOS_CAMPANHA.includes(dados.tipo)) throw new Invalido("Escolha a data da campanha.");
    const nome = textoObrigatorio(dados.nome, 120, "Nome da campanha");
    if (!DATA.test(dados.inicio) || !DATA.test(dados.fim)) throw new Invalido("Preencha o começo e o fim da campanha.");
    if (dados.fim < dados.inicio) throw new Invalido("A campanha precisa terminar depois de começar.");
    const limite = dados.limiteEncomenda && DATA.test(dados.limiteEncomenda) ? dados.limiteEncomenda : null;
    const cor = COR.test(dados.cor) ? dados.cor : "#3A1D13";
    const frase = textoOpcional(dados.fraseBanner, 255);
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

const PAPEIS: Papel[] = ["admin", "equipe", "estoque"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function outrasAdministradoras(c: PoolConnection, excetoId: number): Promise<number> {
  const [linhas] = await c.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM usuarios WHERE papel = 'admin' AND ativo = 1 AND id <> ?",
    [excetoId],
  );
  return Number(linhas[0].total);
}

// Dá acesso ao painel para um e-mail do Google.
export async function adicionarAcesso(email: string, papel: Papel): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    const limpo = String(email ?? "").trim().toLowerCase();
    if (!EMAIL.test(limpo) || limpo.length > 190) throw new Invalido("Confira o e-mail.");
    if (!PAPEIS.includes(papel)) throw new Invalido("Escolha o que a pessoa pode fazer.");
    const db = await banco();
    const [existe] = await db.query<RowDataPacket[]>("SELECT ativo FROM usuarios WHERE email = ?", [limpo]);
    if (existe[0]?.ativo) throw new Invalido("Esse e-mail já tem acesso.");
    await db.query(
      "INSERT INTO usuarios (email, papel) VALUES (?, ?) ON DUPLICATE KEY UPDATE papel = VALUES(papel), ativo = 1",
      [limpo, papel],
    );
    return { ok: true, mensagem: `Pronto! Peça para a pessoa entrar no painel com o Google usando ${limpo}.` };
  } catch (erro) {
    return falha(erro);
  }
}

export async function mudarPapel(id: number, papel: Papel): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    if (!PAPEIS.includes(papel)) throw new Invalido("Escolha o que a pessoa pode fazer.");
    await emTransacao(async (c) => {
      if (papel !== "admin" && (await outrasAdministradoras(c, id)) === 0) {
        throw new Invalido("O painel precisa de pelo menos uma administradora.");
      }
      await c.query("UPDATE usuarios SET papel = ? WHERE id = ?", [papel, id]);
    });
    return { ok: true, mensagem: "Acesso atualizado." };
  } catch (erro) {
    return falha(erro);
  }
}

export async function removerAcesso(id: number): Promise<Resultado> {
  const { bloqueio } = await autorizar("admin");
  if (bloqueio) return bloqueio;
  try {
    await emTransacao(async (c) => {
      if ((await outrasAdministradoras(c, id)) === 0) {
        const [alvo] = await c.query<RowDataPacket[]>("SELECT papel FROM usuarios WHERE id = ?", [id]);
        if (alvo[0]?.papel === "admin") throw new Invalido("O painel precisa de pelo menos uma administradora.");
      }
      await c.query("DELETE FROM usuarios WHERE id = ?", [id]);
    });
    return { ok: true, mensagem: "Acesso removido. A pessoa não entra mais no painel." };
  } catch (erro) {
    return falha(erro);
  }
}

// Não abre mais o tutorial sozinho para essa pessoa.
export async function marcarTutorialVisto(): Promise<void> {
  if (!bancoConfigurado()) return;
  const usuario = await usuarioAtual();
  if (!usuario) return;
  await (await banco()).query("UPDATE usuarios SET tutorial_visto = 1 WHERE id = ?", [usuario.id]);
}
