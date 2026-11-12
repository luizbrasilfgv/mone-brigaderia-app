"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { Campanha, Categoria, Doce } from "@/lib/tipos";
import { LOJA, type DadosLoja } from "@/lib/loja";
import { abreNoDia, hojeNaLoja, situacaoDaLoja } from "@/lib/horarios";
import { useAgora, useFavoritos } from "@/lib/hooks";
import {
  campanhasNoAr,
  doceApareceNaVitrine,
  encomendaAberta,
  estoqueDoDoce,
  formatarPreco,
  mensagemGeral,
  nomeCurtoDaCampanha,
  seloDoDoce,
  somarDias,
} from "@/lib/regras";
import { BannerCampanha, botaoBanner } from "../BannerCampanha";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { InfoDaLoja, NumeroWhatsApp } from "../InfoDaLoja";
import { InstalarApp } from "../InstalarApp";
import { ImagemDoce } from "../ImagemDoce";
import { IconeCasa, IconeConversa, IconeCoracao, IconePessoa } from "../Icones";
import { botaoRedondo, cx } from "../ui";
import { CartaoDoce } from "./CartaoDoce";

interface Secao {
  titulo: string;
  sub: string;
  doces: Doce[];
}

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
  const [filtro, setFiltro] = useState("todos");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [zapAberto, setZapAberto] = useState(false);
  const fecharZap = useCallback(() => setZapAberto(false), [setZapAberto]);

  const noArTodas = campanhasNoAr(campanhas, hoje);
  const idsNoAr = new Set(noArTodas.map((c) => c.id));
  const visiveis = doces.filter((d) => doceApareceNaVitrine(d, idsNoAr));
  // Campanha sem nenhum doce na vitrine não ganha chip nem "Ver doces de…".
  const noAr = noArTodas.filter((c) => visiveis.some((d) => d.campanhaIds.includes(c.id)));
  const destaque = visiveis.find((d) => d.destaque);
  const campanhaFiltrada = noAr.find((c) => filtro === `campanha:${c.id}`);
  const temProntaEntrega = (c: Campanha) =>
    visiveis.some((d) => d.campanhaIds.includes(c.id) && !d.sobEncomenda && estoqueDoDoce(d, hoje).disponivel);
  const dicaEsgotado = abreNoDia(loja.horarios, somarDias(hoje, 1)) ? "Peça para amanhã" : "Peça para outro dia";

  const filtrados = soFavoritos
    ? visiveis.filter((d) => favoritos.has(d.id))
    : campanhaFiltrada
      ? visiveis.filter((d) => d.campanhaIds.includes(campanhaFiltrada.id))
      : filtro === "todos"
        ? visiveis
        : visiveis.filter((d) => d.categoriaId === filtro);

  const prontaEntrega = filtrados.filter((d) => !d.sobEncomenda);
  const secoes: Secao[] = soFavoritos
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
          { titulo: "Sob encomenda", sub: "Peça com antecedência pelo WhatsApp", doces: filtrados.filter((d) => d.sobEncomenda) },
        ].filter((s) => s.doces.length > 0);

  const chips = [
    { id: "todos", nome: "Todos" },
    ...noAr.map((c) => ({ id: `campanha:${c.id}`, nome: nomeCurtoDaCampanha(c) })),
    // Só as categorias que têm algum doce na vitrine agora.
    ...categorias.filter((c) => visiveis.some((d) => d.categoriaId === c.id)).map((c) => ({ id: c.id, nome: c.nome })),
  ];

  // De preferência, o banner de uma campanha que tem doces na vitrine.
  const banner = noAr[0] ?? noArTodas[0];
  const bannerTemDoces = banner && noAr.includes(banner);
  const estoqueDestaque = destaque && estoqueDoDoce(destaque, hoje);

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <header className="flex flex-col gap-1.5 px-5 pt-[18px] pb-2.5">
        <div className="flex items-center gap-2.5">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={42} height={42} className="shrink-0 rounded-full" priority />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">Vitrine de hoje</span>
            <h1 className="truncate font-display text-xl font-semibold">{LOJA.nome}</h1>
          </div>
          {/* Botões redondos à direita. Sobra espaço para mais um de 44 px em tela de 360 px
              (a etapa da sacola põe aqui o "Falar com a Mone"). */}
          <div className="flex shrink-0 items-center gap-2">
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
            doce={visiveis.find((d) => d.campanhaIds.includes(banner.id) && d.ondeAparece === "so_campanhas") ?? destaque ?? doces[0]}
            botao={
              bannerTemDoces && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltro(`campanha:${banner.id}`);
                    setSoFavoritos(false);
                  }}
                  className={botaoBanner}
                >
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
          <div className="absolute top-[38px] right-4 w-[146px] animate-flutua overflow-hidden rounded-[22px] border-[3px] border-pessego shadow-2xl fundo-vitrine">
            <ImagemDoce doce={destaque} tamanhos="146px" prioridade />
          </div>
          <div className="absolute top-5 bottom-5 left-5 flex w-[180px] flex-col gap-2">
            {!destaque.sobEncomenda && estoqueDestaque?.disponivel && estoqueDestaque.deHoje && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-menta/12 px-2.5 py-1 text-[11px] font-bold text-menta">
                <span className="size-1.5 animate-pulsa rounded-full bg-menta" />
                Pronta entrega
              </span>
            )}
            <span className="text-[11px] font-bold tracking-[0.14em] text-dourado uppercase">Carro-chefe</span>
            <h2 className="font-display text-[30px] leading-none font-semibold">{destaque.nome}</h2>
            <p className="line-clamp-1 text-[13px] leading-snug text-creme-200">{destaque.descricao}</p>
            <div className="mt-auto flex items-center gap-3">
              <Link
                href={`/doce/${destaque.id}`}
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-dourado px-[18px] text-sm font-bold whitespace-nowrap text-cacau-900 active:scale-95"
              >
                Ver doce
              </Link>
              <span className="font-display text-xl font-semibold">{formatarPreco(destaque.precoCentavos)}</span>
            </div>
          </div>
        </section>
      )}

      <div role="group" aria-label="Categorias" className="sem-barra flex gap-2 overflow-x-auto px-5 pt-[18px] pb-1">
        {chips.map((chip) => {
          const ativo = !soFavoritos && filtro === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={ativo}
              onClick={() => {
                setFiltro(chip.id);
                setSoFavoritos(false);
              }}
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

      {soFavoritos && filtrados.length === 0 && (
        <>
          <h2 className="px-5 pt-[18px] pb-3 font-display text-[22px] font-semibold">Seus favoritos</h2>
          <p className="mx-5 rounded-[20px] border border-dashed border-dourado/28 p-6 text-center text-sm leading-relaxed text-creme-200">
            Toque no coração de um doce para guardar aqui.
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
          <div className="grid grid-cols-2 gap-3 px-5">
            {secao.doces.map((doce) => (
              <CartaoDoce
                key={doce.id}
                doce={doce}
                estoque={estoqueDoDoce(doce, hoje)}
                selo={seloDoDoce(doce, noArTodas, hoje)}
                semGluten={!doce.contemGluten && !loja.tracos.includes("trigo")}
                dicaEsgotado={dicaEsgotado}
                favorito={favoritos.has(doce.id)}
                aoFavoritar={() => alternar(doce.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="como-funciona" className="mx-5 mt-10 flex flex-col gap-3 rounded-[22px] border border-dourado/12 bg-cacau-900 p-[18px]">
        <h2 id="como-funciona" className="font-display text-xl font-semibold">
          Como funciona
        </h2>
        <p className="text-sm leading-relaxed text-creme-200">
          Escolha o doce e mande o pedido pelo WhatsApp. A Mone responde confirmando o pedido e o total, e vocês combinam a
          retirada ou a entrega.
        </p>
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
        className="fixed inset-x-4 bottom-[18px] z-40 mx-auto grid h-[68px] max-w-[calc(28rem-2rem)] grid-cols-3 items-center rounded-[26px] border border-dourado/16 bg-cacau-900/72 shadow-2xl backdrop-blur-lg"
      >
        <button
          type="button"
          onClick={() => {
            setSoFavoritos(false);
            setFiltro("todos");
          }}
          className={cx("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold", soFavoritos ? "text-creme-400" : "text-dourado")}
        >
          <IconeCasa />
          Início
        </button>
        <button
          type="button"
          onClick={() => setSoFavoritos(true)}
          className={cx("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold", soFavoritos ? "text-dourado" : "text-creme-400")}
        >
          <IconeCoracao />
          Favoritos
        </button>
        <button
          type="button"
          onClick={() => setZapAberto(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-bold text-[#4ADE80]"
        >
          <IconeConversa />
          Encomendar
        </button>
      </nav>

      <FolhaWhatsApp
        aberta={zapAberto}
        aoFechar={fecharZap}
        loja={loja}
        situacao={situacao}
        mensagem={mensagemGeral(LOJA.nome)}
        explicacao="A conversa abre com esta mensagem pronta. A Mone responde por lá e vocês combinam os detalhes."
      />
    </div>
  );
}
