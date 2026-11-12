import Image from "next/image";
import type { ReactNode } from "react";
import { LOJA } from "@/lib/loja";
import type { Campanha, Doce } from "@/lib/tipos";
import { nomeDoTipoDeCampanha, type PrazoDaCampanha } from "@/lib/regras";
import { ImagemDoce } from "./ImagemDoce";
import { cx } from "./ui";

export const botaoBanner =
  "inline-flex h-11 items-center self-start rounded-full bg-pessego px-4 text-[13px] font-bold text-[#5A1414] active:scale-95";

// Banner da campanha: o mesmo na vitrine e na prévia do painel, para não divergirem.
// A foto é de um doce da campanha; sem doce, fica a logo.
// Linha 1: a frase. Linha 2: o prazo de encomenda (encomendaAberta).
export function BannerCampanha({
  campanha,
  prazo,
  doce,
  botao,
}: {
  campanha: Pick<Campanha, "tipo" | "nome" | "fraseBanner" | "cor">;
  prazo: PrazoDaCampanha | null;
  doce?: Doce;
  botao?: ReactNode;
}) {
  return (
    <section
      aria-label={`Campanha ${campanha.nome}`}
      className="relative min-h-[150px] overflow-hidden rounded-[28px] border border-dourado/25 transition-colors"
      style={{ background: campanha.cor }}
    >
      <div className="absolute -top-12 -right-10 size-[220px] rounded-full bg-[radial-gradient(closest-side,rgba(240,207,152,0.32),rgba(240,207,152,0))]" />
      {doce ? (
        <div className="fundo-vitrine absolute top-5 right-4 w-[108px] animate-flutua overflow-hidden rounded-[22px] border-[3px] border-pessego shadow-2xl">
          <ImagemDoce doce={doce} tamanhos="108px" />
        </div>
      ) : (
        // Campanha sem doce próprio: só o texto e a logo.
        <Image src={LOJA.logo} alt="" width={84} height={84} className="absolute top-6 right-5 rounded-full opacity-90" />
      )}
      <div className="relative flex min-h-[150px] w-[214px] flex-col gap-1 py-4 pl-[18px]">
        <span className="text-[11px] font-bold tracking-[0.14em] text-[#F0CF98] uppercase">{nomeDoTipoDeCampanha(campanha.tipo)}</span>
        <span className="font-display text-2xl leading-tight font-semibold text-[#FFF4E6]">{campanha.nome}</span>
        {campanha.fraseBanner && <span className="text-xs leading-snug text-[#F6DCCB]">{campanha.fraseBanner}</span>}
        {prazo?.texto && (
          <span className={cx("text-xs leading-snug font-bold", prazo.aberta ? "text-[#FFE3B3]" : "text-[#F6DCCB]")}>
            {prazo.texto}
          </span>
        )}
        {botao && <div className="mt-auto flex pt-2">{botao}</div>}
      </div>
    </section>
  );
}
