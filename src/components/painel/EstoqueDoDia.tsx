"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, useSyncExternalStore, useTransition } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import type { PessoaNoPainel } from "@/lib/painel";
import { LOJA } from "@/lib/loja";
import { useHoje } from "@/lib/hooks";
import { nomeDoPapel, pode } from "@/lib/papeis";
import { campanhasNoAr, estoqueDoDoce, formatarDiaMes, formatarPreco } from "@/lib/regras";
import { marcarTutorialVisto, salvarEstoque } from "@/app/painel/acoes";
import { sair } from "@/app/entrar/acoes";
import { ImagemDoce } from "../ImagemDoce";
import { IconeAjuda, IconeCalendario, IconeEstrela, IconeMais, IconePessoas, IconeRelogio, IconeSeta } from "../Icones";
import { COR_ESTOQUE, botaoPrimario, cartao, cx } from "../ui";
import { Contador, FaixaDemo, useAviso } from "./comum";
import { Tutorial } from "./Tutorial";

// No modo demonstração não há conta: lembra no navegador que o guia já foi visto.
const CHAVE_TUTORIAL = "mone:tutorial-visto";
const semAssinatura = () => () => {};
function lerTutorialVisto(): boolean {
  try {
    return localStorage.getItem(CHAVE_TUTORIAL) === "1";
  } catch {
    return true;
  }
}

function Iniciais({ nome }: { nome: string }) {
  const letras = nome
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dourado/20 text-xs font-bold text-dourado">
      {letras || "?"}
    </span>
  );
}

export function EstoqueDoDia({
  doces,
  campanhas,
  pessoa,
  demo,
}: {
  doces: Doce[];
  campanhas: Campanha[];
  pessoa: PessoaNoPainel;
  demo: boolean;
}) {
  const hoje = useHoje();
  const [aviso, mostrarAviso] = useAviso();
  const [salvando, iniciar] = useTransition();
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries(doces.map((d) => [d.id, d.quantidadeHoje])),
  );
  const [destaqueId, setDestaqueId] = useState(doces.find((d) => d.destaque)?.id);

  // O guia abre sozinho no primeiro acesso e depois pelo botão "Como usar".
  const vistoNoNavegador = useSyncExternalStore(semAssinatura, lerTutorialVisto, () => true);
  const [tutorial, setTutorial] = useState<"auto" | "aberto" | "fechado">("auto");
  const tutorialAberto = tutorial === "aberto" || (tutorial === "auto" && !(demo ? vistoNoNavegador : pessoa.tutorialVisto));
  const fecharTutorial = useCallback(() => {
    setTutorial("fechado");
    if (demo) {
      try {
        localStorage.setItem(CHAVE_TUTORIAL, "1");
      } catch {
        // Sem armazenamento no navegador: o guia volta a abrir na próxima visita.
      }
    } else if (!pessoa.tutorialVisto) {
      void marcarTutorialVisto();
    }
  }, [demo, pessoa.tutorialVisto]);

  const editaDoces = pode(pessoa, "equipe");
  const comQuantidade = doces.map((d) => ({ ...d, quantidadeHoje: quantidades[d.id] ?? 0 }));
  const ativos = comQuantidade.filter((d) => d.ativo);
  const naVitrine = ativos.filter((d) => estoqueDoDoce(d).disponivel).length;
  const esgotados = ativos.length - naVitrine;
  const unidades = ativos.filter((d) => !d.sobEncomenda).reduce((t, d) => t + d.quantidadeHoje, 0);
  const destaque = doces.find((d) => d.id === destaqueId);
  const campanha = hoje ? campanhasNoAr(campanhas, hoje)[0] : undefined;
  // Quem cuida só do estoque vê só os doces que têm quantidade.
  const lista = editaDoces ? comQuantidade : comQuantidade.filter((d) => d.ativo && !d.sobEncomenda);

  return (
    <div className="pb-8">
      {aviso}
      <FaixaDemo demo={demo} />
      <Tutorial papel={pessoa.papel} aberto={tutorialAberto} aoFechar={fecharTutorial} />

      <header className="flex flex-col gap-3 px-5 pt-[18px] pb-1.5">
        <div className="flex items-center gap-3">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={44} height={44} className="rounded-full" />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">{LOJA.nome}</span>
            <h1 className="font-display text-[22px] font-semibold">Painel da loja</h1>
          </div>
          <Link
            href="/"
            className="flex h-11 shrink-0 items-center rounded-full border border-dourado/30 px-3.5 text-[13px] font-bold text-dourado"
          >
            Ver vitrine
          </Link>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-dourado/10 bg-cacau-900 py-1.5 pr-1 pl-2.5">
          <Iniciais nome={pessoa.nome} />
          <div className="flex min-w-0 grow flex-col">
            <span className="truncate text-[13px] font-semibold">{pessoa.nome}</span>
            <span className="text-[11px] text-creme-400">{nomeDoPapel(pessoa.papel)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTutorial("aberto")}
            className="flex h-11 shrink-0 items-center gap-1 px-2 text-[13px] font-semibold text-dourado"
          >
            <IconeAjuda tamanho={18} />
            Como usar
          </button>
          {!demo && (
            <form action={sair}>
              <button type="submit" className="h-11 px-2 text-[13px] font-semibold text-creme-400">
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className={cx(cartao, "flex flex-col gap-1 p-4")}>
            <span className="text-xs text-creme-400">Doces na vitrine</span>
            <span className="font-display text-[34px] font-semibold text-menta">{naVitrine}</span>
            <span className="text-xs text-creme-400">
              {esgotados === 0 ? "nenhum esgotado" : `${esgotados} ${esgotados === 1 ? "esgotado" : "esgotados"}`}
            </span>
          </div>
          <div className={cx(cartao, "flex flex-col gap-1 p-4")}>
            <span className="text-xs text-creme-400">Unidades hoje</span>
            <span className="font-display text-[34px] font-semibold">{unidades}</span>
            <span className="text-xs text-creme-400">somando todos os doces</span>
          </div>
        </div>

        {editaDoces && destaque && (
          <div className="flex items-center gap-3 rounded-[20px] border border-dourado/20 bg-cacau-800 px-4 py-3.5">
            <IconeEstrela className="fill-dourado text-dourado" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-creme-400">Destaque da vitrine</span>
              <span className="text-[15px] font-bold">{destaque.nome}</span>
            </div>
          </div>
        )}

        {editaDoces && (
          <Link
            href="/painel/campanhas"
            className="flex items-center gap-3 rounded-[20px] border border-dourado/25 py-3.5 pr-3 pl-4 text-[#FFF4E6] active:scale-[0.98]"
            style={{ background: campanha?.cor ?? "#3A1D13" }}
          >
            <IconeCalendario className="text-[#F0CF98]" />
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-xs text-[#F6DCCB]">Campanhas</span>
              <span className="text-[15px] font-bold">
                {campanha ? `${campanha.nome} · no ar até ${formatarDiaMes(campanha.fim)}` : "Nenhuma no ar agora"}
              </span>
            </div>
            <IconeSeta tamanho={20} />
          </Link>
        )}

        {pode(pessoa, "admin") && (
          <Link
            href="/painel/acessos"
            className={cx(cartao, "flex items-center gap-3 py-3.5 pr-3 pl-4 active:scale-[0.98]")}
          >
            <IconePessoas className="text-dourado" />
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-xs text-creme-400">Acessos</span>
              <span className="text-[15px] font-bold">Quem pode entrar no painel</span>
            </div>
            <IconeSeta tamanho={20} className="text-creme-400" />
          </Link>
        )}

        {editaDoces && (
          <Link href="/painel/doces/novo" className={cx(botaoPrimario, "h-[52px] text-[15px]")}>
            <IconeMais tamanho={20} />
            Cadastrar novo doce
          </Link>
        )}

        <div className="mt-1.5 flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold">O que tem hoje</h2>
          <p className="text-[13px] leading-snug text-creme-400">
            Informe quantas unidades tem de cada doce. Chegou a zero, ele aparece como esgotado.
            {editaDoces && " Doce sob encomenda não tem quantidade. Toque no doce para editar a ficha."}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {lista.map((doce) => {
            const estoque = estoqueDoDoce(doce);
            const ehDestaque = doce.id === destaqueId;
            const identificacao = (
              <>
                <div className="fundo-vitrine size-14 shrink-0 overflow-hidden rounded-xl">
                  <ImagemDoce doce={doce} tamanhos="56px" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm leading-tight font-semibold">{doce.nome}</span>
                  <span className={cx("text-xs", doce.ativo ? COR_ESTOQUE[estoque.tom] : "text-creme-400")}>
                    {formatarPreco(doce.precoCentavos)} ·{" "}
                    {!doce.ativo ? "Fora da vitrine" : doce.sobEncomenda ? "Sob encomenda" : estoque.texto}
                  </span>
                </div>
              </>
            );
            return (
              <li
                key={doce.id}
                className={cx("flex flex-col gap-1 rounded-[18px] border border-dourado/10 bg-cacau-900 p-2 pb-1.5", !doce.ativo && "opacity-60")}
              >
                <div className="flex items-center gap-1">
                  {editaDoces ? (
                    <Link href={`/painel/doces/${doce.id}`} className="flex min-w-0 grow items-center gap-2.5">
                      {identificacao}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 grow items-center gap-2.5">{identificacao}</div>
                  )}
                  {editaDoces && (
                    <button
                      type="button"
                      aria-pressed={ehDestaque}
                      aria-label={`Colocar em destaque: ${doce.nome}`}
                      onClick={() => setDestaqueId(doce.id)}
                      className="flex size-11 shrink-0 items-center justify-center active:scale-90"
                    >
                      <IconeEstrela tamanho={20} className={ehDestaque ? "fill-dourado text-dourado" : "text-creme-400"} />
                    </button>
                  )}
                </div>
                <div className="flex min-h-11 items-center justify-between gap-2 pl-[66px]">
                  {doce.sobEncomenda ? (
                    <>
                      <span className="text-xs text-creme-400">Feito só quando pedem</span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pessego/35 bg-pessego/12 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-pessego">
                        <IconeRelogio tamanho={14} strokeWidth={2} />
                        Pronto em {doce.prazoDias} {doce.prazoDias === 1 ? "dia" : "dias"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-creme-400">Quantidade hoje</span>
                      <Contador
                        valor={doce.quantidadeHoje}
                        rotulo={`quantidade de ${doce.nome}`}
                        aoMudar={(v) => setQuantidades((q) => ({ ...q, [doce.id]: v }))}
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          disabled={salvando}
          onClick={() =>
            iniciar(async () => {
              const resultado = await salvarEstoque(quantidades, destaqueId ?? null);
              mostrarAviso(resultado.mensagem, resultado.ok);
            })
          }
          className={cx(botaoPrimario, "disabled:opacity-60")}
        >
          {salvando ? "Salvando…" : "Salvar o dia"}
        </button>
      </div>
    </div>
  );
}
