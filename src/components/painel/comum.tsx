"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Resultado } from "@/app/painel/acoes";
import { IconeAlerta, IconeCheck, IconeFechar, IconeMais, IconeMenos, IconeVoltar } from "../Icones";
import { botaoPrimario, botaoRedondo, cx } from "../ui";

export interface AcaoDoAviso {
  rotulo: string;
  aoTocar?: () => void;
  href?: string;
}

interface Aviso {
  texto: string;
  deuCerto: boolean;
  acao?: AcaoDoAviso;
}

// Endereço para entrar de novo e voltar para esta mesma página.
function linkEntrarDeNovo(): string {
  const volta = window.location.pathname + window.location.search;
  return `/entrar?motivo=expirou&volta=${encodeURIComponent(volta)}`;
}

// Aviso no topo da tela. O de sucesso some sozinho; o de erro fica até a pessoa
// fechar e, quando dá, traz o que fazer ("Tentar de novo", "Entrar de novo").
export function useAviso(): [
  ReactNode,
  (texto: string, deuCerto?: boolean, acao?: AcaoDoAviso) => void,
  (resultado: Resultado, tentarDeNovo?: () => void) => void,
] {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fechar = useCallback(() => {
    clearTimeout(timer.current);
    setAviso(null);
  }, []);
  const mostrar = useCallback((texto: string, deuCerto = true, acao?: AcaoDoAviso) => {
    setAviso({ texto, deuCerto, acao });
    clearTimeout(timer.current);
    if (deuCerto) timer.current = setTimeout(() => setAviso(null), acao ? 6000 : 5000);
  }, []);
  const mostrarResultado = useCallback(
    (resultado: Resultado, tentarDeNovo?: () => void) => {
      if (resultado.ok) return mostrar(resultado.mensagem, true);
      if (resultado.motivo === "sessao") return mostrar(resultado.mensagem, false, { rotulo: "Entrar de novo", href: linkEntrarDeNovo() });
      const repetir = (resultado.motivo === "rede" || resultado.motivo === "servidor") && tentarDeNovo;
      mostrar(resultado.mensagem, false, repetir ? { rotulo: "Tentar de novo", aoTocar: tentarDeNovo } : undefined);
    },
    [mostrar],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const elemento = aviso ? (
    <div
      role={aviso.deuCerto ? "status" : "alert"}
      className={cx(
        "fixed inset-x-4 top-[calc(18px+env(safe-area-inset-top))] z-50 mx-auto flex max-w-[calc(28rem-2rem)] animate-entra flex-col gap-2 rounded-[18px] py-3 pr-1.5 pl-4 text-sm font-bold shadow-2xl",
        aviso.deuCerto ? "bg-menta text-cacau-950" : "border-2 border-[#8a2a22] bg-rosa text-cacau-950",
      )}
    >
      <div className="flex items-center gap-2.5">
        {aviso.deuCerto ? (
          <IconeCheck tamanho={22} className="shrink-0 text-[#1d5a29]" />
        ) : (
          <IconeAlerta tamanho={28} className="shrink-0 text-[#8a2a22]" />
        )}
        <span className="grow leading-snug">{aviso.texto}</span>
        <button type="button" onClick={fechar} aria-label="Fechar o aviso" className="flex size-11 shrink-0 items-center justify-center rounded-full">
          <IconeFechar tamanho={20} />
        </button>
      </div>
      {aviso.acao && (
        <div className="flex justify-end pr-2.5">
          {aviso.acao.href ? (
            <a href={aviso.acao.href} className="flex h-11 items-center rounded-full bg-cacau-950 px-5 text-sm font-bold text-creme">
              {aviso.acao.rotulo}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                fechar();
                aviso.acao?.aoTocar?.();
              }}
              className="flex h-11 items-center rounded-full bg-cacau-950 px-5 text-sm font-bold text-creme"
            >
              {aviso.acao.rotulo}
            </button>
          )}
        </div>
      )}
    </div>
  ) : null;
  return [elemento, mostrar, mostrarResultado];
}

// Chama uma ação do servidor. Se a internet cair (ou o servidor não responder),
// devolve um erro com motivo, para o aviso oferecer "Tentar de novo".
export async function tentar(acao: () => Promise<Resultado>): Promise<Resultado> {
  try {
    return await acao();
  } catch (erro) {
    // Redirecionamentos do Next seguem adiante.
    if (typeof erro === "object" && erro && "digest" in erro && String(erro.digest).startsWith("NEXT_")) throw erro;
    if (!navigator.onLine || erro instanceof TypeError) {
      return { ok: false, motivo: "rede", mensagem: "Parece que a internet caiu. Confira o Wi-Fi ou os dados do celular e tente de novo." };
    }
    return { ok: false, motivo: "servidor", mensagem: "Não deu para falar com o servidor agora. Tente de novo em instantes." };
  }
}

// Faixa que explica alguma coisa e só sai quando a pessoa fecha.
export function FaixaAviso({ children, aoFechar }: { children: ReactNode; aoFechar?: () => void }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 py-2 pr-1 pl-3.5 text-[13px] leading-relaxed text-pessego">
      <IconeAlerta tamanho={20} className="mt-1.5 shrink-0" />
      <div className="grow py-1.5">{children}</div>
      {aoFechar && (
        <button type="button" onClick={aoFechar} aria-label="Fechar o aviso" className="flex size-11 shrink-0 items-center justify-center rounded-full">
          <IconeFechar tamanho={18} />
        </button>
      )}
    </div>
  );
}

export interface Pergunta {
  titulo: string;
  texto?: string;
  confirmar: string;
  // Botão de confirmar em rosa, para o que não tem volta.
  perigo?: boolean;
}

// Folha de confirmação do próprio app (no lugar do window.confirm), feita com o
// <dialog> do navegador: prende o foco, fecha no Esc e no toque fora.
export function FolhaConfirmacao({
  pergunta,
  aoConfirmar,
  aoFechar,
}: {
  pergunta: Pergunta | null;
  aoConfirmar: () => void;
  aoFechar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const aberta = pergunta !== null;
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberta && !dialogo.open) dialogo.showModal();
    if (!aberta && dialogo.open) dialogo.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="folha-titulo"
      className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-md rounded-t-[32px] border-0 border-t border-dourado/20 bg-cacau-900 p-0 text-creme backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {pergunta && (
        <div className="flex flex-col gap-4 px-[22px] pt-[26px] pb-[max(28px,env(safe-area-inset-bottom))]">
          <h2 id="folha-titulo" className="font-display text-2xl leading-tight font-semibold">
            {pergunta.titulo}
          </h2>
          {pergunta.texto && <p className="text-[15px] leading-relaxed text-creme-200">{pergunta.texto}</p>}
          <div className="mt-1 flex flex-col gap-2.5">
            <button
              type="button"
              autoFocus
              onClick={aoConfirmar}
              className={pergunta.perigo ? botaoPrimario.replace("bg-dourado text-cacau-900", "bg-rosa text-cacau-950") : botaoPrimario}
            >
              {pergunta.confirmar}
            </button>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="h-[54px] rounded-full border border-dourado/30 text-base font-bold text-dourado"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

// Jeito fácil de perguntar: `if (await perguntar({ ... })) fazerAlgo()`.
export function useConfirmacao(): [ReactNode, (pergunta: Pergunta) => Promise<boolean>] {
  const [atual, setAtual] = useState<{ pergunta: Pergunta; responder: (sim: boolean) => void } | null>(null);
  const perguntar = useCallback(
    (pergunta: Pergunta) => new Promise<boolean>((responder) => setAtual({ pergunta, responder })),
    [],
  );
  const elemento = (
    <FolhaConfirmacao
      pergunta={atual?.pergunta ?? null}
      aoConfirmar={() => {
        atual?.responder(true);
        setAtual(null);
      }}
      aoFechar={() => {
        atual?.responder(false);
        setAtual(null);
      }}
    />
  );
  return [elemento, perguntar];
}

// Faixa no topo do painel quando o banco não está configurado.
export function FaixaDemo({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <p className="bg-pessego px-5 py-2 text-center text-xs font-semibold text-cacau-900">
      Painel em modo demonstração: as alterações não ficam salvas.
    </p>
  );
}

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
