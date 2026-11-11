import type { Metadata } from "next";
import { EstoqueDoDia } from "@/components/painel/EstoqueDoDia";
import { listarCampanhas, listarDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Painel" };

export default async function PaginaPainel() {
  const [doces, campanhas] = await Promise.all([listarDoces(), listarCampanhas()]);
  return <EstoqueDoDia doces={doces} campanhas={campanhas} />;
}
