import type { Metadata } from "next";
import { FormularioDoce } from "@/components/painel/FormularioDoce";
import { listarCampanhas, listarCategorias } from "@/lib/dados";

export const metadata: Metadata = { title: "Novo doce" };

export default async function PaginaNovoDoce() {
  const [categorias, campanhas] = await Promise.all([listarCategorias(), listarCampanhas()]);
  return <FormularioDoce doce={null} categorias={categorias} campanhas={campanhas} />;
}
