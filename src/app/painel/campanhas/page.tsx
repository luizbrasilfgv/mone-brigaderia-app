import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListaCampanhas } from "@/components/painel/ListaCampanhas";
import { PessoaDoPainel } from "@/components/painel/Menu";
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
  const usuario = await exigirAcesso("equipe");
  const demo = !bancoConfigurado();
  const [campanhas, doces] = await Promise.all([listarCampanhas(), listarTodosDoces()]);
  return (
    <PessoaDoPainel nome={usuario.nome} papel={usuario.papel} demo={demo}>
      <ListaCampanhas campanhas={campanhas} doces={doces} hoje={hojeNaLoja()} demo={demo} />
    </PessoaDoPainel>
  );
}
