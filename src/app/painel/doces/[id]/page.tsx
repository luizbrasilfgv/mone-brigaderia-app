import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { PessoaDoPainel } from "@/components/painel/Menu";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";
import { hojeNaLoja } from "@/lib/horarios";
import { listarCampanhas, listarCategorias, obterDoce, obterLoja } from "@/lib/dados";

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
  const usuario = await exigirAcesso("equipe");
  const demo = !bancoConfigurado();
  const { id } = await params;
  const [doce, categorias, campanhas, loja] = await Promise.all([obterDoce(id), listarCategorias(), listarCampanhas(), obterLoja()]);
  if (!doce) notFound();
  return (
    <PessoaDoPainel nome={usuario.nome} papel={usuario.papel} demo={demo}>
      <FormularioDoce
        key={doce.id}
        doce={doce}
        categorias={categorias}
        campanhas={campanhas}
        hoje={hojeNaLoja()}
        tracos={loja.tracos}
        demo={demo}
      />
    </PessoaDoPainel>
  );
}
