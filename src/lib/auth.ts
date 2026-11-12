import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";
import { banco, bancoConfigurado } from "./banco";
import { COOKIE_SESSAO, chaveDaSessao, criarToken, lerSessao, validadeDoCookie } from "./sessao";
import { senhaConfere } from "./senhas";
import type { Papel } from "./papeis";

export { pode, type Papel } from "./papeis";

// Quem está usando o painel e o que pode fazer. Cada pessoa entra com o próprio
// e-mail e a própria senha; só entra quem estiver ativo na tabela usuarios.

export interface Usuario {
  id: number;
  email: string;
  // Nome para mostrar (o e-mail, se a pessoa ainda não tem nome).
  nome: string;
  // Nome como está guardado (pode ser vazio).
  nomeProprio: string;
  papel: Papel;
  tutorialVisto: boolean;
  // Entrou com senha provisória ou com a chave de emergência: precisa criar a senha.
  trocarSenha: boolean;
  // Está em ADMIN_EMAILS: Administração fixa, configurada no servidor.
  fixo: boolean;
}

// Sem banco, o painel é demonstração: abre como Administração, sem login.
const USUARIO_DEMO: Usuario = {
  id: 0,
  email: "demonstracao@monebrigaderia.com.br",
  nome: "Demonstração",
  nomeProprio: "Demonstração",
  papel: "admin",
  tutorialVisto: false,
  trocarSenha: false,
  fixo: false,
};

export const MANUTENCAO = "O painel está em manutenção. Tente mais tarde ou avise quem cuida do site.";

// O login precisa do segredo que assina a sessão. A PAINEL_SENHA é opcional: é
// só a chave de emergência de quem está em ADMIN_EMAILS.
export function loginConfigurado(): boolean {
  return Boolean(chaveDaSessao());
}

export function emailsDaAdministracaoFixa(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ehAdministracaoFixa(email: string): boolean {
  return emailsDaAdministracaoFixa().includes(email.trim().toLowerCase());
}

// Chave de emergência (PAINEL_SENHA). Compara os resumos para o tempo de resposta
// não revelar a senha.
function chaveDeEmergenciaConfere(senha: string): boolean {
  const certa = process.env.PAINEL_SENHA;
  if (!certa) return false;
  const a = createHash("sha256").update(senha).digest();
  const b = createHash("sha256").update(certa).digest();
  return timingSafeEqual(a, b);
}

export function linhaParaUsuario(l: RowDataPacket): Usuario {
  return {
    id: l.id,
    email: l.email,
    nome: l.nome || l.email,
    nomeProprio: l.nome ?? "",
    papel: l.papel,
    tutorialVisto: Boolean(l.tutorial_visto),
    trocarSenha: Boolean(l.trocar_senha),
    fixo: ehAdministracaoFixa(l.email),
  };
}

// Lê o cookie e confere no banco se a pessoa ainda tem acesso e se a sessão é a
// atual (tirar o acesso, trocar a senha ou gerar senha nova vale na hora).
export async function usuarioAtual(): Promise<Usuario | null> {
  if (!bancoConfigurado()) return USUARIO_DEMO;
  const sessao = await lerSessao((await cookies()).get(COOKIE_SESSAO)?.value, chaveDaSessao());
  if (!sessao) return null;
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>(
    `SELECT id, email, nome, papel, tutorial_visto, trocar_senha, sessao_versao,
       (ultimo_acesso IS NULL OR ultimo_acesso < CURDATE()) AS registrar_acesso
     FROM usuarios WHERE id = ? AND ativo = 1`,
    [sessao.id],
  );
  const linha = linhas[0];
  if (!linha || Number(linha.sessao_versao) !== sessao.versao) return null;
  // "Último acesso" em Acessos: no máximo uma gravação por dia.
  if (Number(linha.registrar_acesso)) await db.query("UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?", [linha.id]);
  return linhaParaUsuario(linha);
}

export async function iniciarSessao(usuarioId: number, versao: number): Promise<void> {
  const chave = chaveDaSessao();
  if (!chave) throw new Error("SESSAO_SEGREDO não configurado");
  const { token, expira } = await criarToken(usuarioId, versao, chave);
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: await usaHttps(),
    sameSite: "lax",
    path: "/",
    expires: validadeDoCookie(expira),
  });
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
}

// Aumenta a versão da sessão no banco: todos os cookies antigos dessa pessoa
// deixam de valer. Devolve a versão nova.
export async function novaVersaoDeSessao(usuarioId: number): Promise<number> {
  const db = await banco();
  await db.query("UPDATE usuarios SET sessao_versao = sessao_versao + 1 WHERE id = ?", [usuarioId]);
  const [linhas] = await db.query<RowDataPacket[]>("SELECT sessao_versao FROM usuarios WHERE id = ?", [usuarioId]);
  return Number(linhas[0]?.sessao_versao ?? 0);
}

export async function usaHttps(): Promise<boolean> {
  return (await headers()).get("x-forwarded-proto")?.includes("https") ?? false;
}

// Endereço público do site, usado no convite que vai pelo WhatsApp.
export async function enderecoDoSite(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${(await usaHttps()) ? "https" : "http"}://${host}`;
}

// --- Entrada com e-mail e senha ---

// IP de quem está entrando, para o limite de tentativas. Vale o último endereço da
// lista, que é o que o servidor da hospedagem viu (os anteriores vêm do navegador).
export async function ipDaVisita(): Promise<string> {
  const h = await headers();
  const lista = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  return (lista.at(-1) ?? h.get("x-real-ip") ?? "sem-ip").slice(0, 64);
}

// Limite: 10 erros em 15 minutos do mesmo e-mail no mesmo IP, ou 30 do mesmo IP.
// Nunca só pelo e-mail, para ninguém conseguir trancar outra pessoa fora do painel.
const ERROS_POR_EMAIL_E_IP = 10;
const ERROS_POR_IP = 30;

export async function muitasTentativas(email: string, ip: string): Promise<boolean> {
  const [linhas] = await (await banco()).query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(email = ?), 0) AS do_email, COUNT(*) AS do_ip
     FROM tentativas_login WHERE ip = ? AND momento > NOW() - INTERVAL 15 MINUTE`,
    [email, ip],
  );
  return Number(linhas[0].do_email) >= ERROS_POR_EMAIL_E_IP || Number(linhas[0].do_ip) >= ERROS_POR_IP;
}

export async function registrarErro(email: string, ip: string): Promise<void> {
  const db = await banco();
  await db.query("INSERT INTO tentativas_login (email, ip) VALUES (?, ?)", [email.slice(0, 190), ip]);
  await db.query("DELETE FROM tentativas_login WHERE momento < NOW() - INTERVAL 1 DAY");
}

export type Entrada =
  | { tipo: "ok"; id: number; versao: number; criarSenha: boolean }
  | { tipo: "errado" }
  | { tipo: "provisoria-vencida" };

// Confere o e-mail com a senha da própria pessoa. Para quem está em ADMIN_EMAILS,
// a PAINEL_SENHA vale como chave de emergência: leva sempre a "Crie sua senha" e
// derruba as outras sessões dessa pessoa.
export async function conferirEntrada(email: string, senha: string, ip: string): Promise<Entrada> {
  const db = await banco();
  const [linhas] = await db.query<RowDataPacket[]>(
    `SELECT id, senha_hash, trocar_senha, sessao_versao,
       (senha_provisoria_expira IS NOT NULL AND senha_provisoria_expira < UTC_TIMESTAMP()) AS provisoria_vencida
     FROM usuarios WHERE email = ? AND ativo = 1`,
    [email],
  );
  const linha = linhas[0];
  const fixo = ehAdministracaoFixa(email);

  if (await senhaConfere(senha, linha?.senha_hash)) {
    if (Number(linha.provisoria_vencida)) return { tipo: "provisoria-vencida" };
    await db.query(
      `UPDATE usuarios SET ultimo_acesso = NOW()${fixo ? ", papel = 'admin'" : ""} WHERE id = ?`,
      [linha.id],
    );
    await db.query("DELETE FROM tentativas_login WHERE email = ? AND ip = ?", [email, ip]);
    return { tipo: "ok", id: linha.id, versao: Number(linha.sessao_versao), criarSenha: Boolean(linha.trocar_senha) };
  }

  if (fixo && chaveDeEmergenciaConfere(senha)) {
    await db.query(
      `INSERT INTO usuarios (email, papel, trocar_senha) VALUES (?, 'admin', 1)
       ON DUPLICATE KEY UPDATE papel = 'admin', ativo = 1, trocar_senha = 1, senha_provisoria_expira = NULL,
         sessao_versao = sessao_versao + 1, ultimo_acesso = NOW()`,
      [email],
    );
    const [admin] = await db.query<RowDataPacket[]>("SELECT id, sessao_versao FROM usuarios WHERE email = ?", [email]);
    await db.query("DELETE FROM tentativas_login WHERE email = ? AND ip = ?", [email, ip]);
    console.warn("[entrar] chave de emergência usada por um e-mail de ADMIN_EMAILS");
    return { tipo: "ok", id: admin[0].id, versao: Number(admin[0].sessao_versao), criarSenha: true };
  }

  await registrarErro(email, ip);
  return { tipo: "errado" };
}

// --- Acessos ---

export interface Acesso {
  id: number;
  email: string;
  nome: string;
  papel: Papel;
  // AAAA-MM-DD do último acesso, ou null se nunca entrou.
  ultimoAcesso: string | null;
  temSenha: boolean;
  trocarSenha: boolean;
  // AAAA-MM-DD (horário de Brasília) em que vence a senha provisória.
  provisoriaVence: string | null;
  provisoriaVencida: boolean;
  fixo: boolean;
}

export async function listarAcessos(): Promise<Acesso[]> {
  const [linhas] = await (await banco()).query<RowDataPacket[]>(
    `SELECT id, email, nome, papel, ultimo_acesso, senha_hash IS NOT NULL AS tem_senha, trocar_senha,
       DATE_FORMAT(CONVERT_TZ(senha_provisoria_expira, '+00:00', '-03:00'), '%Y-%m-%d') AS provisoria_vence,
       (senha_provisoria_expira IS NOT NULL AND senha_provisoria_expira < UTC_TIMESTAMP()) AS provisoria_vencida
     FROM usuarios WHERE ativo = 1
     ORDER BY FIELD(papel, 'admin', 'equipe', 'estoque'), nome = '', nome, email`,
  );
  return linhas.map((l) => ({
    id: l.id,
    email: l.email,
    nome: l.nome,
    papel: l.papel,
    ultimoAcesso: l.ultimo_acesso ? String(l.ultimo_acesso).slice(0, 10) : null,
    temSenha: Boolean(Number(l.tem_senha)),
    trocarSenha: Boolean(l.trocar_senha),
    provisoriaVence: l.provisoria_vence ?? null,
    provisoriaVencida: Boolean(Number(l.provisoria_vencida)),
    fixo: ehAdministracaoFixa(l.email),
  }));
}

// Nomes de quem está na Administração (menos a própria pessoa), para dizer com
// quem falar quando falta permissão.
export async function nomesDaAdministracao(excetoId: number): Promise<string[]> {
  if (!bancoConfigurado()) return [];
  const [linhas] = await (await banco()).query<RowDataPacket[]>(
    "SELECT nome, email FROM usuarios WHERE papel = 'admin' AND ativo = 1 AND id <> ? ORDER BY nome = '', nome, email",
    [excetoId],
  );
  return linhas.map((l) => (l.nome as string) || (l.email as string));
}
