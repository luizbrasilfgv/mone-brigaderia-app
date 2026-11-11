"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import type { Doce } from "@/lib/tipos";
import { LOJA } from "@/lib/loja";
import { useFavoritos, useHoje } from "@/lib/hooks";
import { datasDeEncomenda, estoqueDoDoce, formatarPreco, mensagemDoDoce, precoDoSabor, rotuloData } from "@/lib/regras";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { IlustracaoDoce } from "../IlustracaoDoce";
import {
  IconeAlerta,
  IconeCaixa,
  IconeCheck,
  IconeConversa,
  IconeCoracao,
  IconeMais,
  IconeMenos,
  IconeRelogio,
  IconeVoltar,
} from "../Icones";
import { botaoWhatsApp, cx, escolha, rotulo } from "../ui";

function Alergenico({ contem, nome }: { contem: boolean; nome: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold",
        contem ? "border-rosa/45 text-rosa" : "border-dourado/45 text-dourado",
      )}
    >
      {contem ? <IconeAlerta tamanho={16} /> : <IconeCheck tamanho={16} />}
      {contem ? `Contém ${nome}` : `Sem ${nome}`}
    </span>
  );
}

function Info({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] border border-dourado/12 bg-cacau-900 p-3.5 text-dourado">
      {icone}
      <span className="text-[13px] leading-tight font-semibold text-creme">{texto}</span>
    </div>
  );
}

export function FichaDoce({ doce }: { doce: Doce }) {
  const hoje = useHoje();
  const { ids: favoritos, alternar } = useFavoritos();
  const [saborId, setSaborId] = useState(doce.sabores[0]?.id);
  const [quantidade, setQuantidade] = useState(1);
  const [data, setData] = useState<string | null>(null);
  const [zapAberto, setZapAberto] = useState(false);
  const fecharZap = useCallback(() => setZapAberto(false), []);

  const sabor = doce.sabores.find((s) => s.id === saborId);
  const preco = precoDoSabor(doce, sabor);
  const estoque = estoqueDoDoce(doce);
  const maximo = doce.sobEncomenda ? 99 : Math.max(doce.quantidadeHoje, 1);
  const prazo = doce.prazoDias ?? 1;
  const datas = hoje && doce.sobEncomenda ? datasDeEncomenda(prazo, hoje) : [];
  // Sem escolha, vale a primeira data possível.
  const dataEscolhida = data === "outra" ? null : (data ?? datas[0] ?? null);
  const favorito = favoritos.has(doce.id);
  const foto = doce.fotos[0];

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <div className="relative">
        <div className="fundo-vitrine relative flex h-[400px] items-center justify-center overflow-hidden">
          {foto ? (
            <Image src={foto} alt={doce.nome} fill priority sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
          ) : doce.ilustracao ? (
            <div className="w-[330px] animate-[flutua_6s_ease-in-out_infinite]">
              <IlustracaoDoce ilustracao={doce.ilustracao} />
            </div>
          ) : null}
        </div>
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <Link
            href="/"
            aria-label="Voltar para a vitrine"
            className="flex size-11 items-center justify-center rounded-full bg-white/75 text-cacau-900 backdrop-blur-md active:scale-95"
          >
            <IconeVoltar />
          </Link>
          <button
            type="button"
            onClick={() => alternar(doce.id)}
            aria-pressed={favorito}
            aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
            className="flex size-11 items-center justify-center rounded-full bg-white/75 backdrop-blur-md active:scale-95"
          >
            <IconeCoracao tamanho={20} strokeWidth={2} className={favorito ? "fill-favorito text-favorito" : "text-cacau-900"} />
          </button>
        </div>
      </div>

      <div className="relative -mt-7 flex flex-col gap-5 rounded-t-[30px] bg-cacau-950 px-5 pt-6 pb-7">
        <div className="flex flex-wrap gap-2">
          {doce.sobEncomenda ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pessego px-2.5 py-1 text-[11px] font-bold text-cacau-900">
                <IconeRelogio tamanho={13} strokeWidth={2.2} />
                Sob encomenda
              </span>
              <span className="rounded-full border border-pessego/40 px-2.5 py-1 text-[11px] font-bold text-pessego">
                Fica pronto em {prazo} {prazo === 1 ? "dia" : "dias"}
              </span>
            </>
          ) : (
            <>
              {doce.selo === "mais_vendido" && (
                <span className="rounded-full bg-dourado px-2.5 py-1 text-[11px] font-bold text-cacau-900">Mais vendido</span>
              )}
              {doce.selo === "novo" && (
                <span className="rounded-full bg-creme px-2.5 py-1 text-[11px] font-bold text-cacau-900">Novo</span>
              )}
              {estoque.disponivel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-menta/12 px-2.5 py-1 text-[11px] font-bold text-menta">
                  <span className="size-1.5 animate-pulsa rounded-full bg-menta" />
                  Feito hoje
                </span>
              )}
              <span
                className={cx(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  estoque.disponivel ? "border-dourado/35 text-dourado" : "border-creme-400/45 text-creme-400",
                )}
              >
                {estoque.texto}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] leading-[1.05] font-semibold">{doce.nome}</h1>
          <p className="text-[15px] leading-relaxed text-creme-200">{doce.descricao}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-[30px] font-semibold text-dourado">{formatarPreco(preco)}</span>
          <span className="text-[13px] text-creme-400">{doce.unidade}</span>
        </div>

        {doce.sabores.length > 1 && (
          <div role="group" aria-label="Sabor" className="flex flex-col gap-2.5">
            <span className={rotulo}>Sabor</span>
            <div className="flex flex-wrap gap-2">
              {doce.sabores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === saborId}
                  onClick={() => setSaborId(s.id)}
                  className={cx("h-11 rounded-[14px] px-4", escolha(s.id === saborId))}
                >
                  {s.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {doce.sobEncomenda && datas.length > 0 && (
          <div role="group" aria-label="Para quando" className="flex flex-col gap-2.5">
            <span className={rotulo}>Para quando?</span>
            <div className="flex flex-wrap gap-2">
              {datas.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === dataEscolhida}
                  onClick={() => setData(d)}
                  className={cx("h-11 rounded-[14px] px-3.5", escolha(d === dataEscolhida))}
                >
                  {rotuloData(d)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={data === "outra"}
                onClick={() => setData("outra")}
                className={cx("h-11 rounded-[14px] px-3.5", escolha(data === "outra"))}
              >
                Outra data
              </button>
            </div>
            <span className="text-xs text-creme-400">
              A primeira data já respeita o prazo de {prazo} {prazo === 1 ? "dia" : "dias"}.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {doce.sobEncomenda ? (
            <>
              <Info icone={<IconeRelogio />} texto="Feito na hora do pedido" />
              <Info icone={<IconeCaixa />} texto={`Pronto em ${prazo} ${prazo === 1 ? "dia" : "dias"}`} />
            </>
          ) : (
            <>
              <Info icone={<IconeRelogio />} texto="Feito no dia" />
              <Info icone={<IconeCaixa />} texto={estoque.texto} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <h2 className={rotulo}>Alergênicos</h2>
          <div className="flex flex-wrap gap-2">
            <Alergenico contem={doce.contemGluten} nome="glúten" />
            <Alergenico contem={doce.contemLactose} nome="lactose" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Composição</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.composicao}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Conservação</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.conservacao}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-24 max-w-md items-center gap-3 border-t border-dourado/14 bg-cacau-950/88 px-5 pt-3.5 pb-6 backdrop-blur-lg">
        <div className="flex h-[52px] items-center rounded-full border border-dourado/22">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center rounded-full active:scale-95"
          >
            <IconeMenos tamanho={18} />
          </button>
          <span aria-live="polite" className="min-w-[22px] text-center text-base font-bold">
            {quantidade}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQuantidade((q) => Math.min(maximo, q + 1))}
            className="flex size-11 items-center justify-center rounded-full active:scale-95"
          >
            <IconeMais tamanho={18} />
          </button>
        </div>
        {estoque.disponivel ? (
          <button
            type="button"
            onClick={() => setZapAberto(true)}
            className={`${botaoWhatsApp} h-[52px] grow text-[15px]`}
          >
            <IconeConversa tamanho={20} strokeWidth={2} />
            {doce.sobEncomenda ? "Encomendar" : "Pedir no WhatsApp"}
          </button>
        ) : (
          <span className="flex h-[52px] grow items-center justify-center rounded-full bg-cacau-800 text-[15px] font-bold text-creme-400">
            Esgotado hoje
          </span>
        )}
      </div>

      <FolhaWhatsApp
        aberta={zapAberto}
        aoFechar={fecharZap}
        mensagem={mensagemDoDoce({ nomeLoja: LOJA.nome, doce, sabor, quantidade, data: dataEscolhida })}
        explicacao={
          doce.sobEncomenda
            ? "A conversa abre com a encomenda e a data já escritas. É só tocar em enviar."
            : "A conversa abre com o pedido já escrito. É só tocar em enviar."
        }
      />
    </div>
  );
}
