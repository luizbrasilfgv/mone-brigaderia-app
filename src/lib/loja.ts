export const LOJA = {
  nome: "Mone Brigaderia",
  // Número só para mostrar na tela. O link usa NEXT_PUBLIC_WHATSAPP_NUMERO.
  whatsappExibicao: "98063-1673",
  logo: "/imagens/mone-logo.png",
};

// Número completo com país e DDD, só dígitos (ex.: 5521980631673).
// Sem ele, o link abre o WhatsApp para a cliente escolher o contato.
const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO?.replace(/\D/g, "") ?? "";

export function linkWhatsApp(mensagem: string): string {
  const texto = encodeURIComponent(mensagem);
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
