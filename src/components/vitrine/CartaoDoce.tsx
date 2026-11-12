import Link from "next/link";
import type { ReactNode } from "react";
import type { Doce } from "@/lib/tipos";
import { formatarPreco, precoMinimo, temPrecosDiferentes, type Estoque } from "@/lib/regras";
import { ImagemDoce } from "../ImagemDoce";
import { IconeCoracao } from "../Icones";
import { COR_ESTOQUE, COR_SELO, cx } from "../ui";

// Linha da vitrine: foto quadrada pequena à esquerda e, à direita, nome, descrição curta,
// situação e preço. O mesmo componente faz a prévia do painel (sem link nem coração).
export function CartaoDoce({
  doce,
  estoque,
  selo,
  semGluten,
  dicaEsgotado,
  naSacola = 0,
  favorito = false,
  aoFavoritar,
  previa = false,
  foto,
}: {
  doce: Doce;
  estoque: Estoque;
  selo: string | null;
  // "Sem glúten" só quando o doce não leva trigo e a cozinha não usa trigo.
  semGluten: boolean;
  // Depois de "Esgotado": "Peça para amanhã" (ou "para outro dia", se amanhã a loja fecha).
  dicaEsgotado: string;
  // Unidades deste doce na sacola (todas as opções).
  naSacola?: number;
  favorito?: boolean;
  aoFavoritar?: () => void;
  // Prévia do painel: sem link e sem coração.
  previa?: boolean;
  // Foto que ainda não foi salva (prévia do painel).
  foto?: ReactNode;
}) {
  const conteudo = (
    <>
      <div className="fundo-vitrine relative size-24 shrink-0 overflow-hidden rounded-2xl">
        <div className={cx("size-full", !estoque.disponivel && "opacity-40")}>
          {foto ?? <ImagemDoce doce={doce} tamanhos="96px" decorativa />}
        </div>
        {naSacola > 0 && (
          <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 rounded-full bg-dourado px-2 py-0.5 text-xs font-bold whitespace-nowrap text-cacau-900">
            {naSacola} na sacola
          </span>
        )}
      </div>
      <div className="flex min-w-0 grow flex-col gap-1 py-0.5">
        <span className="text-[15px] leading-tight font-semibold">
          {doce.nome}
          {naSacola > 0 && <span className="sr-only">, {naSacola} na sacola</span>}
        </span>
        {doce.descricao && <span className="line-clamp-2 text-[13px] leading-snug text-creme-400">{doce.descricao}</span>}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cx("inline-flex items-center gap-1.5 text-xs font-semibold", COR_ESTOQUE[estoque.tom])}>
            <span className="size-1.5 shrink-0 rounded-full bg-current" />
            {estoque.disponivel ? estoque.texto : `${estoque.texto} · ${dicaEsgotado}`}
          </span>
          {selo && estoque.disponivel && (
            <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold text-cacau-900", COR_SELO[selo] ?? "bg-[#F6C9C9]")}>{selo}</span>
          )}
          {semGluten && <span className="rounded-full border border-dourado/40 px-2 py-0.5 text-xs font-bold text-dourado">Sem glúten</span>}
        </span>
        <span className="mt-auto flex items-baseline gap-1.5 pt-0.5">
          {temPrecosDiferentes(doce) && <span className="text-xs font-semibold text-creme-200">a partir de</span>}
          <span className="font-display text-lg font-semibold text-dourado">{formatarPreco(precoMinimo(doce))}</span>
        </span>
      </div>
    </>
  );

  return (
    <div className={cx("relative flex rounded-[22px] border border-dourado/12 bg-cacau-900 p-2.5", !previa && "pr-11")}>
      {previa ? (
        <div className="flex min-w-0 grow gap-3">{conteudo}</div>
      ) : (
        <Link href={`/doce/${doce.id}`} className="flex min-w-0 grow gap-3 text-creme">
          {conteudo}
        </Link>
      )}
      {!previa && aoFavoritar && (
        <button
          type="button"
          onClick={aoFavoritar}
          aria-pressed={favorito}
          aria-label={`${favorito ? "Remover dos favoritos" : "Favoritar"}: ${doce.nome}`}
          className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center active:scale-95"
        >
          <IconeCoracao tamanho={20} strokeWidth={2} className={favorito ? "fill-favorito text-favorito" : "text-creme-400"} />
        </button>
      )}
    </div>
  );
}
