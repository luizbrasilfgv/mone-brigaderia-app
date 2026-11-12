import type { Campanha, TipoCampanha } from "./tipos";
import { dataISO, somarDias } from "./regras";

// Datas prontas para criar campanhas. As datas móveis (Páscoa, Dia das Mães,
// Dia dos Pais) são calculadas para cada ano.

export interface ModeloCampanha {
  tipo: TipoCampanha;
  nome: string;
  frase: string;
  cor: string;
  // Quantos dias antes da data a campanha entra no ar e fecha as encomendas.
  diasAntes: number;
  limiteAntes: number;
}

export const MODELOS: ModeloCampanha[] = [
  { tipo: "natal", nome: "Natal Mone", frase: "Caixas e brigadeiros para a ceia.", cor: "#7A1F1F", diasAntes: 45, limiteAntes: 5 },
  { tipo: "pascoa", nome: "Páscoa Mone", frase: "Caixas de brigadeiro e bolos de pote para a Páscoa.", cor: "#5B3F7A", diasAntes: 28, limiteAntes: 4 },
  { tipo: "dia_das_maes", nome: "Dia das Mães", frase: "Um presente doce para quem cuida de você.", cor: "#8A3B5A", diasAntes: 14, limiteAntes: 3 },
  { tipo: "dia_dos_namorados", nome: "Dia dos Namorados", frase: "Brigadeiros para dividir a dois.", cor: "#8A2A3A", diasAntes: 11, limiteAntes: 2 },
  { tipo: "dia_do_chocolate", nome: "Dia do Chocolate", frase: "Uma semana inteira de chocolate.", cor: "#6B3A22", diasAntes: 6, limiteAntes: 2 },
  { tipo: "dia_dos_pais", nome: "Dia dos Pais", frase: "Uma caixa de presente para o seu pai.", cor: "#1F3A5A", diasAntes: 13, limiteAntes: 3 },
];

export const TIPOS_CAMPANHA: TipoCampanha[] = [...MODELOS.map((m) => m.tipo), "outra"];

export const CORES_BANNER = [
  { nome: "Vermelho", hex: "#7A1F1F" },
  { nome: "Lilás", hex: "#5B3F7A" },
  { nome: "Rosa", hex: "#8A3B5A" },
  { nome: "Vinho", hex: "#8A2A3A" },
  { nome: "Chocolate", hex: "#6B3A22" },
  { nome: "Azul", hex: "#1F3A5A" },
  { nome: "Verde", hex: "#1F4D3A" },
];

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function pascoa(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return dataISO(new Date(ano, mes - 1, dia));
}

// Segundo domingo do mês (mês de 1 a 12).
function segundoDomingo(ano: number, mes: number): string {
  const primeiro = new Date(ano, mes - 1, 1).getDay();
  const primeiroDomingo = 1 + ((7 - primeiro) % 7);
  return dataISO(new Date(ano, mes - 1, primeiroDomingo + 7));
}

export function dataDoEvento(tipo: TipoCampanha, ano: number): string | null {
  switch (tipo) {
    case "natal":
      return `${ano}-12-25`;
    case "pascoa":
      return pascoa(ano);
    case "dia_das_maes":
      return segundoDomingo(ano, 5);
    case "dia_dos_namorados":
      return `${ano}-06-12`;
    case "dia_do_chocolate":
      return `${ano}-07-07`;
    case "dia_dos_pais":
      return segundoDomingo(ano, 8);
    default:
      return null;
  }
}

// Próxima vez que a data acontece, a partir de hoje.
export function proximoEvento(tipo: TipoCampanha, hoje: string): string | null {
  const ano = Number(hoje.slice(0, 4));
  const esteAno = dataDoEvento(tipo, ano);
  if (!esteAno) return null;
  return esteAno >= hoje ? esteAno : dataDoEvento(tipo, ano + 1);
}

// Campanha deste tipo que ainda não acabou (no ar, pausada, agendada ou rascunho):
// é a da próxima data, então o modelo abre ela em vez de criar outra igual.
export function campanhaDoProximoEvento(tipo: TipoCampanha, campanhas: Campanha[], hoje: string): Campanha | null {
  if (tipo === "outra") return null;
  return campanhas.filter((c) => c.tipo === tipo && c.fim >= hoje).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] ?? null;
}

export interface Sugestao {
  nome: string;
  inicio: string;
  fim: string;
  limiteEncomenda: string;
  fraseBanner: string;
  cor: string;
}

export function sugestaoDeCampanha(tipo: TipoCampanha, hoje: string): Sugestao | null {
  const modelo = MODELOS.find((m) => m.tipo === tipo);
  const evento = proximoEvento(tipo, hoje);
  if (!modelo || !evento) return null;
  // No Natal a campanha termina na véspera; nas outras datas, no próprio dia.
  const fim = tipo === "natal" ? somarDias(evento, -1) : evento;
  return {
    nome: modelo.nome,
    inicio: somarDias(evento, -modelo.diasAntes),
    fim,
    limiteEncomenda: somarDias(evento, -modelo.limiteAntes),
    fraseBanner: modelo.frase,
    cor: modelo.cor,
  };
}
