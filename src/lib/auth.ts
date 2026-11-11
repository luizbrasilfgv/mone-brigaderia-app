import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { COOKIE_SESSAO, chaveDaSessao, criarToken, tokenValido } from "./sessao";

// Login do painel: uma senha só (PAINEL_SENHA), guardada no servidor.

export function painelConfigurado(): boolean {
  return chaveDaSessao() !== null;
}

export function senhaConfere(senha: string): boolean {
  const certa = process.env.PAINEL_SENHA;
  if (!certa) return false;
  // Compara os resumos para o tempo de resposta não revelar a senha.
  const a = createHash("sha256").update(senha).digest();
  const b = createHash("sha256").update(certa).digest();
  return timingSafeEqual(a, b);
}

export async function sessaoValida(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  return tokenValido(token, chaveDaSessao());
}

export async function iniciarSessao(): Promise<void> {
  const chave = chaveDaSessao();
  if (!chave) throw new Error("PAINEL_SENHA e SESSAO_SEGREDO não configurados");
  const { token, expira } = await criarToken(chave);
  const https = (await headers()).get("x-forwarded-proto")?.includes("https") ?? false;
  (await cookies()).set(COOKIE_SESSAO, token, { httpOnly: true, secure: https, sameSite: "lax", path: "/", expires: expira });
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
}
