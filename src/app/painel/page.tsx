import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EstoqueDoDia } from "@/components/painel/EstoqueDoDia";
import { bancoConfigurado } from "@/lib/banco";
import { listarCampanhas, listarTodosDoces } from "@/lib/dados";
import { exigirAcesso, paraTela } from "@/lib/painel";

export const metadata: Metadata = { title: "Painel" };

export default function PaginaPainel() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const usuario = await exigirAcesso("estoque");
  const [doces, campanhas] = await Promise.all([listarTodosDoces(), listarCampanhas()]);
  return <EstoqueDoDia doces={doces} campanhas={campanhas} pessoa={paraTela(usuario)} demo={!bancoConfigurado()} />;
}
