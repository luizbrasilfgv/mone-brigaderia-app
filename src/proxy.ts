import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, chaveDaSessao, lerToken } from "@/lib/sessao";

// Barra quem não entrou no painel. É uma primeira barreira: as páginas e cada
// ação de salvar conferem no banco se a pessoa ainda tem acesso e o que ela pode fazer.
export async function proxy(request: NextRequest) {
  // Sem banco, o painel é só demonstração e fica aberto.
  if (!process.env.MYSQL_DATABASE) return NextResponse.next();

  if (await lerToken(request.cookies.get(COOKIE_SESSAO)?.value, chaveDaSessao())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  matcher: ["/painel/:path*"],
};
