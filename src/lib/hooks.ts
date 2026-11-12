"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { hojeNaLoja, minutoAtual } from "./horarios";
import { lerSacola, lerUltimoPedido, type SacolaGuardada, type UltimoPedido } from "./sacola";

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

// Relógio do navegador (minuto), sem valor do servidor: 0 até a página montar. Serve
// para o que só aparece depois de ler o celular (sacola e último pedido).
function useMinuto(): number {
  return useSyncExternalStore(assinarRelogio, () => minutoAtual(), () => 0);
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

// Favoritos ficam no próprio celular de quem compra (sem login).
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

// Um valor guardado só neste celular (localStorage), com aviso para as outras telas e
// abas. Sem armazenamento (aba anônima antiga, bloqueio), vale em memória até recarregar.
function guardadoNoCelular(chave: string) {
  const avisar = new Set<() => void>();
  let memoria: string | null = null;
  let semArmazenamento = false;
  return {
    assinar(ouvinte: () => void) {
      avisar.add(ouvinte);
      window.addEventListener("storage", ouvinte);
      return () => {
        avisar.delete(ouvinte);
        window.removeEventListener("storage", ouvinte);
      };
    },
    // "" = nada guardado. (No servidor, o snapshot é null: a tela mostra o esqueleto.)
    ler(): string {
      if (semArmazenamento) return memoria ?? "";
      try {
        return localStorage.getItem(chave) ?? "";
      } catch {
        semArmazenamento = true;
        return memoria ?? "";
      }
    },
    gravar(valor: string | null) {
      memoria = valor;
      try {
        if (valor === null) localStorage.removeItem(chave);
        else localStorage.setItem(chave, valor);
      } catch {
        semArmazenamento = true;
      }
      avisar.forEach((o) => o());
    },
  };
}

const sacolaGuardada = guardadoNoCelular("mone:sacola");
const nomeGuardado = guardadoNoCelular("mone:nome");
const pedidoGuardado = guardadoNoCelular("mone:ultimo-pedido");
const semServidor = () => null;

// Sacola de quem compra (src/lib/sacola.ts). sacola = null enquanto o celular não foi
// lido. vencidaEm: a sacola ficou 7 dias parada e foi considerada vazia.
export function useSacola() {
  const bruto = useSyncExternalStore(sacolaGuardada.assinar, sacolaGuardada.ler, semServidor);
  const agora = useMinuto();
  const lida = useMemo(() => (bruto === null ? null : lerSacola(bruto, agora)), [bruto, agora]);
  const gravar = useCallback((sacola: SacolaGuardada | null) => {
    sacolaGuardada.gravar(sacola && sacola.linhas.length > 0 ? JSON.stringify(sacola) : null);
  }, []);
  return { sacola: lida?.sacola ?? null, vencidaEm: lida?.vencidaEm ?? null, gravar };
}

// Nome de quem compra, lembrado depois do primeiro envio. null = ainda não leu.
export function useNomeCliente() {
  const nome = useSyncExternalStore(nomeGuardado.assinar, nomeGuardado.ler, semServidor);
  const gravar = useCallback((valor: string) => nomeGuardado.gravar(valor || null), []);
  return { nome, gravar };
}

// Último pedido enviado (7 dias). undefined = ainda não leu; null = nenhum.
export function useUltimoPedido() {
  const bruto = useSyncExternalStore(pedidoGuardado.assinar, pedidoGuardado.ler, semServidor);
  const agora = useMinuto();
  const pedido = useMemo(() => (bruto === null ? undefined : bruto ? lerUltimoPedido(bruto, agora) : null), [bruto, agora]);
  const gravar = useCallback((valor: UltimoPedido | null) => pedidoGuardado.gravar(valor ? JSON.stringify(valor) : null), []);
  return { pedido, gravar };
}

function testarArmazenamento(): boolean {
  try {
    localStorage.setItem("mone:teste", "1");
    localStorage.removeItem("mone:teste");
    return true;
  } catch {
    return false;
  }
}

const semAssinatura = () => () => {};

// O navegador guarda dados? (Senão, a sacola avisa para enviar antes de fechar.)
export function useArmazenamento(): boolean {
  return useSyncExternalStore(semAssinatura, testarArmazenamento, () => true);
}
