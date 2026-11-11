import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { bancoConfigurado } from "@/lib/banco";
import { googleConfigurado, senhaConfigurada, usuarioAtual } from "@/lib/auth";
import { LOJA } from "@/lib/loja";
import { FormularioSenha } from "./FormularioSenha";

export const metadata: Metadata = { title: "Entrar no painel" };

const ERROS: Record<string, string> = {
  "sem-acesso": "Esse e-mail do Google não tem acesso ao painel. Peça para a administradora adicionar você em Acessos.",
  cancelado: "O login com o Google foi cancelado.",
  expirou: "O login demorou demais. Tente de novo.",
  google: "Não deu para confirmar sua conta do Google. Tente de novo.",
  config: "A entrada do painel ainda não foi configurada no servidor. Veja docs/publicar.md.",
};

export default function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-5">
      <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={88} height={88} className="rounded-full" priority />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-3xl font-semibold">Painel da loja</h1>
        <p className="text-sm text-creme-400">{LOJA.nome}</p>
      </div>
      <Suspense>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Aviso({ children, erro }: { children: ReactNode; erro?: boolean }) {
  return (
    <p
      role={erro ? "alert" : undefined}
      className={
        erro
          ? "rounded-2xl bg-rosa/15 p-4 text-center text-sm leading-relaxed font-semibold text-rosa"
          : "rounded-2xl bg-cacau-900 p-4 text-center text-sm leading-relaxed text-creme-200"
      }
    >
      {children}
    </p>
  );
}

function LogoGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  // Depende da configuração do servidor e do cookie da visita.
  await connection();
  if (!bancoConfigurado()) {
    return (
      <>
        <Aviso>O banco ainda não está configurado, então o painel funciona em modo demonstração, sem login.</Aviso>
        <Link href="/painel" className="font-bold text-dourado">
          Abrir o painel
        </Link>
      </>
    );
  }
  if (await usuarioAtual()) redirect("/painel");
  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? ERROS[erro] : undefined;
  const google = googleConfigurado();
  const senha = senhaConfigurada();
  return (
    <div className="flex w-full flex-col gap-4">
      {mensagem && <Aviso erro>{mensagem}</Aviso>}
      {!google && !senha && !mensagem && <Aviso erro>{ERROS.config}</Aviso>}
      {google && (
        <a
          href="/auth/google"
          className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-white text-base font-bold text-[#1f1f1f] shadow-lg transition-transform active:scale-[0.97]"
        >
          <LogoGoogle />
          Entrar com Google
        </a>
      )}
      {google && senha && <span className="text-center text-xs text-creme-400">ou</span>}
      {senha && <FormularioSenha />}
      <p className="text-center text-xs leading-relaxed text-creme-400">Só entra quem a administração cadastrou em Acessos.</p>
    </div>
  );
}
