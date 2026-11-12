"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import { LOJA, linkWhatsApp, type DadosLoja } from "@/lib/loja";
import { hojeNaLoja, situacaoDaLoja, textoFechadoNaSacola } from "@/lib/horarios";
import { useAgora, useArmazenamento, useNomeCliente, useSacola, useUltimoPedido } from "@/lib/hooks";
import { copiarTexto } from "@/lib/copiar";
import { campanhaDoDoce, campanhasNoAr, formatarPreco, mensagemGeral, mensagemOutroDia, rotuloData } from "@/lib/regras";
import {
  conferirSacola,
  diaDoMes,
  limiteDoDoce,
  limparNome,
  mensagemDoPedido,
  quandoFoiEnviado,
  sacolaDepoisDe,
  sortearNumero,
  textoItens,
  ultimoPedido,
  type LinhaConferida,
  type SacolaGuardada,
} from "@/lib/sacola";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { InfoDaLoja } from "../InfoDaLoja";
import { IconeAlerta, IconeConversa, IconeSacola, IconeVoltar } from "../Icones";
import { barraFixa, botaoPrimario, botaoRedondo, botaoWhatsApp, campo, cx } from "../ui";
import { BalaoDoPedido, EsqueletoSacola } from "./comum";
import { CartaoSacola, nomeDaLinha } from "./CartaoSacola";

// Depois de 3 minutos em outra aba ou no WhatsApp, busca o cardápio de novo ao voltar.
const MINUTOS_PARA_CONFERIR = 3;
// Tempo do "Desfazer" depois de tirar um doce (não some enquanto tem foco).
const SEGUNDOS_DESFAZER = 6;

type Folha = { tipo: "falar" } | { tipo: "outro-dia"; doce: Doce };

function Faixa({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 px-4 py-3 text-[13px] leading-snug font-semibold text-pessego">
      <IconeAlerta tamanho={18} className="mt-px shrink-0" />
      {children}
    </p>
  );
}

export function Sacola({
  doces,
  campanhas,
  loja,
  agora: agoraDoServidor,
}: {
  // Doces ativos (o cardápio do dia).
  doces: Doce[];
  campanhas: Campanha[];
  loja: DadosLoja;
  agora: number;
}) {
  const router = useRouter();
  const agora = useAgora(agoraDoServidor);
  const hoje = hojeNaLoja(agora);
  const situacao = situacaoDaLoja(loja.horarios, agora);
  const { sacola, vencidaEm, gravar } = useSacola();
  const { nome: nomeGuardado, gravar: gravarNome } = useNomeCliente();
  const { pedido: ultimo, gravar: gravarUltimo } = useUltimoPedido();
  const guarda = useArmazenamento();
  const [nomeDigitado, setNomeDigitado] = useState<string | null>(null);
  const nome = nomeDigitado ?? nomeGuardado ?? "";
  const [anuncio, setAnuncio] = useState("");
  const [desfazer, setDesfazer] = useState<{ texto: string; antes: SacolaGuardada; desde: number } | null>(null);
  const [nadaParaEnviar, setNadaParaEnviar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [folha, setFolha] = useState<Folha | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fecharFolha = useCallback(() => setFolha(null), []);
  const avisoRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  // Linha que recebe o foco depois de tirar um doce ("" = o título).
  const focoDepois = useRef<string | null>(null);
  useLayoutEffect(() => {
    const chave = focoDepois.current;
    if (chave === null) return;
    focoDepois.current = null;
    const alvo = chave ? document.querySelector<HTMLElement>(`[data-linha="${CSS.escape(chave)}"] button`) : null;
    (alvo ?? tituloRef.current)?.focus();
  });

  // O Next guarda a página escondida (Activity) ao navegar: ao sair, desfaz o que é de
  // momento, senão a volta para a sacola mostraria o esqueleto do envio ou um aviso velho.
  useLayoutEffect(
    () => () => {
      setEnviando(false);
      setDesfazer(null);
      setNadaParaEnviar(false);
      setCopiado(false);
      setFolha(null);
    },
    [],
  );

  // Sacola parada há mais de 7 dias: esvazia e avisa ("Sua sacola de 03/11 foi esvaziada").
  const [vencida, setVencida] = useState<number | null>(null);
  if (vencidaEm && vencidaEm !== vencida) setVencida(vencidaEm);
  useEffect(() => {
    if (vencidaEm) gravar(null);
  }, [vencidaEm, gravar]);

  // Sacola de antes do número do pedido (ou com o número estragado): ganha um agora.
  useEffect(() => {
    if (sacola && sacola.linhas.length > 0 && !sacola.numero) gravar({ ...sacola, numero: sortearNumero() });
  }, [sacola, gravar]);

  useEffect(() => {
    let escondidaEm = 0;
    const aoMudar = () => {
      if (document.hidden) escondidaEm = Date.now();
      else if (escondidaEm && Date.now() - escondidaEm >= MINUTOS_PARA_CONFERIR * 60_000) router.refresh();
    };
    document.addEventListener("visibilitychange", aoMudar);
    return () => document.removeEventListener("visibilitychange", aoMudar);
  }, [router]);

  // O aviso com "Desfazer" some depois de 6 s, mas não enquanto está com o foco.
  useEffect(() => {
    if (!desfazer) return;
    const timer = setInterval(() => {
      const comFoco = avisoRef.current?.contains(document.activeElement);
      if (!comFoco && Date.now() - desfazer.desde >= SEGUNDOS_DESFAZER * 1000) setDesfazer(null);
    }, 500);
    return () => clearInterval(timer);
  }, [desfazer]);

  const conferida = useMemo(
    () => (sacola ? conferirSacola(sacola, doces, campanhas, hoje, loja.horarios) : null),
    [sacola, doces, campanhas, hoje, loja.horarios],
  );
  const noAr = campanhasNoAr(campanhas, hoje);

  if (!sacola || !conferida || enviando || ultimo === undefined) return <EsqueletoSacola />;

  const numero = sacola.numero ?? 0;
  const mensagem = mensagemDoPedido(conferida, numero, nome);
  const podeEnviar = conferida.vao.length > 0;
  const fechado = situacao ? textoFechadoNaSacola(situacao) : null;

  // Grava a sacola depois de mexer numa linha e anuncia o novo total.
  function mudar(linha: LinhaConferida, quantidade: number | null) {
    const nova = sacolaDepoisDe(sacola!, conferida!, Date.now(), linha.chave, quantidade);
    gravar(nova);
    setNadaParaEnviar(false);
    const total = conferirSacola(nova, doces, campanhas, hoje, loja.horarios).totalCentavos;
    setAnuncio(quantidade ? `${nomeDaLinha(linha)}: ${quantidade}. Total ${formatarPreco(total)}.` : `${nomeDaLinha(linha)} saiu da sacola. Total ${formatarPreco(total)}.`);
    return nova;
  }

  function tirar(linha: LinhaConferida) {
    const antes = sacola!;
    const indice = conferida!.linhas.findIndex((l) => l.chave === linha.chave);
    const proxima = conferida!.linhas[indice + 1] ?? conferida!.linhas[indice - 1];
    // O foco vai para a próxima linha (ou para o título, se a sacola ficou vazia).
    focoDepois.current = proxima?.chave ?? "";
    mudar(linha, null);
    setDesfazer({ texto: `${nomeDaLinha(linha)} saiu da sacola`, antes, desde: Date.now() });
  }

  function enviar(e: MouseEvent<HTMLAnchorElement>) {
    if (!podeEnviar) {
      e.preventDefault();
      setNadaParaEnviar(true);
      setAnuncio("Nenhum doce da sacola pode ir no pedido agora. Tire os indisponíveis ou escolha outros.");
      return;
    }
    // O link já abre o WhatsApp com o recibo; aqui só guarda o pedido e esvazia a sacola.
    gravarUltimo(ultimoPedido(conferida!, numero, nome, Date.now()));
    // Nome preenchido fica lembrado; campo vazio apaga.
    gravarNome(limparNome(nome));
    setEnviando(true);
    gravar(null);
    router.replace("/sacola/enviado");
  }

  const folhaWhatsApp = (
    <FolhaWhatsApp
      aberta={folha !== null}
      aoFechar={fecharFolha}
      loja={loja}
      situacao={situacao}
      {...(folha?.tipo === "outro-dia"
        ? {
            titulo: "Pedir para outro dia",
            mensagem: mensagemOutroDia(LOJA.nome, folha.doce),
            explicacao: "Escreva no fim da mensagem o dia que você quer. A Mone responde se consegue fazer.",
          }
        : {
            titulo: "Falar com a Mone",
            mensagem: mensagemGeral(LOJA.nome),
            explicacao: "Para dúvidas ou pedidos diferentes. Para os doces da vitrine, use a sacola: o pedido já vai todo escrito.",
          })}
    />
  );

  const avisoDesfazer = desfazer && (
    <div
      ref={avisoRef}
      className="fixed inset-x-4 bottom-[calc(140px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[calc(28rem-2rem)] animate-entra items-center gap-3 rounded-[18px] bg-creme py-2 pr-2 pl-4 text-sm font-bold text-cacau-950 shadow-2xl"
    >
      <span className="grow leading-snug">{desfazer.texto}</span>
      <button
        type="button"
        onClick={() => {
          gravar(desfazer.antes);
          setDesfazer(null);
          setAnuncio("Doce de volta na sacola.");
        }}
        className="flex h-11 shrink-0 items-center rounded-full bg-cacau-950 px-4 text-sm font-bold text-creme"
      >
        Desfazer
      </button>
    </div>
  );

  const cabecalho = (
    <header className="flex items-center gap-3 px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-2">
      <Link href="/" aria-label="Voltar para a vitrine" className={botaoRedondo}>
        <IconeVoltar />
      </Link>
      <h1 ref={tituloRef} tabIndex={-1} className="grow font-display text-2xl font-semibold outline-none">
        Sua sacola
      </h1>
      {conferida.itens > 0 && <span className="shrink-0 text-sm font-semibold text-creme-200">{textoItens(conferida.itens)}</span>}
    </header>
  );

  // --- Sacola vazia ---
  if (sacola.linhas.length === 0) {
    return (
      <div className="mx-auto min-h-dvh max-w-md pb-10">
        <p aria-live="polite" className="sr-only">
          {anuncio}
        </p>
        {cabecalho}
        <div className="flex flex-col gap-5 px-5 pt-3">
          {vencida && <Faixa>{`Sua sacola de ${diaDoMes(vencida)} foi esvaziada.`}</Faixa>}
          {ultimo && (
            <div className="flex items-center gap-3 rounded-[20px] border border-dourado/16 bg-cacau-900 p-4">
              <div className="flex min-w-0 grow flex-col gap-1">
                <span className="text-[15px] font-bold">Último pedido nº {ultimo.numero}</span>
                <span className="text-[13px] leading-snug text-creme-200">
                  Enviado {quandoFoiEnviado(ultimo.enviadoEm, agora)} · {textoItens(ultimo.itens)} · {formatarPreco(ultimo.totalCentavos)}
                </span>
              </div>
              <Link
                href="/sacola/enviado"
                className="flex h-11 shrink-0 items-center rounded-full border border-dourado/30 px-4 text-sm font-bold text-dourado"
              >
                Ver pedido
              </Link>
            </div>
          )}
          <div className="flex flex-col items-center gap-3 pt-8 text-center">
            <IconeSacola tamanho={48} strokeWidth={1.5} className="text-dourado" />
            <h2 className="font-display text-2xl font-semibold">Sua sacola está vazia</h2>
            <p className="text-[15px] leading-relaxed text-creme-200">Escolha os doces na vitrine e toque em Adicionar.</p>
            <Link href="/" className={cx(botaoPrimario, "mt-2")}>
              Ver a vitrine
            </Link>
            <button
              type="button"
              onClick={() => setFolha({ tipo: "falar" })}
              className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-creme-200"
            >
              Prefere conversar? <span className="font-bold text-whatsapp">Falar com a Mone no WhatsApp</span>
            </button>
          </div>
          {!guarda && <Faixa>Este navegador não guarda a sacola. Envie antes de fechar a página.</Faixa>}
        </div>
        {avisoDesfazer}
        {folhaWhatsApp}
      </div>
    );
  }

  // --- Sacola com doces ---
  // Um cartão por doce, na ordem do cardápio; doces que saíram do cardápio vão no fim.
  const cartoes: LinhaConferida[][] = [];
  for (const l of conferida.linhas) {
    const ultimoCartao = cartoes.at(-1);
    if (ultimoCartao && ultimoCartao[0].doceId === l.doceId) ultimoCartao.push(l);
    else cartoes.push([l]);
  }
  const blocos = conferida.mista
    ? [
        { titulo: "Pronta entrega", cartoes: cartoes.filter((c) => c[0].doce && !c[0].doce.sobEncomenda) },
        {
          titulo: `Sob encomenda · pronto a partir de ${rotuloData(conferida.prontoEm!)}`,
          cartoes: cartoes.filter((c) => c[0].doce?.sobEncomenda),
        },
        { titulo: null, cartoes: cartoes.filter((c) => !c[0].doce) },
      ]
    : [{ titulo: null, cartoes }];

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(170px+env(safe-area-inset-bottom))]">
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      {cabecalho}

      <div className="flex flex-col gap-4 px-5 pt-2">
        {!guarda && <Faixa>Este navegador não guarda a sacola. Envie antes de fechar a página.</Faixa>}
        {conferida.mudou && <Faixa>Alguns doces mudaram desde que você escolheu. Confira antes de enviar.</Faixa>}

        {blocos
          .filter((b) => b.cartoes.length > 0)
          .map((bloco, i) => (
            <section key={i} aria-label={bloco.titulo ?? undefined} className="flex flex-col gap-2.5">
              {bloco.titulo && <h2 className="pt-1 font-display text-lg font-semibold">{bloco.titulo}</h2>}
              <ul className="flex flex-col gap-2.5">
                {bloco.cartoes.map((linhas) => {
                  const doce = linhas[0].doce;
                  return (
                    <CartaoSacola
                      key={linhas[0].doceId}
                      linhas={linhas}
                      campanha={doce ? campanhaDoDoce(doce, noAr) : null}
                      limite={doce ? limiteDoDoce(doce, hoje) : 0}
                      aoMudar={(linha, q) => mudar(linha, q)}
                      aoTirar={tirar}
                      aoPerguntarOutroDia={(linha) => linha.doce && setFolha({ tipo: "outro-dia", doce: linha.doce })}
                    />
                  );
                })}
              </ul>
            </section>
          ))}

        <Link href="/" className="flex h-12 items-center justify-center rounded-full border border-dourado/30 text-[15px] font-bold text-dourado">
          Continuar escolhendo
        </Link>

        {conferida.prontoEm && (
          <p className="text-sm leading-relaxed text-creme-200">
            Os doces sob encomenda ficam prontos a partir de {rotuloData(conferida.prontoEm)}.
            {conferida.mista && " Os de pronta entrega podem sair antes ou junto: vocês combinam na conversa."}
          </p>
        )}
        {conferida.estoqueNaoConfirmado && <p className="text-sm leading-relaxed text-creme-200">A Mone confirma no WhatsApp se tem tudo pronto hoje.</p>}

        <div className="flex flex-col gap-1 rounded-[20px] border border-dourado/16 bg-cacau-800 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold">Total dos doces</span>
            <span className="font-display text-[26px] font-semibold text-dourado">{formatarPreco(conferida.totalCentavos)}</span>
          </div>
          <span className="text-[13px] text-creme-200">{textoItens(conferida.itens)} · A entrega, se tiver, é combinada no WhatsApp.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className="text-sm font-bold">
            Seu nome (opcional)
          </label>
          <input
            id="nome"
            value={nome}
            maxLength={40}
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="done"
            placeholder="Como a Mone pode chamar você"
            aria-describedby="ajuda-nome"
            onChange={(e) => setNomeDigitado(e.target.value)}
            className={cx(campo, "h-12")}
          />
          <span id="ajuda-nome" className="text-xs leading-snug text-creme-400">
            Seu nome e sua sacola ficam só neste celular. A Mone vê seu número no WhatsApp, como em qualquer conversa.
          </span>
        </div>

        <section aria-labelledby="como-funciona" className="flex flex-col gap-2.5 rounded-[20px] border border-dourado/12 bg-cacau-900 p-4">
          <h2 id="como-funciona" className="font-display text-lg font-semibold">
            Como funciona
          </h2>
          <ol className="flex flex-col gap-2 text-sm leading-relaxed text-creme-200">
            <li>1. Você envia o pedido pelo WhatsApp. Quer avisar algo, como presente ou alergia? Escreva lá antes de enviar.</li>
            <li>2. A Mone responde confirmando o pedido e o total. O pedido só vale depois dessa resposta.</li>
            <li>3. Na conversa, vocês combinam retirada ou entrega, dia, horário e pagamento. Para mudar ou cancelar, é só responder lá.</li>
          </ol>
          <InfoDaLoja loja={loja} />
        </section>

        <details className="group rounded-[20px] border border-dourado/12 bg-cacau-900">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-bold text-dourado">
            Ver a mensagem que vai no WhatsApp
          </summary>
          <div className="flex flex-col gap-3 px-4 pb-4">
            <BalaoDoPedido mensagem={mensagem} />
            <button
              type="button"
              onClick={async () => {
                if (await copiarTexto(mensagem)) {
                  setCopiado(true);
                  setAnuncio("Pedido copiado");
                }
              }}
              className="flex h-11 items-center justify-center rounded-full border border-dourado/30 text-sm font-bold text-dourado"
            >
              {copiado ? "Pedido copiado" : "Copiar o pedido"}
            </button>
          </div>
        </details>
      </div>

      <div className={cx(barraFixa, "flex-col gap-1.5")}>
        {fechado && <p className="text-center text-[13px] font-semibold text-pessego">{fechado}</p>}
        {nadaParaEnviar && !podeEnviar && (
          <p className="text-center text-[13px] leading-snug font-semibold text-pessego">
            Nenhum doce da sacola pode ir no pedido agora. Tire os indisponíveis ou escolha outros.
          </p>
        )}
        <a
          href={linkWhatsApp(loja.whatsapp, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!podeEnviar}
          onClick={enviar}
          className={cx(botaoWhatsApp, "h-14 text-base", !podeEnviar && "opacity-50")}
        >
          <IconeConversa strokeWidth={2} />
          Enviar pedido no WhatsApp
        </a>
        <p className="text-center text-xs text-creme-200">O WhatsApp abre com o pedido escrito. Confira e toque em enviar.</p>
      </div>

      {avisoDesfazer}
      {folhaWhatsApp}
    </div>
  );
}
