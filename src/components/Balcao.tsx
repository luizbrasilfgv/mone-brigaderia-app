"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Campanha, Doce } from "@/lib/tipos";
import { LOJA } from "@/lib/loja";
import { useHoje } from "@/lib/hooks";
import { campanhasNoAr, doceApareceNaVitrine, estoqueDoDoce, formatarPreco } from "@/lib/regras";
import { ImagemDoce } from "./ImagemDoce";
import { cx } from "./ui";

const SEGUNDOS_POR_DOCE = 6;
const semAssinatura = () => () => {};

// Tela para TV ou tablet na loja: mostra os doces disponíveis em sequência.
export function Balcao({ doces, campanhas }: { doces: Doce[]; campanhas: Campanha[] }) {
  const hoje = useHoje();
  const endereco = useSyncExternalStore(semAssinatura, () => window.location.origin, () => null);
  const [indice, setIndice] = useState(0);

  const idsNoAr = new Set(hoje ? campanhasNoAr(campanhas, hoje).map((c) => c.id) : []);
  const lista = doces.filter((d) => doceApareceNaVitrine(d, idsNoAr) && estoqueDoDoce(d).disponivel);
  const total = lista.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => setIndice((i) => (i + 1) % total), SEGUNDOS_POR_DOCE * 1000);
    return () => clearInterval(timer);
  }, [total]);

  const doce = lista[indice % Math.max(total, 1)];
  if (!doce) return null;
  const estoque = estoqueDoDoce(doce);

  return (
    <main className="relative grid min-h-dvh grid-cols-1 items-center gap-10 overflow-hidden p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-16">
      <div className="pointer-events-none absolute top-0 -left-32 size-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(230,196,142,0.2),rgba(230,196,142,0))]" />

      <div
        key={doce.id}
        className="fundo-vitrine relative mx-auto aspect-square w-full max-w-[min(70vh,560px)] animate-entra overflow-hidden rounded-[44px] border-4 border-pessego shadow-2xl"
      >
        <ImagemDoce doce={doce} tamanhos="560px" prioridade />
      </div>

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={56} height={56} className="rounded-full" />
          <span className="font-display text-2xl font-semibold text-dourado">{LOJA.nome}</span>
        </div>
        <span
          className={cx(
            "inline-flex items-center gap-2.5 text-sm font-bold tracking-[0.14em] uppercase",
            doce.sobEncomenda ? "text-pessego" : "text-menta",
          )}
        >
          <span className="size-2 animate-pulsa rounded-full bg-current" />
          {doce.sobEncomenda ? estoque.texto : "Na vitrine agora"}
        </span>
        <h1 className="font-display text-5xl leading-none font-semibold md:text-6xl">{doce.nome}</h1>
        <p className="max-w-[480px] text-xl leading-relaxed text-creme-200 md:text-[22px]">{doce.descricao}</p>
        <span className="font-display text-5xl font-semibold text-dourado">{formatarPreco(doce.precoCentavos)}</span>

        <div className="mt-4 flex items-center gap-5 rounded-[26px] border border-dourado/18 bg-creme/[0.06] p-4 backdrop-blur-lg">
          {endereco && (
            <div className="shrink-0 rounded-xl bg-creme p-2">
              <QRCodeSVG value={endereco} size={88} bgColor="#F7ECDD" fgColor="#1C0D08" title="QR Code da vitrine" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl font-semibold">Peça pelo celular</span>
            <span className="text-[15px] leading-snug text-creme-200">
              Aponte a câmera, escolha seus doces e mande o pedido no WhatsApp {LOJA.whatsappExibicao}.
            </span>
          </div>
        </div>

        {total > 1 && (
          <div role="group" aria-label="Escolher doce" className="flex items-center">
            {lista.map((d, i) => {
              const atual = i === indice % total;
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-label={`Mostrar ${d.nome}`}
                  aria-pressed={atual}
                  onClick={() => setIndice(i)}
                  className="flex h-11 items-center px-1"
                >
                  <span className={cx("block h-1.5 rounded-full transition-all", atual ? "w-10 bg-dourado" : "w-3.5 bg-creme/30")} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
