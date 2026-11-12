"use client";

import { useEffect } from "react";
import type { SituacaoLoja } from "@/lib/horarios";
import { linkWhatsApp, type DadosLoja } from "@/lib/loja";
import { IconeConversa } from "./Icones";
import { InfoDaLoja, NumeroWhatsApp } from "./InfoDaLoja";
import { botaoWhatsApp } from "./ui";

// Folha que sobe da parte de baixo, mostra a mensagem pronta e abre o WhatsApp da loja.
// Embaixo do balão vai o "Como funciona": retirada, entrega, pagamento e horário.
export function FolhaWhatsApp({
  aberta,
  aoFechar,
  loja,
  mensagem,
  explicacao,
  titulo = "Encomendar pelo WhatsApp",
  dica,
  situacao,
}: {
  aberta: boolean;
  aoFechar: () => void;
  loja: DadosLoja;
  mensagem: string;
  explicacao: string;
  titulo?: string;
  // Linha final do "Como funciona" (ex.: "Quer outro sabor? É só escrever na conversa.").
  dica?: string;
  // Aberto ou fechado agora (null = sem horário cadastrado).
  situacao?: SituacaoLoja | null;
}) {
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta, aoFechar]);

  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-dvh w-full max-w-md animate-sobe flex-col gap-3.5 overflow-y-auto rounded-t-[32px] border-t border-dourado/20 bg-cacau-900 px-[22px] pt-[26px] pb-5"
      >
        <h2 className="font-display text-2xl font-semibold">{titulo}</h2>
        <p className="text-sm leading-relaxed text-creme-200">{explicacao}</p>
        <p className="max-w-[300px] self-end whitespace-pre-line rounded-[18px] rounded-br-[4px] bg-pessego px-3.5 py-3 text-sm leading-normal text-cacau-900">
          {mensagem}
        </p>
        {situacao && !situacao.aberta && (
          <p className="text-[13px] leading-snug text-pessego">
            {situacao.texto}. Pode mandar: a Mone responde quando abrir.
          </p>
        )}
        <InfoDaLoja loja={loja} />
        {dica && <p className="text-[13px] leading-snug text-creme-400">{dica}</p>}
        <a
          href={linkWhatsApp(loja.whatsapp, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={aoFechar}
          className={`${botaoWhatsApp} mt-1 h-[54px] shrink-0 text-base`}
        >
          <IconeConversa strokeWidth={2} />
          Abrir WhatsApp
        </a>
        <button type="button" onClick={aoFechar} className="h-11 shrink-0 text-sm font-semibold text-creme-200">
          Agora não
        </button>
        <NumeroWhatsApp numero={loja.whatsapp} className="text-xs text-creme-400" />
      </div>
    </div>
  );
}
