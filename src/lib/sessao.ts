// Sessão do painel num cookie assinado (HMAC-SHA256) com o id da pessoa.
// Usa Web Crypto, que funciona tanto no proxy.ts quanto no servidor.

export const COOKIE_SESSAO = "mone_sessao";
const DURACAO_DIAS = 30;
const codificador = new TextEncoder();

export function chaveDaSessao(): string | null {
  return process.env.SESSAO_SEGREDO || null;
}

async function importarChave(chave: string) {
  return crypto.subtle.importKey("raw", codificador.encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function paraHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function deHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  const bytes = new Uint8Array(new ArrayBuffer(32));
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function criarToken(usuarioId: number, chave: string): Promise<{ token: string; expira: Date }> {
  const expira = Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000;
  const dados = `${usuarioId}.${expira}`;
  const assinatura = await crypto.subtle.sign("HMAC", await importarChave(chave), codificador.encode(dados));
  return { token: `${dados}.${paraHex(assinatura)}`, expira: new Date(expira) };
}

// Devolve o id da pessoa se o token for válido e não tiver expirado.
export async function lerToken(token: string | undefined, chave: string | null): Promise<number | null> {
  if (!token || !chave) return null;
  const [idTexto, expiraTexto, assinaturaHex, ...resto] = token.split(".");
  if (resto.length > 0) return null;
  const id = Number(idTexto);
  const expira = Number(expiraTexto);
  const assinatura = deHex(assinaturaHex ?? "");
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(expira) || expira < Date.now() || !assinatura) return null;
  const ok = await crypto.subtle.verify("HMAC", await importarChave(chave), assinatura, codificador.encode(`${id}.${expira}`));
  return ok ? id : null;
}
