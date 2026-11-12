import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { IconeConversa } from "@/components/Icones";
import { botaoWhatsApp, cx } from "@/components/ui";
import { obterLoja } from "@/lib/dados";
import { LOJA, linkWhatsApp } from "@/lib/loja";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-3xl font-semibold">Não achamos essa página</h1>
      <p className="text-creme-200">O endereço pode ter mudado ou o doce saiu da vitrine.</p>
      <div className="flex w-full max-w-[300px] flex-col gap-2.5">
        <Link href="/" className="flex h-12 items-center justify-center rounded-full bg-dourado px-6 font-bold text-cacau-900">
          Ver a vitrine
        </Link>
        <Suspense>
          <FalarNoWhatsApp />
        </Suspense>
      </div>
    </main>
  );
}

// O número vem de Dados da loja, lido na hora da visita.
async function FalarNoWhatsApp() {
  await connection();
  const loja = await obterLoja();
  return (
    <a
      href={linkWhatsApp(loja.whatsapp, `Olá, ${LOJA.nome}! Vim pelo site e queria falar com vocês.`)}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(botaoWhatsApp, "h-12 px-6")}
    >
      <IconeConversa tamanho={20} strokeWidth={2} />
      Falar no WhatsApp
    </a>
  );
}
