import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListaAcessos } from "@/components/painel/ListaAcessos";
import { listarAcessos, type Acesso } from "@/lib/auth";
import { bancoConfigurado } from "@/lib/banco";
import { exigirAcesso } from "@/lib/painel";

export const metadata: Metadata = { title: "Acessos" };

export default function PaginaAcessos() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const usuario = await exigirAcesso("admin");
  const demo = !bancoConfigurado();
  const acessos: Acesso[] = demo
    ? [{ id: 0, email: usuario.email, nome: usuario.nome, papel: "admin", ultimoAcesso: null }]
    : await listarAcessos();
  return <ListaAcessos acessos={acessos} meuId={usuario.id} demo={demo} />;
}
