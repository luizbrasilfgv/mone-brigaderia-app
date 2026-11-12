"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IconeCelular, IconeCompartilhar, IconeSeta } from "./Icones";
import { botaoPrimario, cartao, cx } from "./ui";

// Botão para instalar o site como app no celular (PWA). No Android, o Chrome avisa
// que dá para instalar e o botão abre a janela de instalação dele; no iPhone isso
// não existe, então mostramos o passo a passo do Safari. Some quando já instalado.

type AvisoDeInstalacao = Event & { prompt: () => Promise<void> };
type Situacao = "carregando" | "instalado" | "pronto" | "iphone" | "outro";

// O navegador avisa uma vez só, às vezes antes da tela montar: guardamos aqui fora.
let aviso: AvisoDeInstalacao | null = null;
const ouvintes = new Set<() => void>();
const avisarTodos = () => ouvintes.forEach((ouvinte) => ouvinte());
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evento) => {
    aviso = evento as AvisoDeInstalacao;
    avisarTodos();
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    avisarTodos();
  });
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  const modo = window.matchMedia("(display-mode: standalone)");
  modo.addEventListener("change", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    modo.removeEventListener("change", ouvinte);
  };
}

function situacaoAgora(): Situacao {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) return "instalado";
  if (aviso) return "pronto";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iphone";
  return "outro";
}

export function InstalarApp({ variante, nome }: { variante: "cartao" | "link"; nome: string }) {
  const situacao = useSyncExternalStore(assinar, situacaoAgora, (): Situacao => "carregando");
  const [ajudaAberta, setAjudaAberta] = useState(false);

  if (situacao === "carregando" || situacao === "instalado") return null;

  const instalar = async () => {
    if (aviso) {
      try {
        await aviso.prompt();
        aviso = null;
        avisarTodos();
        return;
      } catch {
        // Se o navegador recusar, cai no passo a passo.
      }
    }
    setAjudaAberta(true);
  };

  return (
    <>
      {variante === "cartao" ? (
        <button type="button" onClick={instalar} className={cx(cartao, "flex items-center gap-3 py-3.5 pr-3 pl-4 text-left active:scale-[0.98]")}>
          <IconeCelular className="text-dourado" />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">Instalar no celular</span>
            <span className="text-[15px] font-bold">Abrir {nome} direto da tela inicial</span>
          </div>
          <IconeSeta tamanho={20} className="text-creme-400" />
        </button>
      ) : (
        <button type="button" onClick={instalar} className="inline-flex min-h-11 items-center px-3 text-xs text-creme-400 underline underline-offset-4">
          Instalar o app
        </button>
      )}
      {ajudaAberta && <ComoInstalar iphone={situacao === "iphone"} nome={nome} aoFechar={() => setAjudaAberta(false)} />}
    </>
  );
}

function ComoInstalar({ iphone, nome, aoFechar }: { iphone: boolean; nome: string; aoFechar: () => void }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const passos = iphone
    ? [
        <>
          Abra este site no <strong>Safari</strong>.
        </>,
        <>
          Toque no botão <strong>Compartilhar</strong> <IconeCompartilhar tamanho={18} className="inline align-[-3px]" /> (o
          quadrado com uma seta para cima).
        </>,
        <>
          Role e toque em <strong>Adicionar à Tela de Início</strong>.
        </>,
        <>
          Toque em <strong>Adicionar</strong>.
        </>,
      ]
    : [
        <>
          Toque no menu do navegador (os <strong>três pontinhos ⋮</strong>, no canto de cima).
        </>,
        <>
          Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
        </>,
        <>Confirme.</>,
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Como instalar no celular"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md animate-sobe flex-col gap-4 rounded-t-[32px] border-t border-dourado/20 bg-cacau-900 px-[22px] pt-[26px] pb-7"
      >
        <h2 className="font-display text-2xl font-semibold">Instalar no celular</h2>
        <p className="text-sm leading-relaxed text-creme-200">
          Assim {nome} ganha um ícone na tela inicial e abre como um app, sem barra do navegador.
        </p>
        <ol className="flex flex-col gap-3">
          {passos.map((passo, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug text-creme">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-sm font-bold text-dourado">
                {i + 1}
              </span>
              <span className="pt-0.5">{passo}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={aoFechar} className={cx(botaoPrimario, "mt-1")}>
          Entendi
        </button>
      </div>
    </div>
  );
}
