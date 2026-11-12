"use client";

import { useEffect, useState } from "react";
import { IconeCheck, IconeCopiar } from "@/components/Icones";
import { copiarTexto } from "@/lib/copiar";
import { cx } from "@/components/ui";

// "Copiar" das respostas prontas do guia. Sem como copiar (navegador antigo), explica
// como fazer na mão.
export function BotaoCopiar({ texto, nome }: { texto: string; nome: string }) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">("parado");

  useEffect(() => {
    if (estado !== "copiado") return;
    const t = setTimeout(() => setEstado("parado"), 2500);
    return () => clearTimeout(t);
  }, [estado]);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        aria-label={`Copiar a resposta ${nome}`}
        onClick={async () => setEstado((await copiarTexto(texto)) ? "copiado" : "falhou")}
        className={cx(
          "flex h-11 items-center justify-center gap-2 rounded-full border text-sm font-bold transition-colors active:scale-[0.97]",
          estado === "copiado" ? "border-menta/50 text-menta" : "border-dourado/30 text-dourado",
        )}
      >
        {estado === "copiado" ? <IconeCheck tamanho={18} /> : <IconeCopiar tamanho={18} />}
        {estado === "copiado" ? "Copiado" : "Copiar"}
      </button>
      <span aria-live="polite" className={cx("text-xs", estado === "falhou" ? "text-rosa" : "sr-only")}>
        {estado === "copiado" ? `Resposta ${nome} copiada.` : estado === "falhou" ? "Não deu para copiar. Toque e segure o texto para copiar." : ""}
      </span>
    </div>
  );
}
