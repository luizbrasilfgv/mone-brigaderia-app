import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pode, usuarioAtual, type Papel, type Usuario } from "./auth";

// Página do painel que está sendo aberta (o proxy.ts põe no cabeçalho do pedido).
export const CABECALHO_CAMINHO = "x-mone-caminho";

// Só aceita voltar para páginas do próprio painel depois de entrar.
export function destinoSeguro(volta: unknown): string | null {
  if (typeof volta !== "string" || !volta.startsWith("/painel")) return null;
  try {
    const url = new URL(volta, "http://painel.local");
    if (url.origin !== "http://painel.local" || !/^\/painel(\/|$)/.test(url.pathname)) return null;
    if (url.pathname.startsWith("/painel/criar-senha")) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

async function caminhoAtual(): Promise<string | null> {
  return destinoSeguro((await headers()).get(CABECALHO_CAMINHO));
}

export async function paraEntrar(motivo?: "expirou"): Promise<string> {
  const parametros = new URLSearchParams();
  if (motivo) parametros.set("motivo", motivo);
  const volta = await caminhoAtual();
  if (volta && volta !== "/painel") parametros.set("volta", volta);
  const texto = parametros.toString();
  return texto ? `/entrar?${texto}` : "/entrar";
}

// Para as páginas do painel: quem não entrou (ou teve a sessão derrubada) vai para
// /entrar e volta para a mesma página depois; quem ainda não criou a própria senha
// vai para /painel/criar-senha; quem não tem permissão volta para o início do
// painel com uma faixa explicando.
export async function exigirAcesso(minimo: Papel): Promise<Usuario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect(await paraEntrar("expirou"));
  if (usuario.trocarSenha) {
    const volta = await caminhoAtual();
    redirect(volta && volta !== "/painel" ? `/painel/criar-senha?volta=${encodeURIComponent(volta)}` : "/painel/criar-senha");
  }
  if (!pode(usuario, minimo)) redirect(`/painel?aviso=sem-permissao&area=${minimo}`);
  return usuario;
}

// Só o que as telas precisam saber da pessoa (vai para o navegador).
export interface PessoaNoPainel {
  // Para guardar o rascunho de O que tem hoje no celular, por pessoa.
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  tutorialVisto: boolean;
}

export function paraTela(u: Usuario): PessoaNoPainel {
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel, tutorialVisto: u.tutorialVisto };
}
