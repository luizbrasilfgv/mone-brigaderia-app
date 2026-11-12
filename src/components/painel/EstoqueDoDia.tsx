"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import type { Salvamento } from "@/lib/dados";
import type { PessoaNoPainel } from "@/lib/painel";
import { LOJA } from "@/lib/loja";
import { abreNoDia, type Horarios } from "@/lib/horarios";
import { useGuardado, useHoje } from "@/lib/hooks";
import { nomeDoPapel, pode } from "@/lib/papeis";
import {
  campanhasNoAr,
  contagemDeHoje,
  doceApareceNaVitrine,
  estoqueNoPainel,
  formatarDiaMes,
  formatarPreco,
  motivoForaDaVitrine,
  nomeCurtoDaCampanha,
  somarDias,
  vitrineDoDoce,
} from "@/lib/regras";
import { marcarTutorialVisto, salvarDestaque, salvarEstoque } from "@/app/painel/acoes";
import { sair } from "@/app/entrar/acoes";
import { ImagemDoce } from "../ImagemDoce";
import {
  IconeAjuda,
  IconeCalendario,
  IconeCasa,
  IconeConversa,
  IconeEstrela,
  IconeLoja,
  IconeMais,
  IconePessoas,
  IconeRelogio,
  IconeSeta,
} from "../Icones";
import { COR_ESTOQUE, barraFixa, botaoPrimario, cartao, cx } from "../ui";
import {
  AvisoNaoSalvo,
  Contador,
  FaixaAviso,
  FaixaDemo,
  apagarRascunhosDoEstoque,
  avisarNaProximaTela,
  tentar,
  useAlteracoesPendentes,
  useAviso,
  useConfirmacao,
} from "./comum";
import { MenuPainel } from "./Menu";
import { Tutorial } from "./Tutorial";
import { InstalarApp } from "../InstalarApp";

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

// Depois de quanto tempo fora do app a tela busca as quantidades de novo.
const ATUALIZAR_DEPOIS = 3 * 60_000;

type Quantidades = Record<string, number>;

// Rascunho guardado no celular: { dia, q: { doceId: quantidade } }. Só vale no mesmo dia.
function lerRascunho(bruto: string | null, hoje: string): Quantidades {
  if (!bruto) return {};
  try {
    const lido = JSON.parse(bruto) as { dia?: unknown; q?: unknown };
    if (lido.dia !== hoje || typeof lido.q !== "object" || !lido.q) return {};
    return Object.fromEntries(Object.entries(lido.q).filter(([, q]) => Number.isInteger(q) && q >= 0));
  } catch {
    return {};
  }
}

function semEstes(q: Quantidades, tirar: (id: string, valor: number) => boolean): Quantidades {
  return Object.fromEntries(Object.entries(q).filter(([id, valor]) => !tirar(id, valor)));
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

const atalho =
  "flex min-h-[60px] min-w-0 items-center gap-2.5 rounded-2xl border border-dourado/12 bg-cacau-900 px-3 py-2 transition-transform active:scale-[0.98]";

export function EstoqueDoDia({
  doces,
  campanhas,
  horarios,
  salvamento,
  hoje: hojeDoServidor,
  pessoa,
  demo,
  semPermissao,
  abrirComoUsar,
}: {
  doces: Doce[];
  campanhas: Campanha[];
  horarios: Horarios;
  // Última vez que alguém salvou as quantidades (null no modo demonstração).
  salvamento: Salvamento | null;
  hoje: string;
  pessoa: PessoaNoPainel;
  demo: boolean;
  // Explicação de quem tentou abrir uma parte do painel que o papel não permite.
  semPermissao: string | null;
  // Menu › Como usar, tocado em outra tela (/painel?como-usar=1): abre o guia.
  abrirComoUsar: boolean;
}) {
  const hoje = useHoje(hojeDoServidor);
  const router = useRouter();
  const [avisoTopo, mostrar, mostrarResultado] = useAviso();
  const [confirmacao, perguntar] = useConfirmacao();
  const [saindo, iniciarSaida] = useTransition();
  const [avisoFechado, setAvisoFechado] = useState(false);
  const aviso = avisoFechado ? null : semPermissao;
  const [salvando, iniciar] = useTransition();

  // O guia abre sozinho no primeiro acesso e depois pelo botão "Como usar" (ou Menu › Como usar).
  const vistoNoNavegador = useSyncExternalStore(semAssinatura, lerTutorialVisto, () => true);
  const [tutorial, setTutorial] = useState<"auto" | "aberto" | "fechado">("auto");
  const [comoUsarPedido, setComoUsarPedido] = useState(false);
  if (abrirComoUsar !== comoUsarPedido) {
    setComoUsarPedido(abrirComoUsar);
    if (abrirComoUsar) setTutorial("aberto");
  }
  // Tira o ?como-usar do endereço, para o guia não abrir de novo ao recarregar.
  useEffect(() => {
    if (!abrirComoUsar) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("como-usar")) return;
    url.searchParams.delete("como-usar");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [abrirComoUsar]);
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
  const abrirTutorial = useCallback(() => setTutorial("aberto"), []);

  // Quantidades que a pessoa mexeu e ainda não salvou: ficam no celular (por pessoa), para
  // não sumirem ao recarregar, ao entrar de novo ou ao fechar o app.
  const { valor: rascunhoBruto, atualizar: atualizarRascunho } = useGuardado(`mone:estoque:${pessoa.id}`);
  const alteradas = useMemo(() => lerRascunho(rascunhoBruto, hoje), [rascunhoBruto, hoje]);
  function mudarRascunho(mudar: (q: Quantidades) => Quantidades) {
    atualizarRascunho((atual) => {
      const q = mudar(lerRascunho(atual, hoje));
      return Object.keys(q).length > 0 ? JSON.stringify({ dia: hoje, q }) : null;
    });
  }

  // O que acabou de ser salvo (quantidades e destaque), até a tela receber os dados novos.
  const [salvasAgora, setSalvasAgora] = useState<Quantidades>({});
  const [destaqueEscolhido, setDestaqueEscolhido] = useState<string | null>(null);
  const [docesVistos, setDocesVistos] = useState(doces);
  if (docesVistos !== doces) {
    setDocesVistos(doces);
    setSalvasAgora({});
    setDestaqueEscolhido(null);
  }
  const destaqueId = destaqueEscolhido ?? doces.find((d) => d.destaque)?.id;

  // Quantidade salva (a que a vitrine conhece) e se ela é de hoje.
  const salva = (d: Doce) => salvasAgora[d.id] ?? d.quantidadeHoje;
  const salvaHoje = (d: Doce) => d.id in salvasAgora || contagemDeHoje(d, hoje);
  const naTela = (d: Doce) => alteradas[d.id] ?? salva(d);
  const mudou = (d: Doce) => !d.sobEncomenda && d.id in alteradas && (alteradas[d.id] !== salva(d) || !salvaHoje(d));

  const editaDoces = pode(pessoa, "equipe");
  const noAr = campanhasNoAr(campanhas, hoje);
  const idsNoAr = new Set(noAr.map((c) => c.id));
  const naVitrine = doces.filter((d) => doceApareceNaVitrine(d, idsNoAr));
  // Escondidos e de campanha fora do ar: só para Equipe e Administração, numa seção recolhida.
  const foraDaVitrine = editaDoces ? doces.filter((d) => !doceApareceNaVitrine(d, idsNoAr)) : [];
  // Quem cuida só do estoque vê só os doces da vitrine que têm quantidade.
  const lista = editaDoces ? naVitrine : naVitrine.filter((d) => !d.sobEncomenda);
  const prontaEntrega = naVitrine.filter((d) => !d.sobEncomenda);
  const mudaram = prontaEntrega.filter(mudou);
  const sujo = mudaram.length > 0;
  const esgotados = prontaEntrega.filter((d) => naTela(d) <= 0).length;
  const disponiveis = naVitrine.length - esgotados;
  const destaque = doces.find((d) => d.id === destaqueId);
  const campanha = noAr[0];

  // Lembrete: a vitrine está mostrando a quantidade de outro dia (só em dia de atendimento).
  const deOutroDia = prontaEntrega.filter((d) => !salvaHoje(d));
  const ultimaData = deOutroDia
    .map((d) => d.dataQuantidade)
    .filter((data): data is string => data !== null)
    .sort()
    .at(-1);
  const lembrete = !demo && ultimaData && abreNoDia(horarios, hoje) ? ultimaData : null;
  // Doces que ninguém salvou hoje e que a pessoa não mexeu: "Salvar o dia" confirma como estão.
  const paraConfirmar = lembrete ? deOutroDia.filter((d) => !(d.id in alteradas)) : [];

  // Quando chegam dados novos do servidor: tira do rascunho o que já está igual ao salvo hoje.
  const atualizadoEm = useRef(0);
  useEffect(() => {
    atualizadoEm.current = Date.now();
    atualizarRascunho((atual) => {
      const q = lerRascunho(atual, hoje);
      const resto = semEstes(q, (id, valor) => {
        const d = doces.find((x) => x.id === id);
        return !d || (d.quantidadeHoje === valor && contagemDeHoje(d, hoje));
      });
      if (Object.keys(resto).length === Object.keys(q).length) return atual;
      return Object.keys(resto).length > 0 ? JSON.stringify({ dia: hoje, q: resto }) : null;
    });
  }, [doces, hoje, atualizarRascunho]);

  // Voltou ao app depois de alguns minutos (ou à tela, guardada pelo Next): busca as
  // quantidades de novo. O que a pessoa mexeu continua; o resto vem do servidor.
  useEffect(() => {
    const conferir = () => {
      if (document.visibilityState !== "visible" || Date.now() - atualizadoEm.current < ATUALIZAR_DEPOIS) return;
      atualizadoEm.current = Date.now();
      router.refresh();
    };
    conferir();
    document.addEventListener("visibilitychange", conferir);
    return () => document.removeEventListener("visibilitychange", conferir);
  }, [router]);

  // Virada do dia com a tela aberta.
  const diaDaTela = useRef(hojeDoServidor);
  useEffect(() => {
    if (diaDaTela.current === hoje) return;
    diaDaTela.current = hoje;
    router.refresh();
  }, [hoje, router]);

  // Depois de salvar: mostra o valor salvo e tira do rascunho o que não mudou de novo.
  function aplicarSalvas(valores: Quantidades) {
    setSalvasAgora((s) => ({ ...s, ...valores }));
    mudarRascunho((q) => semEstes(q, (id, valor) => valores[id] === valor));
  }

  // Salva só os doces que mudaram (e confirma os que ninguém salvou hoje). saindoDaTela: o
  // aviso de salvo aparece na próxima tela ("Salvar e sair").
  function salvarDia(saindoDaTela = false): Promise<boolean> {
    const enviadas = Object.fromEntries(mudaram.map((d) => [d.id, naTela(d)]));
    const confirmadas = Object.fromEntries(paraConfirmar.map((d) => [d.id, salva(d)]));
    return new Promise((pronto) =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarEstoque(enviadas, confirmadas));
        if (resultado.ok) aplicarSalvas({ ...confirmadas, ...enviadas });
        if (resultado.ok && saindoDaTela) avisarNaProximaTela(resultado.mensagem);
        else mostrarResultado(resultado, () => void salvarDia());
        pronto(resultado.ok);
      }),
    );
  }

  // "Está igual a ontem": salva para hoje as mesmas quantidades do último dia salvo.
  function igualAoUltimoDia() {
    const confirmadas = Object.fromEntries(deOutroDia.map((d) => [d.id, salva(d)]));
    iniciar(async () => {
      const resultado = await tentar(() => salvarEstoque({}, confirmadas));
      if (resultado.ok) {
        setSalvasAgora((s) => ({ ...s, ...confirmadas }));
        mudarRascunho((q) => semEstes(q, (id) => id in confirmadas));
      }
      mostrarResultado(resultado, igualAoUltimoDia);
    });
  }

  // "Esgotou": zera e salva na hora, só este doce.
  function esgotou(d: Doce) {
    const antes = naTela(d);
    const executar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarEstoque({ [d.id]: 0 }));
        if (!resultado.ok) return mostrarResultado(resultado, executar);
        setSalvasAgora((s) => ({ ...s, [d.id]: 0 }));
        mudarRascunho((q) => semEstes(q, (id) => id === d.id));
        mostrar(`${d.nome}: esgotado. A vitrine já mostra.`, true, { rotulo: "Desfazer", aoTocar: () => voltarQuantidade(d, antes) });
      });
    executar();
  }

  function voltarQuantidade(d: Doce, quantidade: number) {
    const executar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarEstoque({ [d.id]: quantidade }));
        if (!resultado.ok) return mostrarResultado(resultado, executar);
        setSalvasAgora((s) => ({ ...s, [d.id]: quantidade }));
        mostrar(`${d.nome}: de volta para ${quantidade}.`);
      });
    executar();
  }

  // A estrela salva na hora.
  async function escolherDestaque(d: Doce) {
    if (d.id === destaqueId) return;
    const anterior = destaqueId ?? null;
    setDestaqueEscolhido(d.id);
    const resultado = await tentar(() => salvarDestaque(d.id));
    if (!resultado.ok) {
      setDestaqueEscolhido(anterior);
      return mostrarResultado(resultado, () => void escolherDestaque(d));
    }
    mostrar(`Destaque da vitrine: ${d.nome}.${naVitrine.length < 3 ? " Ele aparece na vitrine quando houver 3 doces ou mais." : ""}`);
  }

  const saida = useAlteracoesPendentes(sujo, {
    salvar: () => salvarDia(true),
    descartar: () => mudarRascunho(() => ({})),
  });

  const salvoHoje = salvamento?.data === hoje ? salvamento : null;
  const podeSalvar = sujo || paraConfirmar.length > 0;
  const n = mudaram.length;
  const rotuloSalvar = salvando
    ? "Salvando…"
    : sujo
      ? `Salvar o dia (${n} ${n === 1 ? "doce mudou" : "doces mudaram"})`
      : podeSalvar
        ? "Salvar o dia"
        : salvoHoje
          ? `Tudo salvo · hoje ${salvoHoje.hora}`
          : "Tudo salvo";

  return (
    <div className="pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      {avisoTopo}
      {confirmacao}
      {saida}
      <FaixaDemo demo={demo} />
      <Tutorial papel={pessoa.papel} aberto={tutorialAberto} aoFechar={fecharTutorial} />

      <header className="flex flex-col gap-3 px-5 pt-[18px] pb-1.5">
        <div className="flex items-center gap-3">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={44} height={44} className="rounded-full" />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">{LOJA.nome}</span>
            <h1 className="font-display text-[22px] font-semibold">Painel da loja</h1>
          </div>
          <MenuPainel aoComoUsar={abrirTutorial} />
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-dourado/10 bg-cacau-900 py-1 pr-1 pl-1">
          <Link
            href="/painel/conta"
            aria-label={`Minha conta e sair: ${pessoa.nome}, ${nomeDoPapel(pessoa.papel)}`}
            className="flex min-h-11 min-w-0 grow items-center gap-2.5 rounded-xl py-0.5 pr-1 pl-1.5 active:scale-[0.98]"
          >
            <Iniciais nome={pessoa.nome} />
            <div className="flex min-w-0 grow flex-col">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-[13px] font-semibold">{pessoa.nome}</span>
                <span className="shrink-0 text-[11px] text-creme-400">{nomeDoPapel(pessoa.papel)}</span>
              </span>
              <span className="truncate text-[11px] font-semibold text-dourado">Minha conta e sair</span>
            </div>
            <IconeSeta tamanho={16} className="shrink-0 text-creme-400" />
          </Link>
          <button
            type="button"
            onClick={abrirTutorial}
            className="flex h-11 shrink-0 items-center gap-1 rounded-xl border-l border-dourado/10 px-3 text-[13px] font-semibold text-dourado"
          >
            <IconeAjuda tamanho={18} />
            Como usar
          </button>
        </div>
        {aviso && (
          <FaixaAviso
            aoFechar={() => {
              setAvisoFechado(true);
              // Tira o aviso do endereço, para não voltar ao recarregar a página.
              window.history.replaceState(null, "", "/painel");
            }}
          >
            {aviso}
          </FaixaAviso>
        )}
      </header>

      <div className="flex flex-col gap-4 px-5 pt-3.5">
        {lembrete && (
          <div role="status" className="flex flex-col gap-3 rounded-2xl border border-pessego/40 bg-pessego/12 p-4 text-pessego">
            <p className="text-sm leading-relaxed">
              <strong>Você ainda não salvou hoje.</strong> A vitrine está mostrando o que tinha em {formatarDiaMes(lembrete)}.
            </p>
            <button
              type="button"
              disabled={salvando}
              onClick={igualAoUltimoDia}
              className="flex h-12 items-center justify-center rounded-full bg-pessego px-5 text-sm font-bold text-cacau-950 disabled:opacity-60"
            >
              {lembrete === somarDias(hoje, -1) ? "Está igual a ontem" : `Está igual ao dia ${formatarDiaMes(lembrete)}`}
            </button>
          </div>
        )}

        <section aria-labelledby="titulo-hoje" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="titulo-hoje" className="font-display text-[22px] font-semibold">
              O que tem hoje
            </h2>
            <p className="text-[13px] leading-snug text-creme-400">
              Toque no número para digitar ou use − e +. Chegou a zero, o doce aparece como esgotado.
              {editaDoces && " Toque no doce para editar a ficha."}
            </p>
            <p className="text-[13px] leading-snug text-creme-200">
              Confirmou um pedido no WhatsApp? Diminua aqui ou toque em Esgotou. A sacola de quem compra respeita este número.
            </p>
          </div>

          <div className={cx(cartao, "grid grid-cols-2 divide-x divide-dourado/10 py-3")}>
            <div className="flex min-w-0 flex-col gap-0.5 px-4">
              <span className="text-xs text-creme-400">Na vitrine</span>
              <span className="text-[17px] font-bold text-menta">
                {disponiveis} {disponiveis === 1 ? "doce" : "doces"}
              </span>
              <span className="text-xs text-creme-400">
                {esgotados === 0 ? "nenhum esgotado" : `${esgotados} ${esgotados === 1 ? "esgotado" : "esgotados"}`}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 px-4">
              <span className="text-xs text-creme-400">Última atualização</span>
              <span className="text-[17px] font-bold">
                {salvamento ? `${salvamento.data === hoje ? "hoje" : formatarDiaMes(salvamento.data)} ${salvamento.hora}` : "—"}
              </span>
              {salvamento?.por && <span className="truncate text-xs text-creme-400">por {salvamento.por}</span>}
            </div>
          </div>

          {editaDoces && naVitrine.length > 0 && (
            <p className="flex items-start gap-2 text-[13px] leading-snug text-creme-200">
              <IconeEstrela tamanho={16} className="mt-px shrink-0 fill-dourado text-dourado" />
              <span>
                {destaque ? (
                  <>
                    Destaque da vitrine: <strong className="text-creme">{destaque.nome}</strong>. A estrela troca na hora.
                  </>
                ) : (
                  "Toque na estrela de um doce para escolher o destaque da vitrine."
                )}
                {naVitrine.length < 3 && " O destaque aparece na vitrine quando houver 3 doces ou mais."}
              </span>
            </p>
          )}

          {lista.length === 0 && (
            <p className={cx(cartao, "p-4 text-sm text-creme-200")}>
              {editaDoces ? "Nenhum doce na vitrine agora." : "Nenhum doce de pronta entrega na vitrine agora."}
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {lista.map((doce) => {
              const quantidade = naTela(doce);
              const alterado = mudou(doce);
              const ehDestaque = doce.id === destaqueId;
              const situacao = doce.sobEncomenda
                ? { tom: "encomenda" as const, texto: "Sob encomenda" }
                : !(doce.id in alteradas) && !salvaHoje(doce)
                  ? { tom: "confirmar" as const, texto: `${quantidade} · contagem de ${doce.dataQuantidade ? formatarDiaMes(doce.dataQuantidade) : "outro dia"}` }
                  : estoqueNoPainel(quantidade);
              const identificacao = (
                <>
                  <div className="fundo-vitrine size-14 shrink-0 overflow-hidden rounded-xl">
                    <ImagemDoce doce={doce} tamanhos="56px" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] leading-tight font-semibold">
                      {doce.nome}
                      {alterado && <span className="sr-only"> (mudou, falta salvar)</span>}
                    </span>
                    <span className={cx("text-sm", COR_ESTOQUE[situacao.tom])}>
                      {formatarPreco(doce.precoCentavos)} · {situacao.texto}
                    </span>
                  </div>
                </>
              );
              return (
                <li
                  key={doce.id}
                  className={cx(
                    "flex flex-col gap-2 rounded-[18px] border bg-cacau-900 p-2.5 transition-colors",
                    alterado ? "border-dourado" : "border-dourado/10",
                  )}
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
                        aria-label={`Destaque da vitrine: ${doce.nome}`}
                        onClick={() => void escolherDestaque(doce)}
                        className="flex size-12 shrink-0 items-center justify-center active:scale-90"
                      >
                        <IconeEstrela tamanho={22} className={ehDestaque ? "fill-dourado text-dourado" : "text-creme-400"} />
                      </button>
                    )}
                  </div>
                  {doce.sobEncomenda ? (
                    <div className="flex min-h-11 items-center justify-between gap-2 pl-[66px]">
                      <span className="text-xs text-creme-400">Feito só quando pedem</span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pessego/35 bg-pessego/12 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-pessego">
                        <IconeRelogio tamanho={14} strokeWidth={2} />
                        Pronto em {doce.prazoDias} {doce.prazoDias === 1 ? "dia" : "dias"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      {quantidade > 0 ? (
                        <button
                          type="button"
                          disabled={salvando}
                          aria-label={`Esgotou: ${doce.nome}`}
                          onClick={() => esgotou(doce)}
                          className="h-12 shrink-0 rounded-full border border-rosa/45 px-4 text-sm font-bold text-rosa active:scale-95 disabled:opacity-50"
                        >
                          Esgotou
                        </button>
                      ) : (
                        <span className="pl-1 text-sm font-semibold text-creme-400">Esgotado</span>
                      )}
                      <Contador
                        valor={quantidade}
                        maximo={9999}
                        rotulo={`Quantidade de hoje: ${doce.nome}`}
                        aoMudar={(v) =>
                          mudarRascunho((q) => {
                            // Voltou ao que já está salvo hoje: não é mudança.
                            if (v === salva(doce) && salvaHoje(doce)) return semEstes(q, (id) => id === doce.id);
                            return { ...q, [doce.id]: v };
                          })
                        }
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {foraDaVitrine.length > 0 && (
            <details className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-[18px] border border-dourado/10 px-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                Fora da vitrine ({foraDaVitrine.length})
                <IconeSeta tamanho={18} className="rotate-90 text-creme-400 transition-transform group-open:-rotate-90" />
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {foraDaVitrine.map((doce) => {
                  const vitrine = vitrineDoDoce(doce, campanhas, hoje);
                  return (
                    <li key={doce.id}>
                      <Link
                        href={`/painel/doces/${doce.id}`}
                        className="flex items-center gap-2.5 rounded-[18px] border border-dourado/10 bg-cacau-900 p-2.5 active:scale-[0.99]"
                      >
                        <div className="fundo-vitrine size-14 shrink-0 overflow-hidden rounded-xl grayscale-[60%]">
                          <ImagemDoce doce={doce} tamanhos="56px" />
                        </div>
                        <div className="flex min-w-0 grow flex-col items-start gap-1">
                          <span className="text-[15px] leading-tight font-semibold">{doce.nome}</span>
                          <span className="rounded-full border border-creme/20 px-2 py-0.5 text-xs font-bold text-creme-200">Fora da vitrine</span>
                          {!vitrine.aparece && <span className="text-sm text-creme-400">{motivoForaDaVitrine(vitrine.motivo, vitrine.campanha)}</span>}
                        </div>
                        <IconeSeta tamanho={18} className="shrink-0 text-creme-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </section>

        {editaDoces && (
          <Link
            href="/painel/doces/novo"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-dourado/40 text-[15px] font-bold text-dourado active:scale-[0.98]"
          >
            <IconeMais tamanho={20} />
            Cadastrar novo doce
          </Link>
        )}

        <nav aria-label="Atalhos" className="grid grid-cols-2 gap-2">
          {editaDoces && (
            <Link href="/painel/campanhas" className={atalho}>
              <IconeCalendario tamanho={22} className="shrink-0 text-dourado" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm leading-tight font-bold">Campanhas</span>
                <span className="flex min-w-0 items-center gap-1 text-xs text-creme-400">
                  {campanha && <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: campanha.cor }} />}
                  <span className="truncate">{campanha ? `${nomeCurtoDaCampanha(campanha)} no ar` : "Nenhuma no ar"}</span>
                </span>
              </span>
            </Link>
          )}
          {pode(pessoa, "admin") && (
            <Link href="/painel/acessos" className={atalho}>
              <IconePessoas tamanho={22} className="shrink-0 text-dourado" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm leading-tight font-bold">Acessos</span>
                <span className="truncate text-xs text-creme-400">Quem usa o painel</span>
              </span>
            </Link>
          )}
          {pode(pessoa, "admin") && (
            <Link href="/painel/loja" className={atalho}>
              <IconeLoja tamanho={22} className="shrink-0 text-dourado" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm leading-tight font-bold">Dados da loja</span>
                <span className="truncate text-xs text-creme-400">WhatsApp e horário</span>
              </span>
            </Link>
          )}
          <Link href="/guia" className={atalho}>
            <IconeConversa tamanho={22} className="shrink-0 text-dourado" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm leading-tight font-bold">Guia da loja</span>
              <span className="truncate text-xs text-creme-400">Respostas prontas</span>
            </span>
          </Link>
          <Link href="/" className={atalho}>
            <IconeCasa tamanho={22} className="shrink-0 text-dourado" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm leading-tight font-bold">Ver vitrine</span>
              <span className="truncate text-xs text-creme-400">O que quem compra vê</span>
            </span>
          </Link>
          <InstalarApp variante="atalho" classe={atalho} nome="o painel" entrarDeNovo />
        </nav>

        {!demo && (
          <button
            type="button"
            disabled={saindo}
            onClick={async () => {
              const sim = await perguntar({
                titulo: "Sair do painel neste celular?",
                texto: sujo
                  ? "As quantidades que você mudou e não salvou serão perdidas. Para entrar de novo, você vai precisar do seu e-mail e da sua senha."
                  : "Para entrar de novo, você vai precisar do seu e-mail e da sua senha.",
                confirmar: "Sair",
              });
              if (!sim) return;
              apagarRascunhosDoEstoque();
              iniciarSaida(() => sair());
            }}
            className="mt-4 flex h-12 items-center justify-center rounded-full border border-dourado/30 text-[15px] font-bold text-dourado disabled:opacity-50"
          >
            {saindo ? "Saindo…" : "Sair do painel"}
          </button>
        )}
      </div>

      <div className={cx(barraFixa, "flex-col gap-1.5")}>
        <AvisoNaoSalvo sujo={sujo} />
        <button
          type="button"
          aria-disabled={!podeSalvar || salvando}
          onClick={() => podeSalvar && !salvando && void salvarDia()}
          className={cx(
            podeSalvar ? botaoPrimario : "flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-creme/[0.08] text-base font-bold text-creme-400",
            salvando && "opacity-60",
          )}
        >
          {rotuloSalvar}
        </button>
      </div>
    </div>
  );
}
