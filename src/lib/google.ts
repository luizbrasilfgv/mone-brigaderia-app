import "server-only";

// Login com Google (OAuth 2.0 + OpenID Connect, com PKCE).

export const GOOGLE_AUTORIZAR = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
export const COOKIE_LOGIN = "mone_login";
export const CAMINHO_RETORNO = "/auth/google/retorno";

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function textoAleatorio(tamanho = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(tamanho)));
}

export async function desafioPkce(verificador: string): Promise<string> {
  const resumo = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador));
  return base64url(new Uint8Array(resumo));
}

export interface ContaGoogle {
  email: string;
  nome: string;
  foto: string | null;
}

// O id_token vem direto do Google pela conexão segura (HTTPS), então basta conferir
// para quem foi emitido, quem emitiu, a validade e se o e-mail está confirmado.
export function contaDoIdToken(idToken: string, clientId: string): ContaGoogle | null {
  try {
    const dados = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    const emissorOk = dados.iss === "accounts.google.com" || dados.iss === "https://accounts.google.com";
    if (!emissorOk || dados.aud !== clientId || dados.exp * 1000 < Date.now() || dados.email_verified !== true) return null;
    return { email: String(dados.email).toLowerCase(), nome: dados.name ?? "", foto: dados.picture ?? null };
  } catch {
    return null;
  }
}
