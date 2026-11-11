import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, chaveDaSessao, tokenValido } from "@/lib/sessao";

// Barra quem não entrou no painel. É uma primeira barreira: cada ação de salvar
// confere a sessão de novo no servidor (src/app/painel/acoes.ts).
export async function proxy(request: NextRequest) {
  // Sem banco, o painel é só demonstração e fica aberto.
  if (!process.env.MYSQL_DATABASE) return NextResponse.next();

  if (await tokenValido(request.cookies.get(COOKIE_SESSAO)?.value, chaveDaSessao())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  matcher: ["/painel/:path*"],
};
