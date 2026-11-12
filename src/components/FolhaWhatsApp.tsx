"use client";

import { useEffect, useId, useRef } from "react";
import type { SituacaoLoja } from "@/lib/horarios";
import { linkWhatsApp, type DadosLoja } from "@/lib/loja";
import { IconeConversa } from "./Icones";
import { InfoDaLoja, NumeroWhatsApp } from "./InfoDaLoja";
import { botaoWhatsApp } from "./ui";

// Folha que sobe da parte de baixo, mostra a mensagem pronta e abre o WhatsApp da loja.
// Só para conversa (Falar com a Mone, Tirar uma dúvida, Pedir para outro dia, Perguntar
// no WhatsApp): o pedido dos doces da vitrine sai pela sacola. Feita com o <dialog> do
// navegador, que prende o foco, fecha no Esc e deixa o fundo inerte.
export function FolhaWhatsApp({
  aberta,
  aoFechar,
  loja,
  mensagem,
  explicacao,
  titulo,
  situacao,
}: {
  aberta: boolean;
  aoFechar: () => void;
  loja: DadosLoja;
  mensagem: string;
  explicacao: string;
  titulo: string;
  // Aberto ou fechado agora (null = sem horário cadastrado).
  situacao?: SituacaoLoja | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberta && !dialogo.open) dialogo.showModal();
    if (!aberta && dialogo.open) dialogo.close();
    // Página escondida pelo Next (Activity) com a folha aberta: tira da camada de cima.
    return () => dialogo.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby={idTitulo}
      className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-md animate-sobe rounded-t-[32px] border-0 border-t border-dourado/20 bg-cacau-900 p-0 text-creme backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {aberta && (
        <div className="flex flex-col gap-3.5 px-[22px] pt-[26px] pb-[calc(20px+env(safe-area-inset-bottom))]">
          <h2 id={idTitulo} className="font-display text-2xl font-semibold">
            {titulo}
          </h2>
          <p className="text-sm leading-relaxed text-creme-200">{explicacao}</p>
          <p className="max-w-[300px] self-end whitespace-pre-line rounded-[18px] rounded-br-[4px] bg-pessego px-3.5 py-3 text-sm leading-normal text-cacau-900">
            {mensagem}
          </p>
          {situacao && !situacao.aberta && (
            <p className="text-[13px] leading-snug text-pessego">{situacao.texto}. Pode mandar: a Mone responde quando abrir.</p>
          )}
          <InfoDaLoja loja={loja} />
          <a
            href={linkWhatsApp(loja.whatsapp, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => ref.current?.close()}
            className={`${botaoWhatsApp} mt-1 h-[54px] shrink-0 text-base`}
          >
            <IconeConversa strokeWidth={2} />
            Abrir WhatsApp
          </a>
          <button type="button" onClick={() => ref.current?.close()} className="h-11 shrink-0 text-sm font-semibold text-creme-200">
            Agora não
          </button>
          <NumeroWhatsApp numero={loja.whatsapp} className="text-xs text-creme-400" />
        </div>
      )}
    </dialog>
  );
}
