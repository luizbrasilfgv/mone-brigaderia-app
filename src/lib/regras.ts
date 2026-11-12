import type { Campanha, Doce, Sabor, TipoCampanha } from "./tipos";
import { abreNoDia, type Horarios } from "./horarios";
import { TRACOS, type Traco } from "./loja";

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

// "Campanha de Natal" (ou só "Campanha", para outra data).
export function nomeDoTipoDeCampanha(tipo: TipoCampanha): string {
  return tipo === "outra" ? "Campanha" : `Campanha de ${NOMES_CAMPANHA[tipo]}`;
}

// Nome curto para chips e botões: "Natal", ou o nome da campanha para outra data.
export function nomeCurtoDaCampanha(c: Pick<Campanha, "tipo" | "nome">): string {
  return c.tipo === "outra" ? c.nome : NOMES_CAMPANHA[c.tipo];
}

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

export type TomEstoque = "ok" | "pouco" | "esgotado" | "encomenda" | "confirmar";

export interface Estoque {
  tom: TomEstoque;
  texto: string;
  disponivel: boolean;
  // A quantidade foi salva hoje. Se não foi, a vitrine não afirma nada sobre hoje.
  deHoje: boolean;
}

// A quantidade que a vitrine conhece é de hoje? (null = dados de exemplo: vale como hoje.)
export function contagemDeHoje(doce: Doce, hoje: string): boolean {
  return doce.dataQuantidade === null || doce.dataQuantidade === hoje;
}

// O que quem compra vê: faixas, nunca o número exato (o número fica só no painel).
export function estoqueDoDoce(doce: Doce, hoje: string): Estoque {
  if (doce.sobEncomenda) {
    const prazo = doce.prazoDias ?? 1;
    return { tom: "encomenda", texto: `Sob encomenda · ${prazo} ${prazo === 1 ? "dia" : "dias"}`, disponivel: true, deHoje: true };
  }
  if (!contagemDeHoje(doce, hoje)) {
    return { tom: "confirmar", texto: "Pronta entrega · confirme no WhatsApp", disponivel: true, deHoje: false };
  }
  const q = doce.quantidadeHoje;
  if (q <= 0) return { tom: "esgotado", texto: "Esgotado", disponivel: false, deHoje: true };
  if (q <= 3) return { tom: "pouco", texto: "Últimas unidades", disponivel: true, deHoje: true };
  return { tom: "ok", texto: "Tem hoje", disponivel: true, deHoje: true };
}

// O que o painel mostra, com o número.
export function estoqueNoPainel(quantidade: number): { tom: TomEstoque; texto: string } {
  if (quantidade <= 0) return { tom: "esgotado", texto: "Esgotado" };
  if (quantidade <= 3) return { tom: "pouco", texto: `Só restam ${quantidade}` };
  return { tom: "ok", texto: `${quantidade} disponíveis hoje` };
}

// Selo que a vitrine mostra: o escolhido pela dona, ou "Últimas unidades" pelo estoque
// de hoje, ou o nome da campanha para doces que só existem nela.
export function seloDoDoce(doce: Doce, noAr: Campanha[], hoje: string): string | null {
  if (doce.selo === "mais_vendido") return "Mais vendido";
  if (doce.selo === "novo") return "Novo";
  if (estoqueDoDoce(doce, hoje).tom === "pouco") return "Últimas unidades";
  if (doce.ondeAparece === "so_campanhas") {
    const campanha = noAr.find((c) => doce.campanhaIds.includes(c.id));
    if (campanha) return NOMES_CAMPANHA[campanha.tipo];
  }
  return null;
}

// Limites por doce na sacola (src/lib/sacola.ts): contagem de outro dia e sob encomenda.
export const LIMITE_SEM_CONTAGEM = 20;
export const LIMITE_ENCOMENDA = 99;

export function precoDoSabor(doce: Doce, sabor: Sabor | undefined | null): number {
  return sabor?.precoCentavos ?? doce.precoCentavos;
}

// Menor preço entre os sabores ou tamanhos (o do doce, se não tiver nenhum).
export function precoMinimo(doce: Doce): number {
  if (doce.sabores.length === 0) return doce.precoCentavos;
  return Math.min(...doce.sabores.map((s) => precoDoSabor(doce, s)));
}

// Os sabores ou tamanhos têm preços diferentes entre si.
export function temPrecosDiferentes(doce: Doce): boolean {
  return doce.sabores.length > 1 && new Set(doce.sabores.map((s) => precoDoSabor(doce, s))).size > 1;
}

// "a partir de R$ 9,00" quando os sabores têm preços diferentes; senão "R$ 9,00".
export function textoDoPreco(doce: Doce): string {
  return `${temPrecosDiferentes(doce) ? "a partir de " : ""}${formatarPreco(precoMinimo(doce))}`;
}

// Selo "Sem glúten": só quando o doce informa que não leva trigo e a cozinha não usa trigo.
export function semGluten(doce: Doce, tracosDaCozinha: readonly Traco[]): boolean {
  return doce.alergenicos !== null && !doce.alergenicos.includes("trigo") && !tracosDaCozinha.includes("trigo");
}

// "Pode conter": o que a cozinha usa e o doce não leva.
export function podeConter(doce: Doce, tracosDaCozinha: readonly Traco[]): Traco[] {
  return TRACOS.filter((t) => tracosDaCozinha.includes(t) && !doce.alergenicos?.includes(t));
}

// Primeiro dia em que um doce sob encomenda fica pronto: hoje mais o prazo,
// avançando até um dia em que a loja abre.
export function prontoAPartirDe(prazoDias: number, hoje: string, horarios: Horarios): string {
  let dia = somarDias(hoje, prazoDias);
  for (let i = 0; i < 7 && !abreNoDia(horarios, dia); i++) dia = somarDias(dia, 1);
  return dia;
}

export interface PrazoDaCampanha {
  // Ainda dá para encomendar (sem último dia, vale até o fim da campanha).
  aberta: boolean;
  // Segunda linha do banner. null = campanha sem último dia para encomendar.
  texto: string | null;
  // Faltam 5 dias ou menos.
  urgente: boolean;
}

// Prazo de encomenda da campanha, a partir do "último dia para encomendar".
export function encomendaAberta(campanha: Campanha, hoje: string, temProntaEntrega = false): PrazoDaCampanha {
  const limite = campanha.limiteEncomenda;
  if (!limite) return { aberta: true, texto: null, urgente: false };
  if (hoje > limite) {
    return {
      aberta: false,
      texto: temProntaEntrega ? "Encomendas encerradas · ainda tem pronta entrega" : "Encomendas encerradas",
      urgente: false,
    };
  }
  const dias = diasEntre(hoje, limite);
  if (dias === 0) return { aberta: true, texto: "Último dia para encomendar", urgente: true };
  if (dias === 1) return { aberta: true, texto: "Falta 1 dia para encomendar", urgente: true };
  if (dias <= 5) return { aberta: true, texto: `Faltam ${dias} dias para encomendar`, urgente: true };
  return { aberta: true, texto: `Encomende até ${formatarDiaMes(limite)}`, urgente: false };
}

function diasEntre(de: string, ate: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

// Campanha que manda num doce "só em campanhas": a que está no ar (a de prazo mais
// longo, se forem várias). Doce do ano todo não segue o prazo de campanha nenhuma.
export function campanhaDoDoce(doce: Doce, noAr: Campanha[]): Campanha | null {
  if (doce.ondeAparece !== "so_campanhas") return null;
  const dele = noAr.filter((c) => doce.campanhaIds.includes(c.id));
  return dele.sort((a, b) => (b.limiteEncomenda ?? b.fim).localeCompare(a.limiteEncomenda ?? a.fim))[0] ?? null;
}

// "no Natal", "na Páscoa", "no Dia das Mães"
export function naCampanha(campanha: Campanha): string {
  if (campanha.tipo === "outra") return `em ${campanha.nome}`;
  return `${campanha.tipo === "pascoa" ? "na" : "no"} ${NOMES_CAMPANHA[campanha.tipo]}`;
}

// "do Natal", "da Páscoa", "de Semana do Doce"
export function daCampanha(campanha: Campanha): string {
  if (campanha.tipo === "outra") return `de ${campanha.nome}`;
  return `${campanha.tipo === "pascoa" ? "da" : "do"} ${NOMES_CAMPANHA[campanha.tipo]}`;
}

// "para o Natal", "para a Páscoa"
export function paraCampanha(campanha: Campanha): string {
  if (campanha.tipo === "outra") return `para ${campanha.nome}`;
  return `para ${campanha.tipo === "pascoa" ? "a" : "o"} ${NOMES_CAMPANHA[campanha.tipo]}`;
}

// Doce "só em campanhas" sem campanha no ar: diz quando ele volta (a próxima agendada,
// senão a última que ele teve).
export function voltaDoDoce(doce: Doce, campanhas: Campanha[], hoje: string): string {
  const dele = campanhas.filter((c) => doce.campanhaIds.includes(c.id) && !c.rascunho);
  const proxima = dele.filter((c) => situacaoCampanha(c, hoje) === "agendada").sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  if (proxima) return `Este doce volta ${naCampanha(proxima)}, a partir de ${formatarDiaMes(proxima.inicio)}.`;
  const ultima = dele.sort((a, b) => b.fim.localeCompare(a.fim))[0];
  return ultima ? `Este doce volta ${naCampanha(ultima)}.` : "Este doce volta numa próxima campanha.";
}

// Folha "Falar com a Mone" (cabeçalho e rodapé da vitrine, sacola vazia).
export function mensagemGeral(nomeLoja: string): string {
  return `Olá, ${nomeLoja}! Vim pela vitrine e queria falar com vocês.`;
}

// "a Palha italiana", "o Bolo de pote"; sem artigo quando não dá para saber ("Brownie").
function comArtigo(nome: string): string {
  const fim = nome.split(" ")[0].slice(-1).toLowerCase();
  return fim === "a" || fim === "o" ? `${fim} ${nome}` : nome;
}

// Link "Tirar uma dúvida no WhatsApp" da ficha.
export function mensagemDuvida(nomeLoja: string, doce: Doce): string {
  return `Olá, ${nomeLoja}! Tenho uma dúvida sobre ${comArtigo(doce.nome)}: `;
}

// Doce de pronta entrega que esgotou hoje.
export function mensagemOutroDia(nomeLoja: string, doce: Doce): string {
  return `Olá, ${nomeLoja}! Vi que ${comArtigo(doce.nome)} esgotou hoje. Consigo encomendar para: `;
}

// Doce de campanha com as encomendas encerradas ou sem tempo de ficar pronto.
export function mensagemEncerrada(nomeLoja: string, campanha: Campanha, doce: Doce): string {
  return `Olá, ${nomeLoja}! Vi que as encomendas ${campanha.tipo === "outra" ? `de ${campanha.nome}` : `de ${NOMES_CAMPANHA[campanha.tipo]}`} encerraram. Ainda consigo pedir ${doce.nome}?`;
}
