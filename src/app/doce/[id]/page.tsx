import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FichaDoce } from "@/components/ficha/FichaDoce";
import { obterDoce } from "@/lib/dados";

export default function PaginaDoce({ params }: PageProps<"/doce/[id]">) {
  return (
    <Suspense fallback={<div className="fundo-vitrine mx-auto h-[400px] max-w-md" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const doce = await obterDoce(id);
  if (!doce || !doce.ativo) notFound();
  return <FichaDoce doce={doce} />;
}
