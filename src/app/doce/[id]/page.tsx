import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FichaDoce } from "@/components/ficha/FichaDoce";
import { enderecoDoSite } from "@/lib/auth";
import { listarCampanhas, obterDoce, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";
import { LOJA } from "@/lib/loja";
import { textoDoPreco } from "@/lib/regras";

// Nome, descrição e foto do doce para o link ficar bonito no WhatsApp (Open Graph).
// Endereços absolutos a partir de SITE_URL.
export async function generateMetadata({ params }: PageProps<"/doce/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [doce, endereco] = await Promise.all([obterDoce(id), enderecoDoSite()]);
  if (!doce || !doce.ativo) return {};
  const descricao = [doce.descricao, `${textoDoPreco(doce)} ${doce.unidade}.`].filter(Boolean).join(" ");
  const url = `${endereco}/doce/${doce.id}`;
  const foto = doce.fotos[0];
  return {
    title: doce.nome,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: LOJA.nome,
      title: `${doce.nome} · ${LOJA.nome}`,
      description: descricao,
      url,
      images: foto ? [{ url: new URL(foto, endereco).toString(), alt: doce.nome }] : [{ url: `${endereco}${LOJA.logo}`, alt: LOJA.nome }],
    },
  };
}

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
  const [doce, campanhas, loja, endereco] = await Promise.all([obterDoce(id), listarCampanhas(), obterLoja(), enderecoDoSite()]);
  if (!doce || !doce.ativo) notFound();
  // Doce "só em campanhas" fora de época continua abrindo: a ficha diz quando ele volta.
  return <FichaDoce doce={doce} campanhas={campanhas} loja={loja} agora={agora} endereco={endereco} />;
}
