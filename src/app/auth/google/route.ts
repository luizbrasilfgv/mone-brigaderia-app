import { NextResponse, connection } from "next/server";
import { enderecoDoSite, loginConfigurado, usaHttps } from "@/lib/auth";
import { CAMINHO_RETORNO, COOKIE_LOGIN, GOOGLE_AUTORIZAR, desafioPkce, textoAleatorio } from "@/lib/google";

// Leva para a tela de login do Google.
export async function GET() {
  await connection();
  const site = await enderecoDoSite();
  if (!loginConfigurado()) return NextResponse.redirect(new URL("/entrar?erro=config", site));

  const estado = textoAleatorio(16);
  const verificador = textoAleatorio(32);
  const url = new URL(GOOGLE_AUTORIZAR);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", site + CAMINHO_RETORNO);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", estado);
  url.searchParams.set("code_challenge", await desafioPkce(verificador));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  const resposta = NextResponse.redirect(url);
  resposta.cookies.set(COOKIE_LOGIN, `${estado}.${verificador}`, {
    httpOnly: true,
    secure: await usaHttps(),
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  return resposta;
}
