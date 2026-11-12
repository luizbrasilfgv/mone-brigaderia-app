"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, use, useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { sair } from "@/app/entrar/acoes";
import { nomeDoPapel, pode, type Papel } from "@/lib/papeis";
import { useInstalarApp } from "../InstalarApp";
import {
  IconeAjuda,
  IconeCaixa,
  IconeCalendario,
  IconeCasa,
  IconeCelular,
  IconeFechar,
  IconeLivro,
  IconeLoja,
  IconeMais,
  IconeMenu,
  IconePessoa,
  IconePessoas,
  IconeSair,
  IconeTela,
  IconeVoltar,
} from "../Icones";
import { botaoRedondo, cx } from "../ui";
import { apagarRascunhosDoEstoque, haAlteracoesPendentes, useConfirmacao } from "./comum";

// Quem está usando o painel, para o Menu mostrar só o que o papel permite. Cada página
// do painel põe em volta da tela, depois de conferir o acesso no servidor.
interface Pessoa {
  nome: string;
  papel: Papel;
  demo: boolean;
  // Ainda vai criar a senha (/painel/criar-senha): o Menu tem só o mínimo.
  criandoSenha?: boolean;
}

const ContextoPessoa = createContext<Pessoa | null>(null);

export function PessoaDoPainel({ children, ...pessoa }: Pessoa & { children: ReactNode }) {
  return <ContextoPessoa value={pessoa}>{children}</ContextoPessoa>;
}

// Abre o guia Como usar no início do painel (src/app/painel/page.tsx lê; depois sai do endereço).
const PARAMETRO_COMO_USAR = "como-usar";

interface Item {
  rotulo: string;
  icone: ReactNode;
  minimo: Papel;
  // Link: passa pela pergunta "Sair sem salvar?" quando a tela tem alterações não salvas.
  href?: string;
  acao?: "como-usar" | "instalar" | "sair";
  // Item da tela atual (aria-current="page"). Sem isso, vale o endereço exato.
  atual?: (caminho: string) => boolean;
  // Também aparece para quem ainda vai criar a senha.
  aoCriarSenha?: boolean;
}

const GRUPOS: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Dia a dia",
    itens: [
      { rotulo: "O que tem hoje", icone: <IconeCaixa tamanho={24} />, minimo: "estoque", href: "/painel" },
      { rotulo: "Cadastrar novo doce", icone: <IconeMais tamanho={24} />, minimo: "equipe", href: "/painel/doces/novo" },
      {
        rotulo: "Campanhas",
        icone: <IconeCalendario tamanho={24} />,
        minimo: "equipe",
        href: "/painel/campanhas",
        atual: (c) => c === "/painel/campanhas" || c.startsWith("/painel/campanhas/"),
      },
    ],
  },
  {
    titulo: "Loja",
    itens: [
      { rotulo: "Dados da loja", icone: <IconeLoja tamanho={24} />, minimo: "admin", href: "/painel/loja" },
      { rotulo: "Acessos", icone: <IconePessoas tamanho={24} />, minimo: "admin", href: "/painel/acessos" },
      { rotulo: "Tela do balcão", icone: <IconeTela tamanho={24} />, minimo: "estoque", href: "/balcao" },
    ],
  },
  {
    titulo: "Ajuda",
    itens: [
      { rotulo: "Como usar", icone: <IconeAjuda tamanho={24} />, minimo: "estoque", acao: "como-usar" },
      { rotulo: "Guia da loja", icone: <IconeLivro tamanho={24} />, minimo: "estoque", href: "/guia", aoCriarSenha: true },
      { rotulo: "Instalar no celular", icone: <IconeCelular tamanho={24} />, minimo: "estoque", acao: "instalar" },
    ],
  },
  {
    titulo: "Conta",
    itens: [
      { rotulo: "Minha conta", icone: <IconePessoa tamanho={24} />, minimo: "estoque", href: "/painel/conta" },
      { rotulo: "Ver vitrine", icone: <IconeCasa tamanho={24} />, minimo: "estoque", href: "/", aoCriarSenha: true },
      { rotulo: "Sair", icone: <IconeSair tamanho={24} />, minimo: "estoque", acao: "sair", aoCriarSenha: true },
    ],
  },
];

// Cada parte é um quadrado de 3 por linha: o Menu da Administração cabe numa tela só.
const quadrado =
  "relative flex h-full min-h-[84px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center transition-transform active:scale-[0.97]";

// Botão "Menu" do cabeçalho do painel (sempre no canto de cima, à direita) e a folha com
// todas as partes do painel, filtradas pelo papel. É o caminho garantido para tudo no app
// instalado, que não tem barra de endereço (nem botão Voltar, no iPhone).
// aoComoUsar: no início do painel, abre o guia ali mesmo; nas outras telas, o item leva
// ao início com ?como-usar=1.
export function MenuPainel({ aoComoUsar }: { aoComoUsar?: () => void }) {
  const pessoa = use(ContextoPessoa);
  const caminho = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const idFolha = useId();
  const idTitulo = useId();
  const [aberto, setAberto] = useState(false);
  const instalacao = useInstalarApp("o painel", true);
  const [confirmacao, perguntar] = useConfirmacao();
  const [saindo, iniciarSaida] = useTransition();

  useEffect(() => {
    const folha = ref.current;
    if (!folha) return;
    if (aberto && !folha.open) folha.showModal();
    if (!aberto && folha.open) folha.close();
    // Página escondida pelo Next (Activity) com a folha aberta: tira da camada de cima.
    return () => folha.close();
  }, [aberto]);
  // E volta fechada quando a página aparecer de novo.
  useLayoutEffect(() => () => setAberto(false), []);

  if (!pessoa) return null;
  const fechar = () => ref.current?.close();

  async function sairDoPainel() {
    const sim = await perguntar({
      titulo: "Sair do painel neste celular?",
      texto: haAlteracoesPendentes()
        ? "O que você mudou nesta tela e não salvou será perdido. Para entrar de novo, você vai precisar do seu e-mail e da sua senha."
        : "Para entrar de novo, você vai precisar do seu e-mail e da sua senha.",
      confirmar: "Sair",
    });
    if (!sim) return;
    apagarRascunhosDoEstoque();
    iniciarSaida(() => sair());
  }

  const grupos = GRUPOS.map((g) => ({
    ...g,
    itens: g.itens.filter((item) => {
      if (pessoa.criandoSenha) return item.aoCriarSenha;
      if (!pode(pessoa, item.minimo)) return false;
      if (item.acao === "instalar") return instalacao.disponivel;
      if (item.acao === "sair") return !pessoa.demo;
      return true;
    }),
  })).filter((g) => g.itens.length > 0);

  function conteudo(item: Item, atual: boolean) {
    return (
      <>
        {/* A tela atual: borda dourada e um ponto no canto (o leitor de tela ouve "página atual"). */}
        {atual && <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-dourado" />}
        <span className="text-dourado">{item.icone}</span>
        <span className={cx("text-[13px] leading-tight font-bold", atual && "text-dourado")}>{item.rotulo}</span>
      </>
    );
  }

  function itemDoMenu(item: Item) {
    const href = item.acao === "como-usar" && !aoComoUsar ? `/painel?${PARAMETRO_COMO_USAR}=1` : item.href;
    if (href) {
      const atual = item.href !== undefined && (item.atual ? item.atual(caminho) : caminho === item.href);
      return (
        <Link
          href={href}
          aria-current={atual ? "page" : undefined}
          onClick={(e) => {
            // Tocou na tela em que já está: só fecha o Menu.
            if (atual) e.preventDefault();
            fechar();
          }}
          className={cx(quadrado, atual ? "border-dourado bg-dourado/14" : "border-dourado/12 bg-cacau-950/50")}
        >
          {conteudo(item, atual)}
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          fechar();
          if (item.acao === "como-usar") aoComoUsar?.();
          else if (item.acao === "instalar") instalacao.instalar();
          else if (item.acao === "sair") void sairDoPainel();
        }}
        className={cx(quadrado, "border-dourado/12 bg-cacau-950/50")}
      >
        {conteudo(item, false)}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={idFolha}
        disabled={saindo}
        onClick={() => setAberto(true)}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dourado/30 pr-3.5 pl-3 text-[13px] font-bold text-dourado transition-transform active:scale-95 disabled:opacity-60"
      >
        <IconeMenu tamanho={20} />
        {saindo ? "Saindo…" : "Menu"}
      </button>

      <dialog
        ref={ref}
        id={idFolha}
        aria-labelledby={idTitulo}
        onClose={() => setAberto(false)}
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="mx-auto mt-auto mb-0 max-h-[calc(100dvh-max(16px,env(safe-area-inset-top)))] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[32px] border-0 border-t border-dourado/20 bg-cacau-900 p-0 text-creme backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {aberto && (
          <div className="flex flex-col gap-4 px-[18px] pt-5 pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 pl-1">
              <div className="flex min-w-0 grow flex-col gap-0.5">
                <h2 id={idTitulo} className="font-display text-2xl leading-tight font-semibold">
                  Menu
                </h2>
                <span className="truncate text-xs text-creme-400">
                  {pessoa.nome} · {nomeDoPapel(pessoa.papel)}
                </span>
              </div>
              <button type="button" onClick={fechar} aria-label="Fechar o menu" className={botaoRedondo}>
                <IconeFechar tamanho={20} />
              </button>
            </div>
            <nav aria-label="Partes do painel" className="flex flex-col gap-3.5">
              {grupos.map((g, i) => (
                <div key={g.titulo} role="group" aria-labelledby={`${idFolha}-grupo-${i}`} className="flex flex-col gap-1.5">
                  <h3 id={`${idFolha}-grupo-${i}`} className="pl-1 text-xs font-bold tracking-[0.12em] text-creme-400 uppercase">
                    {g.titulo}
                  </h3>
                  <ul className="grid grid-cols-3 gap-2">
                    {g.itens.map((item) => (
                      <li key={item.rotulo}>{itemDoMenu(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        )}
      </dialog>
      {instalacao.ajuda}
      {confirmacao}
    </>
  );
}

export function CabecalhoPainel({
  titulo,
  subtitulo,
  voltar,
  acao,
}: {
  titulo: string;
  subtitulo: string;
  voltar?: string;
  acao?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pt-[18px] pb-1.5">
      {voltar && (
        <Link href={voltar} aria-label="Voltar" className={botaoRedondo}>
          <IconeVoltar />
        </Link>
      )}
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <h1 className="font-display text-2xl leading-tight font-semibold">{titulo}</h1>
        <span className="text-xs text-creme-400">{subtitulo}</span>
      </div>
      {acao}
      <MenuPainel />
    </header>
  );
}
