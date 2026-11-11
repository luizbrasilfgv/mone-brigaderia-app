import type { Metadata } from "next";
import { Balcao } from "@/components/Balcao";
import { listarCampanhas, listarDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Balcão" };

export default async function PaginaBalcao() {
  const [doces, campanhas] = await Promise.all([listarDoces(), listarCampanhas()]);
  return <Balcao doces={doces} campanhas={campanhas} />;
}
