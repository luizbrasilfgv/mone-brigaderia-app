"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Campanha, Doce } from "@/lib/tipos";
import { LOJA, formatarWhatsApp, type DadosLoja } from "@/lib/loja";
import { hojeNaLoja } from "@/lib/horarios";
import { useAgora } from "@/lib/hooks";
import { campanhasNoAr, doceApareceNaVitrine, estoqueDoDoce, formatarPreco } from "@/lib/regras";
import { ImagemDoce } from "./ImagemDoce";
import { cx } from "./ui";

const SEGUNDOS_POR_DOCE = 6;
// A TV fica ligada o dia todo: busca os doces de novo de tempos em tempos.
const MINUTOS_PARA_ATUALIZAR = 3;

// QR para a vitrine pública, com o endereço escrito embaixo para quem não usa QR.
function QrDaVitrine({ endereco, grande }: { endereco: string; grande?: boolean }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="rounded-xl bg-creme p-2">
        <QRCodeSVG
          value={`${endereco}/?origem=balcao`}
          size={220}
          bgColor="#F7ECDD"
          fgColor="#1C0D08"
          title="QR Code da vitrine"
          className={grande ? "size-[180px] md:size-[220px]" : "size-[112px] md:size-[200px]"}
        />
      </div>
      <span className="text-sm font-semibold text-creme-200">{endereco.replace(/^https?:\/\//, "")}</span>
    </div>
  );
}

// Tela para TV ou tablet na loja: mostra os doces disponíveis em sequência.
export function Balcao({
  doces,
  campanhas,
  loja,
  agora: agoraDoServidor,
  endereco,
}: {
  doces: Doce[];
  campanhas: Campanha[];
  loja: DadosLoja;
  agora: number;
  // Endereço público do site (SITE_URL), para o QR não levar ao endereço que abriu a TV.
  endereco: string;
}) {
  const router = useRouter();
  const hoje = hojeNaLoja(useAgora(agoraDoServidor));
  const [indice, setIndice] = useState(0);

  const idsNoAr = new Set(campanhasNoAr(campanhas, hoje).map((c) => c.id));
  const lista = doces.filter((d) => doceApareceNaVitrine(d, idsNoAr) && estoqueDoDoce(d, hoje).disponivel);
  const total = lista.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => setIndice((i) => (i + 1) % total), SEGUNDOS_POR_DOCE * 1000);
    return () => clearInterval(timer);
  }, [total]);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), MINUTOS_PARA_ATUALIZAR * 60_000);
    return () => clearInterval(timer);
  }, [router]);

  const doce = lista[indice % Math.max(total, 1)];

  // Nada disponível agora: em vez de tela preta, o convite para encomendar.
  if (!doce) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center gap-7 overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute top-0 -left-32 size-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(230,196,142,0.2),rgba(230,196,142,0))]" />
        <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={120} height={120} className="relative rounded-full" priority />
        <h1 className="relative font-display text-5xl leading-tight font-semibold md:text-6xl">{LOJA.nome}</h1>
        <p className="relative max-w-[560px] text-2xl leading-snug text-creme-200 md:text-3xl">
          Encomende pelo WhatsApp {formatarWhatsApp(loja.whatsapp)}
        </p>
        <div className="relative">
          <QrDaVitrine endereco={endereco} grande />
        </div>
      </main>
    );
  }

  const estoque = estoqueDoDoce(doce, hoje);

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
          {doce.sobEncomenda ? estoque.texto : estoque.deHoje ? "Na vitrine agora" : "Pronta entrega"}
        </span>
        <h1 className="font-display text-5xl leading-none font-semibold md:text-6xl">{doce.nome}</h1>
        <p className="max-w-[480px] text-xl leading-relaxed text-creme-200 md:text-[22px]">{doce.descricao}</p>
        <span className="font-display text-5xl font-semibold text-dourado">{formatarPreco(doce.precoCentavos)}</span>

        <div className="mt-4 flex items-center gap-5 rounded-[26px] border border-dourado/18 bg-creme/[0.06] p-4 backdrop-blur-lg">
          <QrDaVitrine endereco={endereco} />
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl font-semibold">Peça pelo celular</span>
            <span className="text-[15px] leading-snug text-creme-200">
              Aponte a câmera, escolha seus doces e mande o pedido no WhatsApp {formatarWhatsApp(loja.whatsapp)}.
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
