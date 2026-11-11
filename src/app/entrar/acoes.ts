"use server";

import { redirect } from "next/navigation";
import { encerrarSessao, idDeQuemTemAcesso, iniciarSessao, senhaConfere, senhaConfigurada } from "@/lib/auth";

export interface EstadoEntrada {
  erro: string | null;
}

// Entrada com e-mail (cadastrado em Acessos) + senha da loja (PAINEL_SENHA).
export async function entrarComSenha(_anterior: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  if (!senhaConfigurada()) return { erro: "A entrada com senha não está configurada no servidor." };
  // Pequena espera para dificultar quem tenta adivinhar a senha.
  await new Promise((r) => setTimeout(r, 400));
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  if (!senhaConfere(String(dados.get("senha") ?? ""))) return { erro: "E-mail ou senha errados." };
  const id = email ? await idDeQuemTemAcesso(email) : null;
  if (!id) return { erro: "Esse e-mail não tem acesso ao painel. Peça para a administração adicionar você em Acessos." };
  await iniciarSessao(id);
  redirect("/painel");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
