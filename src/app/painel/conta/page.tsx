import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { MinhaConta } from "@/components/painel/MinhaConta";
import { PessoaDoPainel } from "@/components/painel/Menu";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";

export const metadata: Metadata = { title: "Minha conta" };

export default function PaginaConta() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const usuario = await exigirAcesso("estoque");
  const demo = !bancoConfigurado();
  return (
    <PessoaDoPainel nome={usuario.nome} papel={usuario.papel} demo={demo}>
      <MinhaConta nome={usuario.nomeProprio} email={usuario.email} papel={usuario.papel} demo={demo} />
    </PessoaDoPainel>
  );
}
