// Classes repetidas em várias telas.

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const rotulo = "text-xs font-bold uppercase tracking-[0.12em] text-creme-400";

export const cartao = "rounded-[20px] border border-dourado/12 bg-cacau-900";

export const campo =
  "w-full rounded-[14px] border border-dourado/20 bg-creme/[0.04] px-3.5 text-base text-creme placeholder:text-creme-600 focus:outline-2 focus:outline-dourado";

export const botaoPrimario =
  "flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-dourado text-base font-bold text-cacau-900 transition-transform active:scale-[0.97]";

export const botaoWhatsApp =
  "flex items-center justify-center gap-2 rounded-full bg-whatsapp font-bold text-whatsapp-texto transition-transform active:scale-[0.97]";

// Barra presa embaixo da tela (botão de salvar, Adicionar, Enviar): 95% de opacidade e
// folga para a barrinha do iPhone (env() só funciona com viewportFit: "cover").
export const barraFixa =
  "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t border-dourado/14 bg-cacau-950/95 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-lg";

export const botaoRedondo =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-dourado/16 bg-creme/[0.06] text-creme transition-transform active:scale-95";

// Chip ou botão de escolha (sabor, data, categoria...).
export function escolha(ativo: boolean): string {
  return cx(
    "border text-sm font-semibold transition-colors active:scale-[0.97]",
    ativo ? "border-dourado bg-dourado/14 text-dourado" : "border-dourado/18 bg-creme/[0.03] text-creme-200",
  );
}

export const COR_ESTOQUE = {
  ok: "text-menta",
  pouco: "text-rosa",
  esgotado: "text-creme-400",
  encomenda: "text-pessego",
  confirmar: "text-creme-200",
} as const;

export const COR_SELO: Record<string, string> = {
  "Mais vendido": "bg-dourado",
  Novo: "bg-creme",
  "Últimas unidades": "bg-rosa",
};
