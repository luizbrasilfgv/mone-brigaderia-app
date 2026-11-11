import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { listarCampanhas, listarCategorias, listarDoces, obterDoce } from "@/lib/dados";

export const metadata: Metadata = { title: "Editar doce" };

export async function generateStaticParams() {
  const doces = await listarDoces();
  return doces.map((d) => ({ id: d.id }));
}

export default function PaginaEditarDoce({ params }: PageProps<"/painel/doces/[id]">) {
  return (
    <Suspense>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doce, categorias, campanhas] = await Promise.all([obterDoce(id), listarCategorias(), listarCampanhas()]);
  if (!doce) notFound();
  return <FormularioDoce doce={doce} categorias={categorias} campanhas={campanhas} />;
}
