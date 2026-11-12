import { SEM_HORARIO, type Horarios } from "./horarios";

export const LOJA = {
  nome: "Mone Brigaderia",
  logo: "/imagens/mone-logo.png",
};

// Ingredientes que podem estar na cozinha, para o "Pode conter traços de…".
export const TRACOS = ["leite", "trigo", "ovo", "castanhas", "amendoim", "soja"] as const;
export type Traco = (typeof TRACOS)[number];

export function ehTraco(valor: unknown): valor is Traco {
  return TRACOS.includes(valor as Traco);
}

// O que a Administração edita em Painel > Dados da loja (tabela loja). Sem banco
// (modo demonstração), valem os padrões abaixo.
export interface DadosLoja {
  // 55 + DDD + número, só dígitos.
  whatsapp: string;
  horarios: Horarios;
  // Textos curtos que só informam. Vazio = não aparece.
  retirada: string;
  entrega: string;
  pagamento: string;
  tracos: Traco[];
}

export const LOJA_PADRAO: DadosLoja = {
  whatsapp: "5521980631673",
  horarios: SEM_HORARIO,
  retirada: "",
  entrega: "",
  pagamento: "",
  tracos: [],
};

// Aceita o número escrito de qualquer jeito ("(21) 98063-1673", "+55 21 98063-1673") e
// devolve só os dígitos, com o 55 na frente. Vazio se não for um número do Brasil.
export function normalizarWhatsApp(texto: string): string {
  let digitos = String(texto ?? "").replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return /^55[1-9]{2}\d{8,9}$/.test(digitos) ? digitos : "";
}

// "5521980631673" → "(21) 98063-1673"
export function formatarWhatsApp(numero: string): string {
  const partes = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(numero);
  return partes ? `(${partes[1]}) ${partes[2]}-${partes[3]}` : numero;
}

// Abre a conversa com a loja, com a mensagem pronta (se tiver).
export function linkWhatsApp(numero: string, mensagem?: string): string {
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

// Abre o WhatsApp com a mensagem pronta para a pessoa escolher o contato
// (convite de acesso, que vai para a pessoa convidada).
export function linkWhatsAppSemContato(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
