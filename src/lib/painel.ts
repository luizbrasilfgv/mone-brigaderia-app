import "server-only";
import { redirect } from "next/navigation";
import { pode, usuarioAtual, type Papel, type Usuario } from "./auth";

// Para as páginas do painel: quem não entrou vai para /entrar; quem entrou mas não
// tem permissão para aquela página volta para o início do painel.
export async function exigirAcesso(minimo: Papel): Promise<Usuario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  if (!pode(usuario, minimo)) redirect("/painel");
  return usuario;
}

// Só o que as telas precisam saber da pessoa (vai para o navegador).
export interface PessoaNoPainel {
  nome: string;
  email: string;
  foto: string | null;
  papel: Papel;
  tutorialVisto: boolean;
}

export function paraTela(u: Usuario): PessoaNoPainel {
  return { nome: u.nome, email: u.email, foto: u.foto, papel: u.papel, tutorialVisto: u.tutorialVisto };
}
