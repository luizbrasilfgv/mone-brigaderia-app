"use client";

import { useEffect } from "react";
import { LOJA, linkWhatsApp } from "@/lib/loja";
import { IconeConversa } from "./Icones";
import { botaoWhatsApp } from "./ui";

// Folha que sobe da parte de baixo, mostra a mensagem pronta e abre o WhatsApp.
export function FolhaWhatsApp({
  aberta,
  aoFechar,
  mensagem,
  explicacao,
}: {
  aberta: boolean;
  aoFechar: () => void;
  mensagem: string;
  explicacao: string;
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Encomendar pelo WhatsApp"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md animate-sobe flex-col gap-3.5 rounded-t-[32px] border-t border-dourado/20 bg-cacau-900 px-[22px] pt-[26px] pb-7"
      >
        <h2 className="font-display text-2xl font-semibold">Encomendar pelo WhatsApp</h2>
        <p className="text-sm leading-relaxed text-creme-200">{explicacao}</p>
        <p className="max-w-[300px] self-end whitespace-pre-line rounded-[18px] rounded-br-[4px] bg-pessego px-3.5 py-3 text-sm leading-normal text-cacau-900">
          {mensagem}
        </p>
        <a
          href={linkWhatsApp(mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={aoFechar}
          className={`${botaoWhatsApp} h-[54px] text-base`}
        >
          <IconeConversa strokeWidth={2} />
          Abrir WhatsApp
        </a>
        <button type="button" onClick={aoFechar} className="h-11 text-sm font-semibold text-creme-200">
          Agora não
        </button>
        <span className="text-center text-xs text-creme-400">WhatsApp {LOJA.whatsappExibicao}</span>
      </div>
    </div>
  );
}
