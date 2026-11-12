"use server";

import { redirect } from "next/navigation";
import {
  MANUTENCAO,
  conferirEntrada,
  encerrarSessao,
  iniciarSessao,
  ipDaVisita,
  loginConfigurado,
  muitasTentativas,
} from "@/lib/auth";
import { destinoSeguro } from "@/lib/painel";

export interface EstadoEntrada {
  erro: string | null;
  // O e-mail volta para o campo: só a senha é limpa quando dá erro.
  email: string;
}

// Entrada com o e-mail cadastrado em Acessos e a senha da própria pessoa.
export async function entrarComSenha(_anterior: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase().slice(0, 190);
  const senha = String(dados.get("senha") ?? "");
  const volta = destinoSeguro(dados.get("volta"));
  if (!loginConfigurado()) {
    console.error("[entrar] falta SESSAO_SEGREDO nas configurações do servidor (veja docs/publicar.md)");
    return { erro: MANUTENCAO, email };
  }
  if (!email || !senha) return { erro: "Preencha o e-mail e a senha.", email };

  let resultado;
  try {
    const ip = await ipDaVisita();
    if (await muitasTentativas(email, ip)) {
      return { erro: "Muitas tentativas. Espere 15 minutos ou toque em Esqueci a senha.", email };
    }
    resultado = await conferirEntrada(email, senha, ip);
    if (resultado.tipo === "ok") await iniciarSessao(resultado.id, resultado.versao);
  } catch (erro) {
    console.error("[entrar]", erro);
    return { erro: MANUTENCAO, email };
  }

  if (resultado.tipo === "errado") return { erro: "E-mail ou senha errados. Confira os dois e tente de novo.", email };
  if (resultado.tipo === "provisoria-vencida") {
    return { erro: "Essa senha provisória venceu. Peça uma nova para a administração (toque em Esqueci a senha).", email };
  }
  if (resultado.criarSenha) redirect(volta ? `/painel/criar-senha?volta=${encodeURIComponent(volta)}` : "/painel/criar-senha");
  redirect(volta ?? "/painel");
}

// "Sair deste celular", em Minha conta.
export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar?motivo=saiu");
}
