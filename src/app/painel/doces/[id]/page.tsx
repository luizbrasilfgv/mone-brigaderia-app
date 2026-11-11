import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { bancoConfigurado } from "@/lib/banco";
import { listarCampanhas, listarCategorias, obterDoce } from "@/lib/dados";

export const metadata: Metadata = { title: "Editar doce" };

export default function PaginaEditarDoce({ params }: PageProps<"/painel/doces/[id]">) {
  return (
    <Suspense>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [doce, categorias, campanhas] = await Promise.all([obterDoce(id), listarCategorias(), listarCampanhas()]);
  if (!doce) notFound();
  return <FormularioDoce key={doce.id} doce={doce} categorias={categorias} campanhas={campanhas} demo={!bancoConfigurado()} />;
}
