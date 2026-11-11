import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FichaDoce } from "@/components/ficha/FichaDoce";
import { listarDoces, obterDoce } from "@/lib/dados";

export async function generateStaticParams() {
  const doces = await listarDoces();
  return doces.map((d) => ({ id: d.id }));
}

export default function PaginaDoce({ params }: PageProps<"/doce/[id]">) {
  return (
    <Suspense fallback={<div className="fundo-vitrine mx-auto h-[400px] max-w-md" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doce = await obterDoce(id);
  if (!doce) notFound();
  return <FichaDoce doce={doce} />;
}
