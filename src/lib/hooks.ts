"use client";

import { useCallback, useSyncExternalStore } from "react";
import { dataISO } from "./regras";

const semAssinatura = () => () => {};

// Data de hoje (AAAA-MM-DD) no aparelho da cliente. No servidor é null: a página é
// gerada antes da visita, então o que depende do dia só aparece no navegador.
export function useHoje(): string | null {
  return useSyncExternalStore(semAssinatura, () => dataISO(new Date()), () => null);
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
