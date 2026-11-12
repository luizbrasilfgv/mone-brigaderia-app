import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioCampanha } from "@/components/painel/FormularioCampanha";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";
import { hojeNaLoja } from "@/lib/horarios";
import { listarCampanhas, listarTodosDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Editar campanha" };

export default function PaginaEditarCampanha({ params }: PageProps<"/painel/campanhas/[id]">) {
  return (
    <Suspense>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await exigirAcesso("equipe");
  const { id } = await params;
  const [campanhas, doces] = await Promise.all([listarCampanhas(), listarTodosDoces()]);
  const campanha = campanhas.find((c) => c.id === id);
  if (!campanha) notFound();
  return (
    <FormularioCampanha
      key={campanha.id}
      campanha={campanha}
      tipoInicial={campanha.tipo}
      doces={doces}
      campanhas={campanhas}
      hoje={hojeNaLoja()}
      demo={!bancoConfigurado()}
    />
  );
}
