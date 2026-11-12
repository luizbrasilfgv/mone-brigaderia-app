import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EstoqueDoDia } from "@/components/painel/EstoqueDoDia";
import { PessoaDoPainel } from "@/components/painel/Menu";
import { nomesDaAdministracao, pode, type Usuario } from "@/lib/auth";
import { bancoConfigurado } from "@/lib/banco";
import { listarCampanhas, listarTodosDoces, obterLoja, ultimoSalvamentoDoEstoque } from "@/lib/dados";
import { hojeNaLoja } from "@/lib/horarios";
import { exigirAcesso, paraTela } from "@/lib/painel";
import type { Papel } from "@/lib/papeis";

export const metadata: Metadata = { title: "Painel" };

export default function PaginaPainel({ searchParams }: PageProps<"/painel">) {
  return (
    <Suspense>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

// "Ana", "Ana ou Luiz", "Ana, Bia ou Luiz".
function juntar(nomes: string[]): string {
  return nomes.length <= 1 ? (nomes[0] ?? "") : `${nomes.slice(0, -1).join(", ")} ou ${nomes.at(-1)}`;
}

// Quem tentou abrir uma parte do painel que o papel não permite volta para cá
// com ?aviso=sem-permissao&area=<papel necessário>.
async function explicarSemPermissao(usuario: Usuario, area: unknown): Promise<string | null> {
  const necessario: Papel = area === "equipe" ? "equipe" : "admin";
  if (pode(usuario, necessario)) return null;
  const nomes = await nomesDaAdministracao(usuario.id);
  const comQuem = nomes.length > 0 ? `fale com ${juntar(nomes)}` : "fale com a administração";
  if (necessario === "equipe") return `Seu acesso é só para as quantidades do dia. Se precisar mudar outra coisa, ${comQuem}.`;
  return `Essa parte é só para a Administração. Se precisar, ${comQuem}.`;
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/painel">["searchParams"] }) {
  await connection();
  const usuario = await exigirAcesso("estoque");
  // como-usar: Menu › Como usar, tocado em outra tela do painel.
  const { aviso, area, "como-usar": comoUsar } = await searchParams;
  const demo = !bancoConfigurado();
  const [doces, campanhas, loja, salvamento, semPermissao] = await Promise.all([
    listarTodosDoces(),
    listarCampanhas(),
    obterLoja(),
    ultimoSalvamentoDoEstoque(),
    aviso === "sem-permissao" ? explicarSemPermissao(usuario, area) : null,
  ]);
  return (
    <PessoaDoPainel nome={usuario.nome} papel={usuario.papel} demo={demo}>
      <EstoqueDoDia
        doces={doces}
        campanhas={campanhas}
        horarios={loja.horarios}
        salvamento={salvamento}
        hoje={hojeNaLoja()}
        pessoa={paraTela(usuario)}
        demo={demo}
        semPermissao={semPermissao}
        abrirComoUsar={comoUsar !== undefined}
      />
    </PessoaDoPainel>
  );
}
