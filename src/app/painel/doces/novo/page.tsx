import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { bancoConfigurado } from "@/lib/banco";
import { listarCampanhas, listarCategorias } from "@/lib/dados";

export const metadata: Metadata = { title: "Novo doce" };

export default function PaginaNovoDoce() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const [categorias, campanhas] = await Promise.all([listarCategorias(), listarCampanhas()]);
  return <FormularioDoce doce={null} categorias={categorias} campanhas={campanhas} demo={!bancoConfigurado()} />;
}
