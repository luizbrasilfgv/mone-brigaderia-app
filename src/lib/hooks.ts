"use client";

import { useCallback, useSyncExternalStore } from "react";
import { hojeNaLoja, minutoAtual } from "./horarios";

// Confere o relógio de tempos em tempos e quando a tela volta a aparecer.
function assinarRelogio(aviso: () => void) {
  const timer = setInterval(aviso, 20_000);
  document.addEventListener("visibilitychange", aviso);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", aviso);
  };
}

// "Agora" (arredondado no minuto). O servidor calcula na hora da visita e passa para a
// tela; ao montar, o navegador usa o mesmo valor (sem quebrar a hidratação) e depois
// segue o próprio relógio, para "Aberto agora" e a virada do dia com a página aberta.
export function useAgora(agoraDoServidor: number): number {
  return useSyncExternalStore(assinarRelogio, () => minutoAtual(), () => agoraDoServidor);
}

// Data de hoje (AAAA-MM-DD) no horário de Brasília, do mesmo jeito que useAgora.
export function useHoje(hojeDoServidor: string): string {
  return useSyncExternalStore(assinarRelogio, () => hojeNaLoja(), () => hojeDoServidor);
}

const CHAVE_FAVORITOS = "mone:favoritos";
const ouvintes = new Set<() => void>();

function assinarFavoritos(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  window.addEventListener("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", ouvinte);
  };
}

function lerFavoritos(): string {
  try {
    return localStorage.getItem(CHAVE_FAVORITOS) ?? "[]";
  } catch {
    return "[]";
  }
}

// Favoritos ficam no próprio celular da cliente (sem login).
export function useFavoritos() {
  const bruto = useSyncExternalStore(assinarFavoritos, lerFavoritos, () => "[]");
  const ids = new Set<string>(JSON.parse(bruto) as string[]);

  const alternar = useCallback((id: string) => {
    const atual = new Set<string>(JSON.parse(lerFavoritos()) as string[]);
    if (atual.has(id)) atual.delete(id);
    else atual.add(id);
    try {
      localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...atual]));
    } catch {
      // Navegador sem armazenamento (aba anônima): favorito vale só até recarregar.
    }
    ouvintes.forEach((o) => o());
  }, []);

  return { ids, alternar };
}
