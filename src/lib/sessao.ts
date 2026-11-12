// Sessão do painel num cookie assinado (HMAC-SHA256) com o id da pessoa, a versão
// da sessão e a validade. A versão fica também no banco (usuarios.sessao_versao):
// trocar a senha, gerar senha nova ou "Sair de todos os aparelhos" aumenta a do
// banco e derruba os cookies antigos. Usa Web Crypto, que funciona tanto no
// proxy.ts quanto no servidor.

export const COOKIE_SESSAO = "mone_sessao";
export const DURACAO_DIAS = 30;
// Faltando menos que isso para vencer, o proxy.ts emite um cookie novo de 30 dias.
export const RENOVAR_COM_DIAS = 7;
const DIA = 24 * 60 * 60 * 1000;
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

export interface Sessao {
  id: number;
  versao: number;
  // Validade em milissegundos (Date.now()).
  expira: number;
}

export async function criarToken(usuarioId: number, versao: number, chave: string): Promise<{ token: string; expira: Date }> {
  const expira = Date.now() + DURACAO_DIAS * DIA;
  const dados = `${usuarioId}.${versao}.${expira}`;
  const assinatura = await crypto.subtle.sign("HMAC", await importarChave(chave), codificador.encode(dados));
  return { token: `${dados}.${paraHex(assinatura)}`, expira: new Date(expira) };
}

// O cookie fica no navegador mais um tempo depois de a sessão vencer, para a tela
// de entrar saber explicar que a sessão terminou.
export function validadeDoCookie(expira: Date): Date {
  return new Date(expira.getTime() + DURACAO_DIAS * DIA);
}

// Confere a assinatura. "vencida" = assinatura certa, mas passou da validade.
export async function lerToken(
  token: string | undefined,
  chave: string | null,
): Promise<{ sessao: Sessao; vencida: boolean } | null> {
  if (!token || !chave) return null;
  const [idTexto, versaoTexto, expiraTexto, assinaturaHex, ...resto] = token.split(".");
  if (resto.length > 0) return null;
  const id = Number(idTexto);
  const versao = Number(versaoTexto);
  const expira = Number(expiraTexto);
  const assinatura = deHex(assinaturaHex ?? "");
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(versao) || !Number.isFinite(expira) || !assinatura) return null;
  const ok = await crypto.subtle.verify("HMAC", await importarChave(chave), assinatura, codificador.encode(`${id}.${versao}.${expira}`));
  if (!ok) return null;
  return { sessao: { id, versao, expira }, vencida: expira < Date.now() };
}

// Sessão válida e dentro da validade, ou null.
export async function lerSessao(token: string | undefined, chave: string | null): Promise<Sessao | null> {
  const lido = await lerToken(token, chave);
  return lido && !lido.vencida ? lido.sessao : null;
}

export function precisaRenovar(sessao: Sessao): boolean {
  return sessao.expira - Date.now() < RENOVAR_COM_DIAS * DIA;
}
