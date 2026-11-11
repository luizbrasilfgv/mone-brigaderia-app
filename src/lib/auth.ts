import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";
import { banco, bancoConfigurado } from "./banco";
import { COOKIE_SESSAO, chaveDaSessao, criarToken, lerToken } from "./sessao";
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

// Duas formas de entrar: com Google (se configurado) ou com e-mail + senha da loja
// (PAINEL_SENHA). Nas duas, o e-mail precisa estar em Acessos.
export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && chaveDaSessao());
}

export function senhaConfigurada(): boolean {
  return Boolean(process.env.PAINEL_SENHA && chaveDaSessao());
}

export function senhaConfere(senha: string): boolean {
  const certa = process.env.PAINEL_SENHA;
  if (!certa) return false;
  // Compara os resumos para o tempo de resposta não revelar a senha.
  const a = createHash("sha256").update(senha).digest();
  const b = createHash("sha256").update(certa).digest();
  return timingSafeEqual(a, b);
}

// Depois de confirmar quem é (Google ou senha): garante os e-mails de ADMIN_EMAILS
// como administradores e devolve o id se a pessoa tiver acesso.
export async function idDeQuemTemAcesso(email: string, nome?: string, foto?: string | null): Promise<number | null> {
  const db = await banco();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (admins.includes(email)) {
    await db.query(
      "INSERT INTO usuarios (email, papel) VALUES (?, 'admin') ON DUPLICATE KEY UPDATE papel = 'admin', ativo = 1",
      [email],
    );
  }
  const [linhas] = await db.query<RowDataPacket[]>("SELECT id FROM usuarios WHERE email = ? AND ativo = 1", [email]);
  if (!linhas[0]) return null;
  const id = linhas[0].id as number;
  if (nome !== undefined) {
    await db.query("UPDATE usuarios SET nome = ?, foto = ?, ultimo_acesso = NOW() WHERE id = ?", [nome, foto ?? null, id]);
  } else {
    await db.query("UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?", [id]);
  }
  return id;
}

export async function iniciarSessao(usuarioId: number): Promise<void> {
  const chave = chaveDaSessao();
  if (!chave) throw new Error("SESSAO_SEGREDO não configurado");
  const { token, expira } = await criarToken(usuarioId, chave);
  (await cookies()).set(COOKIE_SESSAO, token, { httpOnly: true, secure: await usaHttps(), sameSite: "lax", path: "/", expires: expira });
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
