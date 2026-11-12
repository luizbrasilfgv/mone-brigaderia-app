"use client";

import { useActionState } from "react";
import { criarSenha } from "@/app/painel/acoes";
import { sair } from "@/app/entrar/acoes";
import { CampoSenha } from "../CampoSenha";
import { botaoPrimario, cx, rotulo } from "../ui";

export function FormularioCriarSenha({ email, nome, volta }: { email: string; nome: string; volta: string | null }) {
  const [estado, enviar, enviando] = useActionState(criarSenha, { erro: null });
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-3xl font-semibold">Crie sua senha</h1>
        <p className="text-[15px] leading-relaxed text-creme-200">
          {nome ? `${nome}, esta` : "Esta"} vai ser a sua senha para entrar no painel. Use pelo menos 8 letras ou números. Não precisa de
          maiúscula nem de símbolo.
        </p>
      </div>
      <form action={enviar} className="flex flex-col gap-4">
        {/* O e-mail vai junto (escondido) para o celular guardar a senha certa. */}
        <input type="text" name="usuario" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
        {volta && <input type="hidden" name="volta" value={volta} />}
        <div className="flex flex-col gap-2">
          <label htmlFor="senha" className={rotulo}>
            Senha nova
          </label>
          <CampoSenha id="senha" name="senha" required minLength={8} autoComplete="new-password" enterKeyHint="done" aria-describedby="regra-senha" />
          <span id="regra-senha" className="text-xs text-creme-400">
            Pelo menos 8 letras ou números. Toque em Mostrar para conferir.
          </span>
        </div>
        {estado.erro && (
          <p role="alert" className="rounded-2xl border-2 border-rosa/60 bg-rosa/15 p-3.5 text-sm leading-relaxed font-semibold text-rosa">
            {estado.erro}
          </p>
        )}
        <button type="submit" disabled={enviando} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {enviando ? "Salvando…" : "Salvar senha e entrar"}
        </button>
      </form>
      <form action={sair} className="flex justify-center">
        <button type="submit" className="flex min-h-11 items-center px-3 text-sm font-semibold text-creme-400">
          Agora não, sair
        </button>
      </form>
    </div>
  );
}
