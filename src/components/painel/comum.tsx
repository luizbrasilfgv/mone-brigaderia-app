"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { IconeCheck, IconeMais, IconeMenos, IconeVoltar } from "../Icones";
import { botaoRedondo, cx } from "../ui";

// Aviso que aparece no topo por alguns segundos.
export function useAviso(): [ReactNode, (texto: string) => void] {
  const [texto, setTexto] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mostrar = (novo: string) => {
    setTexto(novo);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTexto(null), 3000);
  };
  const elemento = texto ? (
    <div
      role="status"
      className="fixed inset-x-5 top-[18px] z-50 mx-auto flex max-w-[calc(28rem-2.5rem)] animate-entra items-center gap-2.5 rounded-[18px] bg-pessego px-4 py-3.5 text-sm font-bold text-cacau-900 shadow-2xl"
    >
      <IconeCheck tamanho={20} className="shrink-0 text-[#2F7A3E]" />
      {texto}
    </div>
  ) : null;
  return [elemento, mostrar];
}

export const AVISO_DEMO = "Modo demonstração: a alteração aparece aqui, mas ainda não é salva no banco.";

export function CabecalhoPainel({
  titulo,
  subtitulo,
  voltar,
  acao,
}: {
  titulo: string;
  subtitulo: string;
  voltar?: string;
  acao?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pt-[18px] pb-1.5">
      {voltar && (
        <Link href={voltar} aria-label="Voltar" className={botaoRedondo}>
          <IconeVoltar />
        </Link>
      )}
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
        <span className="text-xs text-creme-400">{subtitulo}</span>
      </div>
      {acao}
    </header>
  );
}

export function Contador({
  valor,
  aoMudar,
  minimo = 0,
  maximo = 999,
  rotulo,
  texto,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  minimo?: number;
  maximo?: number;
  rotulo: string;
  texto?: string;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex h-11 shrink-0 items-center rounded-full border border-dourado/22">
      <button
        type="button"
        aria-label={`Diminuir: ${rotulo}`}
        onClick={() => aoMudar(Math.max(minimo, valor - 1))}
        className="flex size-11 items-center justify-center rounded-full active:scale-90"
      >
        <IconeMenos tamanho={16} />
      </button>
      <span aria-live="polite" className={cx("text-center font-bold", texto ? "min-w-14 text-[15px]" : "min-w-[30px] text-base", valor === 0 && "text-creme-400")}>
        {texto ?? valor}
      </span>
      <button
        type="button"
        aria-label={`Aumentar: ${rotulo}`}
        onClick={() => aoMudar(Math.min(maximo, valor + 1))}
        className="flex size-11 items-center justify-center rounded-full active:scale-90"
      >
        <IconeMais tamanho={16} />
      </button>
    </div>
  );
}

export function Chave({ ligada, aoMudar, rotulo }: { ligada: boolean; aoMudar: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={aoMudar}
      className="flex h-11 w-[60px] shrink-0 items-center justify-center"
    >
      <span className={cx("relative h-[30px] w-[50px] rounded-full transition-colors", ligada ? "bg-[#3F8F4E]" : "bg-cacau-700")}>
        <span
          className={cx(
            "absolute top-[3px] size-6 rounded-full bg-creme shadow-md transition-[left]",
            ligada ? "left-[23px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}
