import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormularioLoja } from "@/components/painel/FormularioLoja";
import { bancoConfigurado } from "@/lib/banco";
import { obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";
import { exigirAcesso } from "@/lib/painel";

export const metadata: Metadata = { title: "Dados da loja" };

export default function PaginaLoja() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  await exigirAcesso("admin");
  const loja = await obterLoja();
  return <FormularioLoja loja={loja} agora={minutoAtual()} demo={!bancoConfigurado()} />;
}
