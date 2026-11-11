// Sessão do painel num cookie assinado (HMAC-SHA256). Usa Web Crypto, que funciona
// tanto no proxy.ts quanto nas ações do servidor.

export const COOKIE_SESSAO = "mone_sessao";
const DURACAO_DIAS = 30;
const codificador = new TextEncoder();

// A chave junta o segredo e a senha do painel: trocar a senha derruba as sessões abertas.
export function chaveDaSessao(): string | null {
  const segredo = process.env.SESSAO_SEGREDO;
  const senha = process.env.PAINEL_SENHA;
  return segredo && senha ? `${segredo}:${senha}` : null;
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

export async function criarToken(chave: string): Promise<{ token: string; expira: Date }> {
  const expira = Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000;
  const dados = `painel.${expira}`;
  const assinatura = await crypto.subtle.sign("HMAC", await importarChave(chave), codificador.encode(dados));
  return { token: `${dados}.${paraHex(assinatura)}`, expira: new Date(expira) };
}

export async function tokenValido(token: string | undefined, chave: string | null): Promise<boolean> {
  if (!token || !chave) return false;
  const [prefixo, expiraTexto, assinaturaHex, ...resto] = token.split(".");
  if (prefixo !== "painel" || resto.length > 0) return false;
  const expira = Number(expiraTexto);
  const assinatura = deHex(assinaturaHex ?? "");
  if (!Number.isFinite(expira) || expira < Date.now() || !assinatura) return false;
  return crypto.subtle.verify("HMAC", await importarChave(chave), assinatura, codificador.encode(`painel.${expira}`));
}
