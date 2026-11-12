"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CampoSenha } from "@/components/CampoSenha";
import { botaoPrimario, campo, cx, rotulo } from "@/components/ui";
import { entrarComSenha } from "./acoes";

export function FormularioSenha({ volta }: { volta: string | null }) {
  const [estado, enviar, enviando] = useActionState(entrarComSenha, { erro: null, email: "" });
  // Acompanha o e-mail para o link "Esqueci a senha" já levar o que foi digitado.
  const [email, setEmail] = useState("");
  const emailAtual = email || estado.email;
  return (
    <form action={enviar} className="flex w-full flex-col gap-4">
      {volta && <input type="hidden" name="volta" value={volta} />}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={rotulo}>
          E-mail
        </label>
        <input
          // Recria o campo com o e-mail que voltou do servidor: só a senha é limpa no erro.
          key={estado.email}
          id="email"
          name="email"
          type="email"
          required
          defaultValue={estado.email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          inputMode="email"
          enterKeyHint="next"
          className={cx(campo, "h-12")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className={rotulo}>
          Senha
        </label>
        <CampoSenha id="senha" name="senha" required autoComplete="current-password" enterKeyHint="go" />
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-2xl border-2 border-rosa/60 bg-rosa/15 p-3.5 text-sm leading-relaxed font-semibold text-rosa">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={enviando} className={cx(botaoPrimario, "disabled:opacity-60")}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <Link
        href={emailAtual ? `/entrar/esqueci?email=${encodeURIComponent(emailAtual)}` : "/entrar/esqueci"}
        className="flex min-h-11 items-center justify-center text-sm font-bold text-dourado"
      >
        Esqueci a senha
      </Link>
    </form>
  );
}
