import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";
import { hojeNaLoja } from "@/lib/horarios";
import { listarCampanhas, listarCategorias, obterLoja } from "@/lib/dados";

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
  await exigirAcesso("equipe");
  const [categorias, campanhas, loja] = await Promise.all([listarCategorias(), listarCampanhas(), obterLoja()]);
  return (
    <FormularioDoce
      doce={null}
      categorias={categorias}
      campanhas={campanhas}
      hoje={hojeNaLoja()}
      tracos={loja.tracos}
      demo={!bancoConfigurado()}
    />
  );
}
