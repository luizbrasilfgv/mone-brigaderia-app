import "server-only";
import { cookies, headers } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";
import { banco, bancoConfigurado } from "./banco";
import { COOKIE_SESSAO, chaveDaSessao, lerToken } from "./sessao";
import type { Papel } from "./papeis";

export { pode, type Papel } from "./papeis";

// Quem está usando o painel e o que pode fazer. O login é com Google
// (src/app/auth/google); só entra quem estiver na tabela usuarios.

export interface Usuario {
  id: number;
  email: string;
  nome: string;
  foto: string | null;
  papel: Papel;
  tutorialVisto: boolean;
}

// Sem banco, o painel é demonstração: abre como administradora, sem login.
const USUARIO_DEMO: Usuario = {
  id: 0,
  email: "demonstracao@monebrigaderia.com.br",
  nome: "Demonstração",
  foto: null,
  papel: "admin",
  tutorialVisto: false,
};

export function loginConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && chaveDaSessao());
}

export function linhaParaUsuario(l: RowDataPacket): Usuario {
  return {
    id: l.id,
    email: l.email,
    nome: l.nome || l.email,
    foto: l.foto,
    papel: l.papel,
    tutorialVisto: Boolean(l.tutorial_visto),
  };
}

// Lê o cookie e confere no banco se a pessoa ainda tem acesso (tirar o acesso vale na hora).
export async function usuarioAtual(): Promise<Usuario | null> {
  if (!bancoConfigurado()) return USUARIO_DEMO;
  const id = await lerToken((await cookies()).get(COOKIE_SESSAO)?.value, chaveDaSessao());
  if (!id) return null;
  const [linhas] = await (await banco()).query<RowDataPacket[]>("SELECT * FROM usuarios WHERE id = ? AND ativo = 1", [id]);
  return linhas[0] ? linhaParaUsuario(linhas[0]) : null;
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
}

export async function usaHttps(): Promise<boolean> {
  return (await headers()).get("x-forwarded-proto")?.includes("https") ?? false;
}

// Endereço público do site, usado no retorno do login do Google.
export async function enderecoDoSite(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${(await usaHttps()) ? "https" : "http"}://${host}`;
}

export interface Acesso {
  id: number;
  email: string;
  nome: string;
  papel: Papel;
  // AAAA-MM-DD do último login, ou null se nunca entrou.
  ultimoAcesso: string | null;
}

export async function listarAcessos(): Promise<Acesso[]> {
  const [linhas] = await (await banco()).query<RowDataPacket[]>(
    "SELECT id, email, nome, papel, ultimo_acesso FROM usuarios WHERE ativo = 1 ORDER BY FIELD(papel, 'admin', 'equipe', 'estoque'), nome, email",
  );
  return linhas.map((l) => ({
    id: l.id,
    email: l.email,
    nome: l.nome,
    papel: l.papel,
    ultimoAcesso: l.ultimo_acesso ? String(l.ultimo_acesso).slice(0, 10) : null,
  }));
}
