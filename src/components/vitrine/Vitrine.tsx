"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Campanha, Categoria, Doce } from "@/lib/tipos";
import { LOJA, type DadosLoja } from "@/lib/loja";
import { abreNoDia, hojeNaLoja, situacaoDaLoja } from "@/lib/horarios";
import { useAgora, useFavoritos, useSacola } from "@/lib/hooks";
import {
  campanhasNoAr,
  doceApareceNaVitrine,
  encomendaAberta,
  estoqueDoDoce,
  formatarPreco,
  mensagemGeral,
  nomeCurtoDaCampanha,
  precoMinimo,
  semGluten,
  seloDoDoce,
  somarDias,
  temPrecosDiferentes,
} from "@/lib/regras";
import { unidadesDoDoce, unidadesNaSacola } from "@/lib/sacola";
import { BannerCampanha, botaoBanner } from "../BannerCampanha";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { InfoDaLoja, NumeroWhatsApp } from "../InfoDaLoja";
import { InstalarApp } from "../InstalarApp";
import { ImagemDoce } from "../ImagemDoce";
import { IconeCasa, IconeConversa, IconeCoracao, IconePessoa, IconeSacola } from "../Icones";
import { botaoRedondo, cx } from "../ui";
import { CartaoDoce } from "./CartaoDoce";

interface Secao {
  titulo: string;
  sub: string;
  doces: Doce[];
}

// O destaque só aparece com 3 doces ou mais na vitrine (com menos, repetiria a lista).
const MINIMO_PARA_DESTAQUE = 3;

export function Vitrine({
  doces,
  campanhas,
  categorias,
  loja,
  agora: agoraDoServidor,
}: {
  doces: Doce[];
  campanhas: Campanha[];
  categorias: Categoria[];
  loja: DadosLoja;
  // Momento da visita, calculado no servidor (minutoAtual).
  agora: number;
}) {
  const agora = useAgora(agoraDoServidor);
  const hoje = hojeNaLoja(agora);
  const situacao = situacaoDaLoja(loja.horarios, agora);
  const { ids: favoritos, alternar } = useFavoritos();
  const { sacola } = useSacola();
  const [filtro, setFiltro] = useState("todos");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [zapAberto, setZapAberto] = useState(false);
  const fecharZap = useCallback(() => setZapAberto(false), [setZapAberto]);
  const listaRef = useRef<HTMLDivElement>(null);
  // O Next guarda a vitrine escondida ao navegar: ao sair, fecha a folha.
  useLayoutEffect(() => () => setZapAberto(false), []);

  // Ao tocar em Favoritos, num chip ou em "Ver doces de…", mostra a lista nova e rola até
  // ela, se estiver escondida (atrás das abas ou lá embaixo).
  function mostrarLista(mudar: () => void) {
    flushSync(mudar);
    const lista = listaRef.current;
    if (!lista) return;
    const topo = lista.getBoundingClientRect().top;
    if (topo < 80 || topo > window.innerHeight * 0.55) {
      const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      lista.scrollIntoView({ block: "start", behavior: semAnimacao ? "auto" : "smooth" });
    }
  }

  function escolherFiltro(id: string) {
    mostrarLista(() => {
      setFiltro(id);
      setSoFavoritos(false);
    });
  }

  const noArTodas = campanhasNoAr(campanhas, hoje);
  const idsNoAr = new Set(noArTodas.map((c) => c.id));
  const visiveis = doces.filter((d) => doceApareceNaVitrine(d, idsNoAr));
  // Campanha sem nenhum doce na vitrine não ganha chip nem "Ver doces de…".
  const noAr = noArTodas.filter((c) => visiveis.some((d) => d.campanhaIds.includes(c.id)));
  const destaque = !soFavoritos && visiveis.length >= MINIMO_PARA_DESTAQUE ? visiveis.find((d) => d.destaque) : undefined;
  const campanhaFiltrada = noAr.find((c) => filtro === `campanha:${c.id}`);
  const temProntaEntrega = (c: Campanha) =>
    visiveis.some((d) => d.campanhaIds.includes(c.id) && !d.sobEncomenda && estoqueDoDoce(d, hoje).disponivel);
  const dicaEsgotado = abreNoDia(loja.horarios, somarDias(hoje, 1)) ? "Peça para amanhã" : "Peça para outro dia";

  const filtrados = soFavoritos
    ? visiveis.filter((d) => favoritos.has(d.id))
    : campanhaFiltrada
      ? visiveis.filter((d) => d.campanhaIds.includes(campanhaFiltrada.id))
      : filtro === "todos"
        ? // O doce do destaque não se repete na lista.
          visiveis.filter((d) => d !== destaque)
        : visiveis.filter((d) => d.categoriaId === filtro);

  const prontaEntrega = filtrados.filter((d) => !d.sobEncomenda);
  const secoes: Secao[] = (
    soFavoritos
      ? [{ titulo: "Seus favoritos", sub: "Os doces que você guardou", doces: filtrados }]
      : campanhaFiltrada
        ? [
            {
              titulo: `Doces de ${nomeCurtoDaCampanha(campanhaFiltrada)}`,
              sub: [campanhaFiltrada.nome, encomendaAberta(campanhaFiltrada, hoje, temProntaEntrega(campanhaFiltrada)).texto]
                .filter(Boolean)
                .join(" · "),
              doces: filtrados,
            },
          ]
        : [
            {
              // "hoje" só quando todas as quantidades foram salvas hoje.
              titulo: prontaEntrega.every((d) => estoqueDoDoce(d, hoje).deHoje) ? "Pronta entrega hoje" : "Pronta entrega",
              sub: "Para levar na hora",
              doces: prontaEntrega,
            },
            { titulo: "Sob encomenda", sub: "Feitos para você. O dia você combina no WhatsApp.", doces: filtrados.filter((d) => d.sobEncomenda) },
          ]
  ).filter((s) => s.doces.length > 0);

  const chips = [
    { id: "todos", nome: "Todos" },
    ...noAr.map((c) => ({ id: `campanha:${c.id}`, nome: nomeCurtoDaCampanha(c) })),
    // Só as categorias que têm algum doce na vitrine agora.
    ...categorias.filter((c) => visiveis.some((d) => d.categoriaId === c.id)).map((c) => ({ id: c.id, nome: c.nome })),
  ];

  // De preferência, o banner de uma campanha que tem doces na vitrine.
  const banner = soFavoritos ? undefined : (noAr[0] ?? noArTodas[0]);
  const bannerTemDoces = banner && noAr.includes(banner);
  // Foto do banner: um doce da própria campanha (sem doce, o banner fica com a logo).
  const doceDoBanner =
    banner &&
    (visiveis.find((d) => d.campanhaIds.includes(banner.id) && d.ondeAparece === "so_campanhas") ??
      visiveis.find((d) => d.campanhaIds.includes(banner.id)));
  const estoqueDestaque = destaque && estoqueDoDoce(destaque, hoje);
  const naSacola = sacola ? unidadesNaSacola(sacola) : null;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="flex flex-col gap-1.5 px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-2.5">
        <div className="flex items-center gap-2.5">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={42} height={42} className="shrink-0 rounded-full" loading="eager" />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">Vitrine de hoje</span>
            <h1 className="truncate font-display text-xl font-semibold">{LOJA.nome}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setZapAberto(true)} aria-label="Falar com a Mone no WhatsApp" className={botaoRedondo}>
              <IconeConversa tamanho={20} />
            </button>
            <Link href="/entrar" aria-label="Área da loja" className={botaoRedondo}>
              <IconePessoa tamanho={20} />
            </Link>
          </div>
        </div>
        {situacao && (
          <p className={cx("flex items-center gap-1.5 pl-[52px] text-xs font-semibold", situacao.aberta ? "text-menta" : "text-creme-200")}>
            <span className={cx("size-2 shrink-0 rounded-full", situacao.aberta ? "animate-pulsa bg-menta" : "bg-creme-400")} />
            {situacao.texto}
          </p>
        )}
      </header>

      {banner && (
        <div className="mx-5 mt-2">
          <BannerCampanha
            campanha={banner}
            prazo={encomendaAberta(banner, hoje, temProntaEntrega(banner))}
            doce={doceDoBanner}
            botao={
              bannerTemDoces && (
                <button type="button" onClick={() => escolherFiltro(`campanha:${banner.id}`)} className={botaoBanner}>
                  Ver doces de {nomeCurtoDaCampanha(banner)}
                </button>
              )
            }
          />
        </div>
      )}

      {destaque && (
        <section
          aria-label="Destaque da semana"
          className="relative mx-5 mt-3.5 h-[232px] overflow-hidden rounded-[28px] border border-dourado/16 bg-cacau-800"
        >
          <div className="absolute -top-8 -right-12 size-[270px] rounded-full bg-[radial-gradient(closest-side,rgba(230,196,142,0.3),rgba(230,196,142,0))]" />
          {/* Em tela estreita (360 px) a foto diminui para não cobrir o preço. */}
          <div className="absolute top-[38px] right-4 w-[146px] animate-flutua overflow-hidden rounded-[22px] border-[3px] border-pessego shadow-2xl fundo-vitrine max-[380px]:top-[60px] max-[380px]:right-3 max-[380px]:w-[100px]">
            <ImagemDoce doce={destaque} tamanhos="146px" prioridade />
          </div>
          <div className="absolute top-5 bottom-5 left-5 flex w-[180px] flex-col gap-2 max-[380px]:w-[170px]">
            {!destaque.sobEncomenda && estoqueDestaque?.disponivel && estoqueDestaque.deHoje && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-menta/12 px-2.5 py-1 text-xs font-bold text-menta">
                <span className="size-1.5 animate-pulsa rounded-full bg-menta" />
                Pronta entrega
              </span>
            )}
            <span className="text-xs font-bold tracking-[0.14em] text-dourado uppercase">Carro-chefe</span>
            <h2 className="font-display text-[30px] leading-none font-semibold">{destaque.nome}</h2>
            <p className="line-clamp-1 text-[13px] leading-snug text-creme-200">{destaque.descricao}</p>
            <div className="mt-auto flex items-center gap-2.5">
              <Link
                href={`/doce/${destaque.id}`}
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-dourado px-4 text-sm font-bold whitespace-nowrap text-cacau-900 active:scale-95"
              >
                Ver doce
              </Link>
              <span className="flex flex-col leading-none">
                {temPrecosDiferentes(destaque) && <span className="text-xs font-semibold text-creme-200">a partir de</span>}
                <span className="font-display text-xl font-semibold">{formatarPreco(precoMinimo(destaque))}</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Abas de categoria presas no topo enquanto a pessoa rola. */}
      <div className="sticky top-0 z-30 mt-2 border-b border-dourado/8 bg-cacau-950/95 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div role="group" aria-label="Categorias" className="sem-barra flex gap-2 overflow-x-auto px-5 py-3">
          {chips.map((chip) => {
            const ativo = !soFavoritos && filtro === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => escolherFiltro(chip.id)}
                className={cx(
                  "h-11 shrink-0 rounded-full border px-4 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  ativo ? "border-dourado bg-dourado text-cacau-900" : "border-dourado/18 bg-creme/[0.04] text-creme-200",
                )}
              >
                {chip.nome}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={listaRef} className="scroll-mt-[calc(68px+env(safe-area-inset-top))]">
        {soFavoritos && filtrados.length === 0 && (
          <>
            <h2 className="px-5 pt-[18px] pb-3 font-display text-[22px] font-semibold">Seus favoritos</h2>
            <p className="mx-5 rounded-[20px] border border-dashed border-dourado/28 p-6 text-center text-sm leading-relaxed text-creme-200">
              Toque no coração de um doce para guardar aqui. Fica salvo neste celular.
            </p>
          </>
        )}

        {!soFavoritos && visiveis.length === 0 && (
          <p className="mx-5 mt-4 rounded-[20px] border border-dashed border-dourado/28 p-6 text-center text-sm leading-relaxed text-creme-200">
            Os doces de hoje ainda vão aparecer aqui. Enquanto isso, chame a gente no WhatsApp para encomendar.
          </p>
        )}

        {secoes.map((secao) => (
          <section key={secao.titulo} aria-label={secao.titulo}>
            <div className="flex items-baseline justify-between gap-3 px-5 pt-[18px] pb-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="font-display text-[22px] font-semibold">{secao.titulo}</h2>
                <span className="text-xs text-creme-400">{secao.sub}</span>
              </div>
              <span className="shrink-0 text-xs text-creme-400">
                {secao.doces.length} {secao.doces.length === 1 ? "doce" : "doces"}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 px-5">
              {secao.doces.map((doce) => (
                <li key={doce.id}>
                  <CartaoDoce
                    doce={doce}
                    estoque={estoqueDoDoce(doce, hoje)}
                    selo={seloDoDoce(doce, noArTodas, hoje)}
                    semGluten={semGluten(doce, loja.tracos)}
                    dicaEsgotado={dicaEsgotado}
                    naSacola={sacola ? unidadesDoDoce(sacola, doce.id) : 0}
                    favorito={favoritos.has(doce.id)}
                    aoFavoritar={() => alternar(doce.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section aria-labelledby="como-funciona" className="mx-5 mt-10 flex flex-col gap-3 rounded-[22px] border border-dourado/12 bg-cacau-900 p-[18px]">
        <h2 id="como-funciona" className="font-display text-xl font-semibold">
          Como funciona
        </h2>
        <p className="text-sm leading-relaxed text-creme-200">Monte sua sacola e envie o pedido pelo WhatsApp. A Mone confirma por lá.</p>
        <InfoDaLoja loja={loja} />
        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={() => setZapAberto(true)}
            className="inline-flex min-h-11 items-center gap-2 text-[15px] font-bold text-whatsapp"
          >
            <IconeConversa tamanho={20} strokeWidth={2} />
            Falar com a Mone no WhatsApp
          </button>
          <NumeroWhatsApp numero={loja.whatsapp} className="text-xs text-creme-400" />
        </div>
      </section>

      {/* Entrada discreta para a equipe: painel, guia "Como usar" e Acessos. */}
      <footer className="flex flex-wrap items-center justify-center gap-x-2 px-5 pt-6">
        <InstalarApp variante="link" nome="a Mone Brigaderia" />
        <Link href="/entrar" className="inline-flex min-h-11 items-center px-3 text-xs text-creme-400 underline underline-offset-4">
          Área da loja
        </Link>
      </footer>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-4 bottom-[calc(18px+env(safe-area-inset-bottom))] z-40 mx-auto grid h-[68px] max-w-[calc(28rem-2rem)] grid-cols-3 items-center rounded-[26px] border border-dourado/16 bg-cacau-900/95 shadow-2xl backdrop-blur-lg"
      >
        <button
          type="button"
          aria-current={soFavoritos ? undefined : "page"}
          onClick={() => {
            setSoFavoritos(false);
            setFiltro("todos");
            window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          }}
          className={cx("flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold", soFavoritos ? "text-creme-400" : "text-dourado")}
        >
          <IconeCasa />
          Início
        </button>
        <button
          type="button"
          aria-current={soFavoritos ? "page" : undefined}
          onClick={() => mostrarLista(() => setSoFavoritos(true))}
          className={cx("flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold", soFavoritos ? "text-dourado" : "text-creme-400")}
        >
          <IconeCoracao />
          Favoritos
        </button>
        <Link
          href="/sacola"
          aria-label={naSacola === null ? "Sacola" : naSacola === 0 ? "Sacola vazia" : `Sacola: ${naSacola} ${naSacola === 1 ? "item" : "itens"}`}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-creme-400"
        >
          {/* O selo fica por cima do ícone: a barra não se mexe quando a sacola é lida. */}
          <span className="relative">
            <IconeSacola />
            {naSacola !== null && naSacola > 0 && (
              <span
                key={naSacola}
                aria-hidden="true"
                className="absolute -top-2 left-3.5 flex h-5 min-w-5 animate-pulo items-center justify-center rounded-full bg-dourado px-1 text-xs font-bold text-cacau-900"
              >
                {naSacola}
              </span>
            )}
          </span>
          Sacola
        </Link>
      </nav>

      <FolhaWhatsApp
        aberta={zapAberto}
        aoFechar={fecharZap}
        loja={loja}
        situacao={situacao}
        titulo="Falar com a Mone"
        mensagem={mensagemGeral(LOJA.nome)}
        explicacao="Para dúvidas ou pedidos diferentes. Para os doces da vitrine, use a sacola: o pedido já vai todo escrito."
      />
    </div>
  );
}
