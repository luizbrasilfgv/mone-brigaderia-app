import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormularioCampanha } from "@/components/painel/FormularioCampanha";
import { PessoaDoPainel } from "@/components/painel/Menu";
import { TIPOS_CAMPANHA } from "@/lib/campanhas-modelo";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";
import { hojeNaLoja } from "@/lib/horarios";
import { listarCampanhas, listarTodosDoces } from "@/lib/dados";
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
  await connection();
  const usuario = await exigirAcesso("equipe");
  const demo = !bancoConfigurado();
  const [doces, campanhas] = await Promise.all([listarTodosDoces(), listarCampanhas()]);
  return (
    <PessoaDoPainel nome={usuario.nome} papel={usuario.papel} demo={demo}>
      <FormularioCampanha
        campanha={null}
        tipoInicial={tipo as TipoCampanha}
        doces={doces}
        campanhas={campanhas}
        hoje={hojeNaLoja()}
        demo={demo}
      />
    </PessoaDoPainel>
  );
}
