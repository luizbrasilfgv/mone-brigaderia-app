import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PedidoEnviado } from "@/components/sacola/PedidoEnviado";
import { EsqueletoSacola } from "@/components/sacola/comum";
import { obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

// Depois do toque em Enviar. O pedido vem do celular (mone:ultimo-pedido); daqui só saem
// o número do WhatsApp e o horário da loja.
export const metadata: Metadata = { title: "Pedido no WhatsApp", robots: { index: false, follow: false } };

export default function PaginaPedidoEnviado() {
  return (
    <Suspense fallback={<EsqueletoSacola />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const agora = minutoAtual();
  const loja = await obterLoja();
  return <PedidoEnviado loja={loja} agora={agora} />;
}
