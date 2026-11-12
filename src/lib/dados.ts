import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import type { Campanha, Categoria, Doce, Ilustracao } from "./tipos";
import * as exemplo from "./dados-exemplo";
import { banco, bancoConfigurado } from "./banco";
import { lerHorario } from "./horarios";
import { LOJA_PADRAO, ehTraco, normalizarWhatsApp, type DadosLoja, type Traco } from "./loja";

// Ponto único de leitura dos dados. Com MySQL configurado, lê do banco; sem ele,
// usa os dados de exemplo (modo demonstração).
//
// "use cache" guarda o resultado entre visitas. Os dados ficam marcados com
// cacheTag(); as ações do painel chamam updateTag() depois de salvar, e a
// vitrine mostra a mudança na hora.

export const TAG_CARDAPIO = "cardapio";
export const TAG_CAMPANHAS = "campanhas";
export const TAG_LOJA = "loja";

// Colunas do horário na tabela loja, de domingo a sábado.
export const COLUNAS_HORARIO = ["horario_dom", "horario_seg", "horario_ter", "horario_qua", "horario_qui", "horario_sex", "horario_sab"];

function urlDaFoto(caminho: string): string {
  return caminho.startsWith("/") ? caminho : `/fotos/${caminho}`;
}

function lerIlustracao(valor: string | null): Ilustracao | null {
  if (!valor) return null;
  const [tipo, sabor] = valor.split(":");
  return { tipo, sabor } as Ilustracao;
}

// Coluna SET do MySQL: "leite,trigo", "" (nenhum destes) ou NULL (não informado).
function lerAlergenicos(valor: string | null): Traco[] | null {
  if (valor == null) return null;
  return String(valor).split(",").filter(ehTraco);
}

async function docesDoBanco(incluirInativos: boolean): Promise<Doce[]> {
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>(
    `SELECT d.*, e.quantidade AS quantidade_hoje, e.data AS data_quantidade
     FROM doces d
     LEFT JOIN estoque_dia e ON e.doce_id = d.id AND e.data = (SELECT MAX(e2.data) FROM estoque_dia e2 WHERE e2.doce_id = d.id)
     ${incluirInativos ? "" : "WHERE d.ativo = 1"}
     ORDER BY d.ordem, d.nome`,
  );
  if (linhas.length === 0) return [];
  const ids = linhas.map((l) => l.id as string);
  const [sabores] = await db.query<RowDataPacket[]>(
    "SELECT doce_id, id, nome, preco_centavos FROM sabores WHERE doce_id IN (?) ORDER BY ordem, id",
    [ids],
  );
  const [fotos] = await db.query<RowDataPacket[]>(
    "SELECT doce_id, caminho FROM fotos WHERE doce_id IN (?) ORDER BY ordem, id",
    [ids],
  );
  const [vinculos] = await db.query<RowDataPacket[]>(
    "SELECT doce_id, campanha_id FROM campanha_doces WHERE doce_id IN (?)",
    [ids],
  );

  return linhas.map((l) => ({
    id: l.id,
    categoriaId: l.categoria_id,
    nome: l.nome,
    descricao: l.descricao,
    precoCentavos: l.preco_centavos,
    unidade: l.unidade,
    alergenicos: lerAlergenicos(l.alergenicos),
    composicao: l.composicao,
    conservacao: l.conservacao,
    selo: l.selo,
    sobEncomenda: Boolean(l.sob_encomenda),
    prazoDias: l.prazo_dias,
    ondeAparece: l.onde_aparece,
    destaque: Boolean(l.destaque),
    ativo: Boolean(l.ativo),
    quantidadeHoje: Number(l.quantidade_hoje ?? 0),
    dataQuantidade: l.data_quantidade ?? null,
    sabores: sabores
      .filter((s) => s.doce_id === l.id)
      .map((s) => ({ id: String(s.id), nome: s.nome, ...(s.preco_centavos != null && { precoCentavos: s.preco_centavos }) })),
    fotos: fotos.filter((f) => f.doce_id === l.id).map((f) => urlDaFoto(f.caminho)),
    ilustracao: lerIlustracao(l.ilustracao),
    campanhaIds: vinculos.filter((v) => v.doce_id === l.id).map((v) => v.campanha_id),
  }));
}

export async function listarCategorias(): Promise<Categoria[]> {
  "use cache";
  cacheTag(TAG_CARDAPIO);
  cacheLife("minutes");
  if (!bancoConfigurado()) return [...exemplo.categorias].sort((a, b) => a.ordem - b.ordem);
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>("SELECT id, nome, ordem FROM categorias ORDER BY ordem, nome");
  return linhas.map((l) => ({ id: l.id, nome: l.nome, ordem: l.ordem }));
}

// Doces da vitrine (só os ativos).
export async function listarDoces(): Promise<Doce[]> {
  "use cache";
  cacheTag(TAG_CARDAPIO, TAG_CAMPANHAS);
  cacheLife("minutes");
  if (!bancoConfigurado()) return exemplo.doces.filter((d) => d.ativo);
  return docesDoBanco(false);
}

// Todos os doces, inclusive os tirados da vitrine (para o painel).
export async function listarTodosDoces(): Promise<Doce[]> {
  "use cache";
  cacheTag(TAG_CARDAPIO, TAG_CAMPANHAS);
  cacheLife("minutes");
  if (!bancoConfigurado()) return exemplo.doces;
  return docesDoBanco(true);
}

export async function obterDoce(id: string): Promise<Doce | null> {
  const todos = await listarTodosDoces();
  return todos.find((d) => d.id === id) ?? null;
}

export async function listarCampanhas(): Promise<Campanha[]> {
  "use cache";
  cacheTag(TAG_CAMPANHAS);
  cacheLife("minutes");
  if (!bancoConfigurado()) return [...exemplo.campanhas].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>("SELECT * FROM campanhas ORDER BY inicio, nome");
  return linhas.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    nome: l.nome,
    inicio: l.inicio,
    fim: l.fim,
    limiteEncomenda: l.limite_encomenda,
    fraseBanner: l.frase_banner,
    cor: l.cor,
    pausada: Boolean(l.pausada),
    rascunho: Boolean(l.rascunho),
  }));
}

export async function obterCampanha(id: string): Promise<Campanha | null> {
  const todas = await listarCampanhas();
  return todas.find((c) => c.id === id) ?? null;
}

// WhatsApp, horários e textos de Painel > Dados da loja.
export async function obterLoja(): Promise<DadosLoja> {
  "use cache";
  cacheTag(TAG_LOJA);
  cacheLife("minutes");
  if (!bancoConfigurado()) return LOJA_PADRAO;
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>("SELECT * FROM loja WHERE id = 1");
  const l = linhas[0];
  if (!l) return LOJA_PADRAO;
  return {
    whatsapp: normalizarWhatsApp(l.whatsapp) || LOJA_PADRAO.whatsapp,
    horarios: COLUNAS_HORARIO.map((coluna) => lerHorario(l[coluna])),
    retirada: String(l.retirada ?? ""),
    entrega: String(l.entrega ?? ""),
    pagamento: String(l.pagamento ?? ""),
    tracos: String(l.tracos ?? "").split(",").filter(ehTraco),
  };
}

export interface Salvamento {
  // AAAA-MM-DD
  data: string;
  // "9:12", no horário de Brasília.
  hora: string;
  por: string;
}

// Última vez que alguém salvou as quantidades do dia (para "Salvo hoje às 9:12 por Ana").
export async function ultimoSalvamentoDoEstoque(): Promise<Salvamento | null> {
  "use cache";
  cacheTag(TAG_CARDAPIO);
  cacheLife("minutes");
  if (!bancoConfigurado()) return null;
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>(
    `SELECT e.data, DATE_FORMAT(CONVERT_TZ(e.atualizado_em, '+00:00', '-03:00'), '%k:%i') AS hora, e.atualizado_por AS por
     FROM estoque_dia e JOIN doces d ON d.id = e.doce_id AND d.sob_encomenda = 0
     WHERE e.atualizado_em IS NOT NULL
     ORDER BY e.data DESC, e.atualizado_em DESC LIMIT 1`,
  );
  const l = linhas[0];
  return l ? { data: l.data, hora: String(l.hora).trim(), por: l.por ?? "" } : null;
}
