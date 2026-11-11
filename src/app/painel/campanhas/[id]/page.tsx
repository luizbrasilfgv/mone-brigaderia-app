import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioCampanha } from "@/components/painel/FormularioCampanha";
import { listarCampanhas, listarDoces, obterCampanha } from "@/lib/dados";

export const metadata: Metadata = { title: "Editar campanha" };

export async function generateStaticParams() {
  const campanhas = await listarCampanhas();
  return campanhas.map((c) => ({ id: c.id }));
}

export default function PaginaEditarCampanha({ params }: PageProps<"/painel/campanhas/[id]">) {
  return (
    <Suspense>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campanha, doces] = await Promise.all([obterCampanha(id), listarDoces()]);
  if (!campanha) notFound();
  return <FormularioCampanha campanha={campanha} tipoInicial={campanha.tipo} doces={doces} />;
}
