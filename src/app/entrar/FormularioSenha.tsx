"use client";

import { useActionState } from "react";
import { botaoPrimario, campo, cx, rotulo } from "@/components/ui";
import { entrarComSenha } from "./acoes";

export function FormularioSenha() {
  const [estado, enviar, enviando] = useActionState(entrarComSenha, { erro: null });
  return (
    <form action={enviar} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={rotulo}>
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className={cx(campo, "h-12")} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className={rotulo}>
          Senha da loja
        </label>
        <input id="senha" name="senha" type="password" required autoComplete="current-password" className={cx(campo, "h-12")} />
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
