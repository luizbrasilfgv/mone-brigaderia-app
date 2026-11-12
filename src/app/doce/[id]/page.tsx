import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FichaDoce } from "@/components/ficha/FichaDoce";
import { listarCampanhas, obterDoce, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

export default function PaginaDoce({ params }: PageProps<"/doce/[id]">) {
  return (
    <Suspense fallback={<div className="fundo-vitrine mx-auto h-[400px] max-w-md" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const agora = minutoAtual();
  const { id } = await params;
  const [doce, campanhas, loja] = await Promise.all([obterDoce(id), listarCampanhas(), obterLoja()]);
  if (!doce || !doce.ativo) notFound();
  // Doce "só em campanhas" fora de época continua abrindo: a ficha diz quando ele volta.
  return <FichaDoce doce={doce} campanhas={campanhas} loja={loja} agora={agora} />;
}
