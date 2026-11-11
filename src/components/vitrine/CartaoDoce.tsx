import Link from "next/link";
import type { Doce } from "@/lib/tipos";
import { formatarPreco, type Estoque } from "@/lib/regras";
import { ImagemDoce } from "../ImagemDoce";
import { IconeCoracao } from "../Icones";
import { COR_ESTOQUE, COR_SELO, cx } from "../ui";

export function CartaoDoce({
  doce,
  estoque,
  selo,
  favorito,
  aoFavoritar,
}: {
  doce: Doce;
  estoque: Estoque;
  selo: string | null;
  favorito: boolean;
  aoFavoritar: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-3xl border border-dourado/12 bg-cacau-900 p-2 pb-3.5">
      <Link href={`/doce/${doce.id}`} className="flex flex-col gap-2.5 text-creme">
        <div className="fundo-vitrine relative overflow-hidden rounded-[18px] transition-transform duration-300 group-hover:-translate-y-0.5">
          <div className={cx(!estoque.disponivel && "opacity-40")}>
            <ImagemDoce doce={doce} tamanhos="(max-width: 448px) 45vw, 200px" />
          </div>
          {!estoque.disponivel && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cacau-900 px-3 py-1.5 text-xs font-bold whitespace-nowrap">
              Esgotado
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 px-1.5">
          <span className="min-h-[35px] text-sm leading-tight font-semibold">{doce.nome}</span>
          <span className={cx("flex items-center gap-1.5 text-[11px] font-semibold", COR_ESTOQUE[estoque.tom])}>
            <span className="size-1.5 rounded-full bg-current" />
            {estoque.texto}
          </span>
          {!doce.contemGluten && (
            <span className="self-start rounded-full border border-dourado/40 px-2 py-0.5 text-[10px] font-bold text-dourado">
              Sem glúten
            </span>
          )}
          <span className="font-display text-[19px] font-semibold text-dourado">{formatarPreco(doce.precoCentavos)}</span>
        </div>
      </Link>
      {selo && estoque.disponivel && (
        <span
          className={cx(
            "absolute top-4 left-4 rounded-full px-2.5 py-1 text-[10px] font-bold text-cacau-900",
            COR_SELO[selo] ?? "bg-[#F6C9C9]",
          )}
        >
          {selo}
        </span>
      )}
      <button
        type="button"
        onClick={aoFavoritar}
        aria-pressed={favorito}
        aria-label={`${favorito ? "Remover dos favoritos" : "Favoritar"}: ${doce.nome}`}
        className="absolute top-2 right-2 flex size-11 items-center justify-center active:scale-95"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-white/80">
          <IconeCoracao
            tamanho={17}
            strokeWidth={2}
            className={favorito ? "fill-favorito text-favorito" : "text-cacau-800"}
          />
        </span>
      </button>
    </div>
  );
}
