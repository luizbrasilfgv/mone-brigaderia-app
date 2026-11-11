import { connection } from "next/server";
import { Suspense } from "react";
import { Vitrine } from "@/components/vitrine/Vitrine";
import { listarCampanhas, listarCategorias, listarDoces } from "@/lib/dados";

export default function PaginaVitrine() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-dvh max-w-md" />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  // Os doces vêm do banco na hora da visita (com cache), não do momento da publicação.
  await connection();
  const [doces, campanhas, categorias] = await Promise.all([listarDoces(), listarCampanhas(), listarCategorias()]);
  return <Vitrine doces={doces} campanhas={campanhas} categorias={categorias} />;
}
