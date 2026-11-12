"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import { LOJA, type DadosLoja } from "@/lib/loja";
import { hojeNaLoja, situacaoDaLoja } from "@/lib/horarios";
import { useAgora, useFavoritos, useSacola } from "@/lib/hooks";
import { copiarTexto } from "@/lib/copiar";
import {
  encomendaAberta,
  estoqueDoDoce,
  formatarDiaMes,
  formatarPreco,
  mensagemDuvida,
  mensagemEncerrada,
  mensagemOutroDia,
  paraCampanha,
  podeConter,
  precoMinimo,
  rotuloData,
  temPrecosDiferentes,
  voltaDoDoce,
} from "@/lib/regras";
import {
  LIMITE_LINHAS,
  SACOLA_VAZIA,
  adicionarLinhas,
  limiteDoDoce,
  mesmaOpcao,
  precoDaOpcao,
  situacaoDoDoce,
  sortearNumero,
  temOpcoes,
  textoItens,
  unidadesDoDoce,
  unidadesNaSacola,
} from "@/lib/sacola";
import { Contador } from "../Contador";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { IlustracaoDoce } from "../IlustracaoDoce";
import { IconeAlerta, IconeCheck, IconeCompartilhar, IconeConversa, IconeCoracao, IconeRelogio, IconeSeta, IconeVoltar } from "../Icones";
import { barraFixa, botaoPrimario, cx, rotulo } from "../ui";

// Aviso no meio da ficha quando não dá para adicionar à sacola.
function Faixa({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 px-4 py-3 text-pessego">
      <IconeRelogio tamanho={20} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{titulo}</span>
        {texto && <span className="text-[13px] leading-snug">{texto}</span>}
      </div>
    </div>
  );
}

const TODOS_OS_ALERGENICOS = "leite, trigo, ovo, castanhas, amendoim nem soja";

type Folha = "duvida" | "outro-dia" | "encerrada";

export function FichaDoce({
  doce,
  campanhas,
  loja,
  agora: agoraDoServidor,
  endereco,
}: {
  doce: Doce;
  campanhas: Campanha[];
  loja: DadosLoja;
  // Momento da visita, calculado no servidor (minutoAtual).
  agora: number;
  // Endereço público do site, para o link de compartilhar.
  endereco: string;
}) {
  const agora = useAgora(agoraDoServidor);
  const hoje = hojeNaLoja(agora);
  const { ids: favoritos, alternar } = useFavoritos();
  const { sacola, gravar } = useSacola();
  // Bloco "Quantos de cada?": quantas unidades de cada opção (pelo nome), começando em 0.
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  // Doce sem opções: o contador fica na barra e começa em 1.
  const [qtdBarra, setQtdBarra] = useState(1);
  const [folha, setFolha] = useState<Folha | null>(null);
  const [naSacolaAgora, setNaSacolaAgora] = useState(false);
  const [dicaEscolha, setDicaEscolha] = useState(false);
  const [linhasDemais, setLinhasDemais] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  // Região aria-live única da tela.
  const [anuncio, setAnuncio] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const blocoRef = useRef<HTMLDivElement>(null);
  const fecharFolha = useCallback(() => setFolha(null), [setFolha]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // O Next guarda a ficha escondida ao navegar: ao sair, fecha a folha e limpa os avisos.
  useLayoutEffect(
    () => () => {
      setFolha(null);
      setNaSacolaAgora(false);
      setDicaEscolha(false);
      setLinhasDemais(false);
      setLinkCopiado(false);
    },
    [],
  );

  const situacao = situacaoDoDoce(doce, campanhas, hoje, loja.horarios);
  const { campanha, prontoEm } = situacao;
  const foraDeEpoca = situacao.bloqueio === "saiu_da_vitrine";
  const encerrada = situacao.bloqueio === "encomenda_encerrada";
  const semTempo = situacao.bloqueio === "sem_tempo_campanha";
  const esgotado = situacao.bloqueio === "esgotou";
  const podeAdicionar = situacao.bloqueio === null;
  const prazoCampanha = campanha && doce.sobEncomenda ? encomendaAberta(campanha, hoje) : null;

  const estoque = estoqueDoDoce(doce, hoje);
  const prazo = doce.prazoDias ?? 1;
  const favorito = favoritos.has(doce.id);
  const foto = doce.fotos[0];
  const comBloco = temOpcoes(doce);
  const guardada = sacola ?? SACOLA_VAZIA;
  const noSacola = unidadesDoDoce(guardada, doce.id);
  const restante = Math.max(0, limiteDoDoce(doce, hoje) - noSacola);
  const escolhido = comBloco ? Object.values(escolhas).reduce((t, q) => t + q, 0) : Math.min(qtdBarra, restante);
  const noLimite = podeAdicionar && escolhido >= restante;
  const total = comBloco
    ? doce.sabores.reduce((t, s) => t + (escolhas[s.nome] ?? 0) * precoDaOpcao(doce, s.nome), 0)
    : escolhido * precoDaOpcao(doce, null);
  const textoDoBotao = naSacolaAgora
    ? "Na sacola"
    : escolhido === 0
      ? "Escolha quantos de cada"
      : `Adicionar${escolhido > 1 ? ` ${escolhido}` : ""} · ${formatarPreco(total)}`;

  const contem = doce.alergenicos;
  const pode = podeConter(doce, loja.tracos);
  // O que deste doce já está na sacola, na ordem das opções.
  const linhasDoDoce = guardada.linhas
    .filter((l) => l.doceId === doce.id)
    .sort((a, b) => doce.sabores.findIndex((s) => mesmaOpcao(s.nome, a.opcao)) - doce.sabores.findIndex((s) => mesmaOpcao(s.nome, b.opcao)));
  const naSuaSacola = comBloco
    ? linhasDoDoce.map((l) => `${l.quantidade}x ${l.opcao ?? doce.nome}`).join(", ")
    : String(noSacola);
  const unidadesGuardadas = unidadesNaSacola(guardada);

  function mudarEscolha(nome: string, valor: number) {
    setEscolhas((atual) => ({ ...atual, [nome]: valor }));
    setDicaEscolha(false);
    setLinhasDemais(false);
    setAnuncio(`${nome}: ${valor}`);
  }

  function adicionar() {
    if (escolhido === 0) {
      // Nada escolhido: leva até o bloco e foca o primeiro +.
      blocoRef.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      document.getElementById("mais-primeira-opcao")?.focus({ preventScroll: true });
      setDicaEscolha(true);
      setAnuncio("Toque em + no que você quer.");
      return;
    }
    const itens = comBloco ? doce.sabores.map((s) => ({ opcao: s.nome, quantidade: escolhas[s.nome] ?? 0 })) : [{ opcao: null, quantidade: escolhido }];
    const nova = adicionarLinhas(guardada, doce, itens, Date.now(), sortearNumero());
    if (!nova) {
      setLinhasDemais(true);
      setAnuncio(`Sua sacola já tem ${LIMITE_LINHAS} doces diferentes. Para um pedido maior, fale direto com a Mone no WhatsApp.`);
      return;
    }
    gravar(nova);
    setEscolhas({});
    setQtdBarra(1);
    setNaSacolaAgora(true);
    timers.current.push(setTimeout(() => setNaSacolaAgora(false), 1500));
    setAnuncio(`Adicionado: ${escolhido} ${doce.nome}. Sacola com ${textoItens(unidadesNaSacola(nova))}.`);
  }

  async function compartilhar() {
    const url = `${endereco}/doce/${doce.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: doce.nome, text: `${doce.nome} · ${LOJA.nome}`, url });
        return;
      } catch (erro) {
        // Cancelar o compartilhamento não é erro.
        if (erro instanceof DOMException && erro.name === "AbortError") return;
      }
    }
    if (await copiarTexto(url)) {
      setLinkCopiado(true);
      setAnuncio("Link copiado");
      timers.current.push(setTimeout(() => setLinkCopiado(false), 2500));
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(160px+env(safe-area-inset-bottom))]">
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      <div className="relative">
        <div className="fundo-vitrine relative flex h-[400px] items-center justify-center overflow-hidden">
          {foto ? (
            <Image src={foto} alt={doce.nome} fill priority sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
          ) : doce.ilustracao ? (
            <div className="w-[330px] animate-[flutua_6s_ease-in-out_infinite]">
              <IlustracaoDoce ilustracao={doce.ilustracao} />
            </div>
          ) : null}
        </div>
        <div className="absolute inset-x-4 top-[calc(16px+env(safe-area-inset-top))] flex justify-between">
          <Link
            href="/"
            aria-label="Voltar para a vitrine"
            className="flex size-11 items-center justify-center rounded-full bg-white/75 text-cacau-900 backdrop-blur-md active:scale-95"
          >
            <IconeVoltar />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={compartilhar}
              aria-label="Compartilhar este doce"
              className="flex size-11 items-center justify-center rounded-full bg-white/75 text-cacau-900 backdrop-blur-md active:scale-95"
            >
              <IconeCompartilhar tamanho={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => alternar(doce.id)}
              aria-pressed={favorito}
              aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
              className="flex size-11 items-center justify-center rounded-full bg-white/75 backdrop-blur-md active:scale-95"
            >
              <IconeCoracao tamanho={20} strokeWidth={2} className={favorito ? "fill-favorito text-favorito" : "text-cacau-900"} />
            </button>
          </div>
        </div>
        {linkCopiado && (
          <span className="absolute top-[calc(70px+env(safe-area-inset-top))] right-4 animate-entra rounded-full bg-cacau-900 px-3.5 py-2 text-[13px] font-bold text-creme shadow-xl">
            Link copiado
          </span>
        )}
      </div>

      <div className="relative -mt-7 flex flex-col gap-5 rounded-t-[30px] bg-cacau-950 px-5 pt-6 pb-7">
        {!foraDeEpoca && (
          <div className="flex flex-wrap gap-2">
            {doce.sobEncomenda ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pessego px-2.5 py-1 text-xs font-bold text-cacau-900">
                  <IconeRelogio tamanho={13} strokeWidth={2.2} />
                  Sob encomenda
                </span>
                <span className="rounded-full border border-pessego/40 px-2.5 py-1 text-xs font-bold text-pessego">
                  Fica pronto em {prazo} {prazo === 1 ? "dia" : "dias"}
                </span>
              </>
            ) : (
              <>
                {doce.selo === "mais_vendido" && (
                  <span className="rounded-full bg-dourado px-2.5 py-1 text-xs font-bold text-cacau-900">Mais vendido</span>
                )}
                {doce.selo === "novo" && <span className="rounded-full bg-creme px-2.5 py-1 text-xs font-bold text-cacau-900">Novo</span>}
                {estoque.disponivel && estoque.deHoje && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-menta/12 px-2.5 py-1 text-xs font-bold text-menta">
                    <span className="size-1.5 animate-pulsa rounded-full bg-menta" />
                    Pronta entrega
                  </span>
                )}
                <span
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-xs font-bold",
                    !estoque.disponivel
                      ? "border-creme-400/45 text-creme-400"
                      : estoque.deHoje
                        ? "border-dourado/35 text-dourado"
                        : "border-creme-200/40 text-creme-200",
                  )}
                >
                  {estoque.texto}
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] leading-[1.05] font-semibold">{doce.nome}</h1>
          <p className="text-[15px] leading-relaxed text-creme-200">{doce.descricao}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {temPrecosDiferentes(doce) && <span className="text-[15px] font-semibold text-creme-200">a partir de</span>}
            <span className="font-display text-[30px] font-semibold text-dourado">{formatarPreco(precoMinimo(doce))}</span>
            <span className="text-[13px] text-creme-400">{doce.unidade}</span>
          </div>
          {/* Alergênicos logo depois do preço, antes de escolher. */}
          <div className="flex flex-col gap-1 text-sm leading-snug">
            {contem === null ? (
              <p className="flex items-start gap-1.5 font-semibold text-rosa">
                <IconeAlerta tamanho={18} className="mt-px shrink-0" />
                Alergênicos: pergunte no WhatsApp antes de pedir.
              </p>
            ) : contem.length > 0 ? (
              <p className="text-creme">
                <strong className="text-rosa">Contém:</strong> {contem.join(", ")}
              </p>
            ) : (
              <p className="text-creme-200">Não leva {TODOS_OS_ALERGENICOS}.</p>
            )}
            {pode.length > 0 && (
              <p className="text-creme-200">
                <strong className="text-creme">Pode conter:</strong> {pode.join(", ")}
              </p>
            )}
          </div>
        </div>

        {foraDeEpoca && <Faixa titulo={voltaDoDoce(doce, campanhas, hoje)} texto="Enquanto isso, veja o que tem hoje na vitrine." />}
        {encerrada && campanha && (
          <Faixa
            titulo="Encomendas encerradas"
            texto={`O último dia para encomendar foi ${formatarDiaMes(campanha.limiteEncomenda!)}. Pergunte no WhatsApp se ainda dá.`}
          />
        )}
        {semTempo && campanha && (
          <Faixa
            titulo={`Não dá mais tempo ${paraCampanha(campanha)}: este doce leva ${prazo} ${prazo === 1 ? "dia" : "dias"}.`}
            texto="Pergunte no WhatsApp se ainda dá."
          />
        )}

        {podeAdicionar && comBloco && (
          <div ref={blocoRef} role="group" aria-labelledby="quantos-de-cada" className="flex flex-col gap-1">
            <h2 id="quantos-de-cada" className={cx(rotulo, "pb-1.5")}>
              Quantos de cada?
            </h2>
            <ul className="flex flex-col">
              {doce.sabores.map((s, i) => {
                const valor = escolhas[s.nome] ?? 0;
                return (
                  <li key={s.id} className="flex min-h-14 items-center gap-3 border-b border-dourado/10 py-1.5 last:border-b-0">
                    <div className="flex min-w-0 grow flex-col">
                      <span className="text-[15px] font-semibold">{s.nome}</span>
                      <span className="text-[15px] font-bold text-dourado">{formatarPreco(precoDaOpcao(doce, s.nome))}</span>
                    </div>
                    <Contador
                      nome={s.nome}
                      valor={valor}
                      noLimite={noLimite}
                      idMais={i === 0 ? "mais-primeira-opcao" : undefined}
                      aoMudar={(v) => mudarEscolha(s.nome, v)}
                    />
                  </li>
                );
              })}
            </ul>
            {dicaEscolha && escolhido === 0 && (
              <p className="text-[13px] font-semibold text-dourado">
                Toque em + no que você quer.
              </p>
            )}
            {noLimite && <p className="text-[13px] font-semibold text-pessego">Para mais unidades, combine no WhatsApp.</p>}
          </div>
        )}

        {podeAdicionar && doce.sobEncomenda && prontoEm && (
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-relaxed text-creme-200">
              Fica pronto em {prazo} {prazo === 1 ? "dia" : "dias"}. O mais cedo é {rotuloData(prontoEm)}. O dia e o horário você combina com a
              Mone no WhatsApp.
            </p>
            {prazoCampanha?.urgente && <span className="text-xs font-bold text-pessego">{prazoCampanha.texto}</span>}
          </div>
        )}

        {noSacola > 0 && (
          <p className="text-sm text-creme-200">
            Na sua sacola: {naSuaSacola} ·{" "}
            <Link href="/sacola" className="inline-flex min-h-11 items-center font-bold text-dourado underline underline-offset-4">
              Ver sacola
            </Link>
          </p>
        )}

        <button
          type="button"
          onClick={() => setFolha("duvida")}
          className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold text-whatsapp"
        >
          <IconeConversa tamanho={20} strokeWidth={2} />
          Tirar uma dúvida no WhatsApp
        </button>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Composição</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.composicao}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Conservação</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.conservacao}</p>
        </div>
      </div>

      <div className={cx(barraFixa, "flex-col gap-2")}>
        {unidadesGuardadas > 0 && (
          <Link href="/sacola" className="flex min-h-11 items-center justify-between gap-3 text-[15px] font-bold text-dourado">
            <span>Sacola: {textoItens(unidadesGuardadas)}</span>
            <span className="inline-flex items-center gap-0.5">
              Ver sacola
              <IconeSeta tamanho={16} />
            </span>
          </Link>
        )}
        {podeAdicionar && !comBloco && noLimite && (
          <p className="text-center text-xs font-semibold text-pessego">Para mais unidades, combine no WhatsApp.</p>
        )}
        {linhasDemais && (
          <p className="text-center text-[13px] leading-snug font-semibold text-pessego">
            Sua sacola já tem {LIMITE_LINHAS} doces diferentes. Para um pedido maior, fale direto com a Mone no WhatsApp.
          </p>
        )}
        <div className="flex min-h-[52px] items-center gap-3">
          {foraDeEpoca ? (
            <Link href="/" className={cx(botaoPrimario, "h-[52px] text-[15px]")}>
              Ver o que tem hoje
            </Link>
          ) : !podeAdicionar ? (
            <button
              type="button"
              onClick={() => setFolha(esgotado ? "outro-dia" : "encerrada")}
              className="flex h-[52px] grow items-center justify-center gap-2 rounded-full border-[1.5px] border-dourado text-[15px] font-bold text-dourado active:scale-[0.97]"
            >
              <IconeConversa tamanho={20} strokeWidth={2} />
              {esgotado ? "Esgotou hoje · Pedir para outro dia" : "Perguntar no WhatsApp"}
            </button>
          ) : restante === 0 && !naSacolaAgora ? (
            <Link href="/sacola" className={cx(botaoPrimario, "h-[52px] text-[15px]")}>
              Ver sacola
            </Link>
          ) : (
            <>
              {!comBloco && (
                <div className="flex h-[52px] shrink-0 items-center rounded-full border border-dourado/22 pl-3.5">
                  <span aria-hidden="true" className="text-xs font-semibold text-creme-400">
                    Qtd.
                  </span>
                  <Contador
                    nome="Quantidade"
                    rotulos={{ menos: "Diminuir quantidade", mais: "Aumentar quantidade" }}
                    naBarra
                    valor={escolhido}
                    minimo={1}
                    noLimite={noLimite}
                    aoMudar={(v) => {
                      setQtdBarra(v);
                      setLinhasDemais(false);
                      setAnuncio(`Quantidade: ${v}`);
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={adicionar}
                className={cx(botaoPrimario, "h-[52px] min-w-0 grow px-3 whitespace-nowrap", textoDoBotao.length > 20 ? "text-[13px]" : "text-[15px]")}
              >
                {naSacolaAgora && <IconeCheck tamanho={20} className="shrink-0" />}
                {textoDoBotao}
              </button>
            </>
          )}
        </div>
      </div>

      <FolhaWhatsApp
        aberta={folha !== null}
        aoFechar={fecharFolha}
        loja={loja}
        situacao={situacaoDaLoja(loja.horarios, agora)}
        {...(folha === "outro-dia"
          ? {
              titulo: "Pedir para outro dia",
              mensagem: mensagemOutroDia(LOJA.nome, doce),
              explicacao: "Escreva no fim da mensagem o dia que você quer. A Mone responde se consegue fazer.",
            }
          : folha === "encerrada" && campanha
            ? {
                titulo: "Perguntar no WhatsApp",
                mensagem: mensagemEncerrada(LOJA.nome, campanha, doce),
                explicacao: "A conversa abre com a pergunta pronta. A Mone responde se ainda consegue fazer.",
              }
            : {
                titulo: "Tirar uma dúvida",
                mensagem: mensagemDuvida(LOJA.nome, doce),
                explicacao: "Escreva sua dúvida no fim da mensagem. A Mone responde por lá.",
              })}
      />
    </div>
  );
}
