import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Balcao } from "@/components/Balcao";
import { listarCampanhas, listarDoces } from "@/lib/dados";

export const metadata: Metadata = { title: "Balcão" };

export default function PaginaBalcao() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const [doces, campanhas] = await Promise.all([listarDoces(), listarCampanhas()]);
  return <Balcao doces={doces} campanhas={campanhas} />;
}
