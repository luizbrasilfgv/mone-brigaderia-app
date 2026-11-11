import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioCampanha } from "@/components/painel/FormularioCampanha";
import { bancoConfigurado } from "@/lib/banco";
import { listarTodosDoces, obterCampanha } from "@/lib/dados";

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
  const { id } = await params;
  const [campanha, doces] = await Promise.all([obterCampanha(id), listarTodosDoces()]);
  if (!campanha) notFound();
  return (
    <FormularioCampanha
      key={campanha.id}
      campanha={campanha}
      tipoInicial={campanha.tipo}
      doces={doces}
      demo={!bancoConfigurado()}
    />
  );
}
