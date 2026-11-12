"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { botaoPrimario, cx } from "@/components/ui";

// Erro inesperado numa página. No app instalado não há barra de endereço nem (no iPhone)
// botão Voltar: além de tentar de novo, sempre dá para voltar à vitrine e ao painel.
export default function ErroNaPagina({ error, retry }: { error: unknown; retry: () => void }) {
  const noPainel = usePathname().startsWith("/painel");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-3xl font-semibold">Algo deu errado</h1>
      <p className="text-creme-200">
        {noPainel
          ? "Não deu para abrir esta tela agora. Tente de novo em instantes; se continuar, avise quem cuida do site."
          : "Não deu para abrir esta página agora. Tente de novo em instantes."}
      </p>
      <div className="flex w-full max-w-[300px] flex-col gap-2.5">
        <button type="button" onClick={() => retry()} className={cx(botaoPrimario, "h-12 text-[15px]")}>
          Tentar de novo
        </button>
        {noPainel && (
          <Link href="/painel" className="flex h-12 items-center justify-center rounded-full border border-dourado/40 px-6 font-bold text-dourado">
            Voltar ao início do painel
          </Link>
        )}
        <Link href="/" className="flex h-12 items-center justify-center rounded-full border border-dourado/30 px-6 font-bold text-dourado">
          Ver a vitrine
        </Link>
        {/* Quem já entrou vai direto para o painel. */}
        {!noPainel && (
          <Link href="/entrar" className="flex min-h-11 items-center justify-center text-sm font-semibold text-creme-400 underline underline-offset-4">
            Área da loja
          </Link>
        )}
      </div>
    </main>
  );
}
