import { Vitrine } from "@/components/vitrine/Vitrine";
import { listarCampanhas, listarCategorias, listarDoces } from "@/lib/dados";

export default async function PaginaVitrine() {
  const [doces, campanhas, categorias] = await Promise.all([listarDoces(), listarCampanhas(), listarCategorias()]);
  return <Vitrine doces={doces} campanhas={campanhas} categorias={categorias} />;
}
