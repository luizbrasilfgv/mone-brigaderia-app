import type { Metadata } from "next";
import { ListaCampanhas } from "@/components/painel/ListaCampanhas";
import { listarCampanhas, listarDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Campanhas" };

export default async function PaginaCampanhas() {
  const [campanhas, doces] = await Promise.all([listarCampanhas(), listarDoces()]);
  return <ListaCampanhas campanhas={campanhas} doces={doces} />;
}
