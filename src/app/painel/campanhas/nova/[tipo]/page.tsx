import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioCampanha } from "@/components/painel/FormularioCampanha";
import { TIPOS_CAMPANHA } from "@/lib/campanhas-modelo";
import { listarDoces } from "@/lib/dados";
import type { TipoCampanha } from "@/lib/tipos";

export const metadata: Metadata = { title: "Nova campanha" };

export function generateStaticParams() {
  return TIPOS_CAMPANHA.map((tipo) => ({ tipo }));
}

export default function PaginaNovaCampanha({ params }: PageProps<"/painel/campanhas/nova/[tipo]">) {
  return (
    <Suspense>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!TIPOS_CAMPANHA.includes(tipo as TipoCampanha)) notFound();
  const doces = await listarDoces();
  return <FormularioCampanha campanha={null} tipoInicial={tipo as TipoCampanha} doces={doces} />;
}
