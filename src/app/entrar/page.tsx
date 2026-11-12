import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { IconeVoltar } from "@/components/Icones";
import { bancoConfigurado } from "@/lib/banco";
import { MANUTENCAO, loginConfigurado, usuarioAtual } from "@/lib/auth";
import { destinoSeguro } from "@/lib/painel";
import { LOJA } from "@/lib/loja";
import { Aviso } from "./Aviso";
import { FormularioSenha } from "./FormularioSenha";

export const metadata: Metadata = {
  title: "Entrar no painel",
  // Quem instala o app a partir daqui ganha o app do painel, não o da vitrine.
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Painel Mone", statusBarStyle: "black-translucent" },
};

const MOTIVOS: Record<string, string> = {
  expirou: "Sua sessão terminou. Entre de novo para continuar.",
  saiu: "Você saiu do painel neste celular.",
  todos: "Você saiu do painel em todos os aparelhos. Para voltar, entre com o seu e-mail e a sua senha.",
};

export default function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-5 py-8">
      <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={88} height={88} className="rounded-full" loading="eager" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-3xl font-semibold">Painel da loja</h1>
        <p className="text-sm text-creme-400">{LOJA.nome}</p>
      </div>
      <Suspense>
        <Conteudo searchParams={searchParams} />
      </Suspense>
      {/* No app instalado não há barra de endereço: o caminho de volta para a vitrine. */}
      <Link href="/" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-creme-400">
        <IconeVoltar tamanho={16} />
        Ver a vitrine
      </Link>
    </main>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  // Depende da configuração do servidor e do cookie da visita.
  await connection();
  if (!bancoConfigurado()) {
    return (
      <>
        <Aviso>O banco ainda não está configurado, então o painel funciona em modo demonstração, sem login.</Aviso>
        <Link href="/painel" className="flex min-h-11 items-center font-bold text-dourado">
          Abrir o painel
        </Link>
      </>
    );
  }
  const { motivo, volta } = await searchParams;
  const destino = destinoSeguro(volta);
  if (!loginConfigurado()) {
    console.error("[entrar] falta SESSAO_SEGREDO nas configurações do servidor (veja docs/publicar.md)");
    return <Aviso erro>{MANUTENCAO}</Aviso>;
  }
  const usuario = await usuarioAtual().catch(() => null);
  if (usuario) redirect(usuario.trocarSenha ? "/painel/criar-senha" : (destino ?? "/painel"));
  const mensagem = typeof motivo === "string" ? MOTIVOS[motivo] : undefined;
  return (
    <div className="flex w-full flex-col gap-4">
      {mensagem && <Aviso>{mensagem}</Aviso>}
      <FormularioSenha volta={destino} />
      <p className="text-center text-[13px] leading-relaxed text-creme-200">
        Primeira vez? Use a senha provisória que chegou pelo WhatsApp.
      </p>
      <p className="text-center text-xs leading-relaxed text-creme-400">Só entra quem a administração cadastrou em Acessos.</p>
    </div>
  );
}
