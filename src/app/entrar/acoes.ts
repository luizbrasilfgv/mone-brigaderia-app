"use server";

import { redirect } from "next/navigation";
import { encerrarSessao, iniciarSessao, painelConfigurado, senhaConfere } from "@/lib/auth";

export interface EstadoEntrada {
  erro: string | null;
}

export async function entrar(_anterior: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  if (!painelConfigurado()) return { erro: "O painel ainda não tem senha configurada no servidor." };
  // Pequena espera para dificultar quem tenta adivinhar a senha.
  await new Promise((r) => setTimeout(r, 400));
  if (!senhaConfere(String(dados.get("senha") ?? ""))) return { erro: "Senha errada. Tente de novo." };
  await iniciarSessao();
  redirect("/painel");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
