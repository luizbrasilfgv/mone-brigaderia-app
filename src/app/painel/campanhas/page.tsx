import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListaCampanhas } from "@/components/painel/ListaCampanhas";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";
import { hojeNaLoja } from "@/lib/horarios";
import { listarCampanhas, listarTodosDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Campanhas" };

export default function PaginaCampanhas() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  await exigirAcesso("equipe");
  const [campanhas, doces] = await Promise.all([listarCampanhas(), listarTodosDoces()]);
  return <ListaCampanhas campanhas={campanhas} doces={doces} hoje={hojeNaLoja()} demo={!bancoConfigurado()} />;
}
