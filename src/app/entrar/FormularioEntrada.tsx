"use client";

import { useActionState } from "react";
import { botaoPrimario, campo, cx, rotulo } from "@/components/ui";
import { entrar } from "./acoes";

export function FormularioEntrada() {
  const [estado, enviar, enviando] = useActionState(entrar, { erro: null });
  return (
    <form action={enviar} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className={rotulo}>
          Senha do painel
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className={cx(campo, "h-12")}
        />
      </div>
      {estado.erro && (
        <p role="alert" className="text-sm font-semibold text-rosa">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={enviando} className={cx(botaoPrimario, "disabled:opacity-60")}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
