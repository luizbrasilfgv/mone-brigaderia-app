import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormularioCriarSenha } from "@/components/painel/FormularioCriarSenha";
import { usuarioAtual } from "@/lib/auth";
import { bancoConfigurado } from "@/lib/banco";
import { LOJA } from "@/lib/loja";
import { destinoSeguro, paraEntrar } from "@/lib/painel";

export const metadata: Metadata = { title: "Crie sua senha" };

// Primeiro acesso com a senha provisória (ou com a chave de emergência): a pessoa
// cria a própria senha antes de usar o painel. O guia "Como usar" só abre depois.
export default function PaginaCriarSenha({ searchParams }: PageProps<"/painel/criar-senha">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-8">
      <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={72} height={72} className="rounded-full" priority />
      <Suspense>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/painel/criar-senha">["searchParams"] }) {
  await connection();
  if (!bancoConfigurado()) redirect("/painel");
  const usuario = await usuarioAtual();
  if (!usuario) redirect(await paraEntrar("expirou"));
  const volta = destinoSeguro((await searchParams).volta);
  if (!usuario.trocarSenha) redirect(volta ?? "/painel");
  return <FormularioCriarSenha email={usuario.email} nome={usuario.nomeProprio} volta={volta} />;
}
