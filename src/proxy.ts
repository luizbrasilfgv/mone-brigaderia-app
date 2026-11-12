import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, chaveDaSessao, criarToken, lerToken, precisaRenovar, validadeDoCookie } from "@/lib/sessao";

// Barra quem não entrou no painel e renova a sessão de quem usa. É uma primeira
// barreira: as páginas e cada ação de salvar conferem no banco se a pessoa ainda
// tem acesso, se a sessão é a atual e o que ela pode fazer.
export async function proxy(request: NextRequest) {
  // Sem banco, o painel é só demonstração e fica aberto.
  if (!process.env.MYSQL_DATABASE) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const chave = chaveDaSessao();
  const lido = await lerToken(request.cookies.get(COOKIE_SESSAO)?.value, chave);

  if (lido && !lido.vencida) {
    // Conta para as páginas qual endereço foi aberto (para voltar a ele depois de entrar).
    const cabecalhos = new Headers(request.headers);
    cabecalhos.set("x-mone-caminho", pathname + search);
    const resposta = NextResponse.next({ request: { headers: cabecalhos } });
    // Quem usa o painel pelo menos uma vez por mês não precisa entrar de novo.
    if (chave && precisaRenovar(lido.sessao)) {
      const { token, expira } = await criarToken(lido.sessao.id, lido.sessao.versao, chave);
      resposta.cookies.set(COOKIE_SESSAO, token, {
        httpOnly: true,
        secure: request.headers.get("x-forwarded-proto")?.includes("https") ?? false,
        sameSite: "lax",
        path: "/",
        expires: validadeDoCookie(expira),
      });
    }
    return resposta;
  }

  // Ações de salvar respondem sozinhas "Sua sessão terminou" com o botão Entrar de novo.
  if (request.method === "POST" && request.headers.has("next-action")) return NextResponse.next();

  const destino = new URL("/entrar", request.url);
  if (lido?.vencida) destino.searchParams.set("motivo", "expirou");
  if (pathname !== "/painel" || search) destino.searchParams.set("volta", pathname + search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/painel/:path*"],
};
