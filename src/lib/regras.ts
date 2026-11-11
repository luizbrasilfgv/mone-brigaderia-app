import type { Campanha, Doce, Sabor, TipoCampanha } from "./tipos";

// Regras de negócio descritas em docs/funcionalidades.md.

export function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// "2026-12-24" → "24/12/2026"
export function formatarData(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// "2026-12-24" → "24/12"
export function formatarDiaMes(iso: string): string {
  return iso.split("-").reverse().slice(0, 2).join("/");
}

export function dataISO(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return dataISO(new Date(a, m - 1, d + dias));
}

// "2026-12-24" → "qui., 24/12"
export function rotuloData(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export const NOMES_CAMPANHA: Record<TipoCampanha, string> = {
  natal: "Natal",
  pascoa: "Páscoa",
  dia_das_maes: "Dia das Mães",
  dia_dos_namorados: "Dia dos Namorados",
  dia_do_chocolate: "Dia do Chocolate",
  dia_dos_pais: "Dia dos Pais",
  outra: "Campanha",
};

export type SituacaoCampanha = "no_ar" | "pausada" | "agendada" | "rascunho" | "encerrada";

export function situacaoCampanha(c: Campanha, hoje: string): SituacaoCampanha {
  if (c.rascunho) return "rascunho";
  if (hoje > c.fim) return "encerrada";
  if (hoje < c.inicio) return "agendada";
  return c.pausada ? "pausada" : "no_ar";
}

export function campanhasNoAr(campanhas: Campanha[], hoje: string): Campanha[] {
  return campanhas.filter((c) => situacaoCampanha(c, hoje) === "no_ar");
}

// Doce "ano todo" sempre aparece; "só em campanhas" só enquanto uma delas está no ar.
export function doceApareceNaVitrine(doce: Doce, idsNoAr: Set<string>): boolean {
  if (!doce.ativo) return false;
  if (doce.ondeAparece === "ano_todo") return true;
  return doce.campanhaIds.some((id) => idsNoAr.has(id));
}

export type TomEstoque = "ok" | "pouco" | "esgotado" | "encomenda";

export interface Estoque {
  tom: TomEstoque;
  texto: string;
  disponivel: boolean;
}

export function estoqueDoDoce(doce: Doce): Estoque {
  if (doce.sobEncomenda) {
    const prazo = doce.prazoDias ?? 1;
    return { tom: "encomenda", texto: `Sob encomenda · ${prazo} ${prazo === 1 ? "dia" : "dias"}`, disponivel: true };
  }
  const q = doce.quantidadeHoje;
  if (q <= 0) return { tom: "esgotado", texto: "Esgotado", disponivel: false };
  if (q <= 3) return { tom: "pouco", texto: `Só restam ${q}`, disponivel: true };
  return { tom: "ok", texto: `${q} disponíveis hoje`, disponivel: true };
}

// Selo que a vitrine mostra: o escolhido pela dona, ou "Últimas unidades" pelo estoque,
// ou o nome da campanha para doces que só existem nela.
export function seloDoDoce(doce: Doce, noAr: Campanha[]): string | null {
  if (doce.selo === "mais_vendido") return "Mais vendido";
  if (doce.selo === "novo") return "Novo";
  if (!doce.sobEncomenda && doce.quantidadeHoje > 0 && doce.quantidadeHoje <= 3) return "Últimas unidades";
  if (doce.ondeAparece === "so_campanhas") {
    const campanha = noAr.find((c) => doce.campanhaIds.includes(c.id));
    if (campanha) return NOMES_CAMPANHA[campanha.tipo];
  }
  return null;
}

export function precoDoSabor(doce: Doce, sabor: Sabor | undefined): number {
  return sabor?.precoCentavos ?? doce.precoCentavos;
}

// Primeira data que a cliente pode escolher para um doce sob encomenda.
export function datasDeEncomenda(prazoDias: number, hoje: string, quantas = 3): string[] {
  return Array.from({ length: quantas }, (_, i) => somarDias(hoje, prazoDias + i));
}

export function mensagemGeral(nomeLoja: string): string {
  return `Olá, ${nomeLoja}! Vi a vitrine no app e quero fazer uma encomenda.`;
}

export function mensagemDoDoce(opcoes: {
  nomeLoja: string;
  doce: Doce;
  sabor?: Sabor;
  quantidade: number;
  data?: string | null;
}): string {
  const { nomeLoja, doce, sabor, quantidade, data } = opcoes;
  const item = sabor && doce.sabores.length > 1 ? `${doce.nome} (${sabor.nome})` : doce.nome;
  const linhas = [
    `Olá, ${nomeLoja}! Quero encomendar:`,
    `• ${quantidade}x ${item}`,
    `Valor: ${formatarPreco(precoDoSabor(doce, sabor) * quantidade)}`,
  ];
  if (doce.sobEncomenda) {
    linhas.push(`Para o dia: ${data ? rotuloData(data) : "vou combinar com vocês"}`);
  }
  return linhas.join("\n");
}
