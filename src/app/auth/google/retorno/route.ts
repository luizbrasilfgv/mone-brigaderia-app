import { NextResponse, connection, type NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { banco } from "@/lib/banco";
import { enderecoDoSite, usaHttps } from "@/lib/auth";
import { CAMINHO_RETORNO, COOKIE_LOGIN, GOOGLE_TOKEN, contaDoIdToken, emailsAdmin } from "@/lib/google";
import { COOKIE_SESSAO, chaveDaSessao, criarToken } from "@/lib/sessao";

// O Google volta para cá depois que a pessoa escolhe a conta.
export async function GET(pedido: NextRequest) {
  await connection();
  const site = await enderecoDoSite();
  const sair = (destino: string) => {
    const resposta = NextResponse.redirect(new URL(destino, site));
    resposta.cookies.delete({ name: COOKIE_LOGIN, path: "/auth/google" });
    return resposta;
  };

  const parametros = pedido.nextUrl.searchParams;
  if (parametros.get("error")) return sair("/entrar?erro=cancelado");
  const [estado, verificador] = (pedido.cookies.get(COOKIE_LOGIN)?.value ?? "").split(".");
  const codigo = parametros.get("code");
  if (!estado || !verificador || !codigo || parametros.get("state") !== estado) return sair("/entrar?erro=expirou");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const chave = chaveDaSessao();
  if (!clientId || !clientSecret || !chave) return sair("/entrar?erro=config");

  try {
    const troca = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: codigo,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: site + CAMINHO_RETORNO,
        grant_type: "authorization_code",
        code_verifier: verificador,
      }),
    });
    if (!troca.ok) {
      console.error("[login] Google recusou a troca do código:", troca.status, await troca.text());
      return sair("/entrar?erro=google");
    }
    const conta = contaDoIdToken((await troca.json()).id_token ?? "", clientId);
    if (!conta) return sair("/entrar?erro=google");

    const db = await banco();
    if (emailsAdmin().includes(conta.email)) {
      await db.query(
        "INSERT INTO usuarios (email, papel) VALUES (?, 'admin') ON DUPLICATE KEY UPDATE papel = 'admin', ativo = 1",
        [conta.email],
      );
    }
    const [linhas] = await db.query<RowDataPacket[]>("SELECT id FROM usuarios WHERE email = ? AND ativo = 1", [conta.email]);
    if (!linhas[0]) return sair("/entrar?erro=sem-acesso");
    const id = linhas[0].id as number;
    await db.query("UPDATE usuarios SET nome = ?, foto = ?, ultimo_acesso = NOW() WHERE id = ?", [conta.nome, conta.foto, id]);

    const { token, expira } = await criarToken(id, chave);
    const resposta = sair("/painel");
    resposta.cookies.set(COOKIE_SESSAO, token, {
      httpOnly: true,
      secure: await usaHttps(),
      sameSite: "lax",
      path: "/",
      expires: expira,
    });
    return resposta;
  } catch (erro) {
    console.error("[login]", erro);
    return sair("/entrar?erro=google");
  }
}
