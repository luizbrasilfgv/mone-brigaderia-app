"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import { LOJA, type DadosLoja } from "@/lib/loja";
import { hojeNaLoja, situacaoDaLoja, temHorario } from "@/lib/horarios";
import { useAgora, useFavoritos } from "@/lib/hooks";
import {
  campanhaDoDoce,
  campanhasNoAr,
  datasDeEncomenda,
  encomendaAberta,
  estoqueDoDoce,
  formatarDiaMes,
  formatarPreco,
  limiteDoPedido,
  mensagemDoDoce,
  mensagemEncerrada,
  mensagemOutroDia,
  paraCampanha,
  precoDoSabor,
  rotuloData,
  voltaDoDoce,
} from "@/lib/regras";
import { FolhaWhatsApp } from "../FolhaWhatsApp";
import { IlustracaoDoce } from "../IlustracaoDoce";
import {
  IconeAlerta,
  IconeCaixa,
  IconeCheck,
  IconeConversa,
  IconeCoracao,
  IconeMais,
  IconeMenos,
  IconeRelogio,
  IconeVoltar,
} from "../Icones";
import { botaoPrimario, botaoWhatsApp, cx, escolha, rotulo } from "../ui";

// "Contém glúten", "Sem glúten" ou, quando o doce não leva mas a cozinha usa o
// ingrediente, "Pode conter glúten".
function Alergenico({ contem, pode, nome }: { contem: boolean; pode: boolean; nome: string }) {
  const alerta = contem || pode;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold",
        alerta ? "border-rosa/45 text-rosa" : "border-dourado/45 text-dourado",
      )}
    >
      {alerta ? <IconeAlerta tamanho={16} /> : <IconeCheck tamanho={16} />}
      {contem ? `Contém ${nome}` : pode ? `Pode conter ${nome}` : `Sem ${nome}`}
    </span>
  );
}

function Info({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] border border-dourado/12 bg-cacau-900 p-3.5 text-dourado">
      {icone}
      <span className="text-[13px] leading-tight font-semibold text-creme">{texto}</span>
    </div>
  );
}

// Aviso no meio da ficha quando não dá para pedir do jeito normal.
function Faixa({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 px-4 py-3 text-pessego">
      <IconeRelogio tamanho={20} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{titulo}</span>
        {texto && <span className="text-[13px] leading-snug">{texto}</span>}
      </div>
    </div>
  );
}

// "e" antes do último: "leite, trigo e ovo"
function juntar(itens: string[]): string {
  return itens.length <= 1 ? (itens[0] ?? "") : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;
}

type Folha = "pedido" | "outro-dia" | "encerrada";

export function FichaDoce({
  doce,
  campanhas,
  loja,
  agora: agoraDoServidor,
}: {
  doce: Doce;
  campanhas: Campanha[];
  loja: DadosLoja;
  // Momento da visita, calculado no servidor (minutoAtual).
  agora: number;
}) {
  const agora = useAgora(agoraDoServidor);
  const hoje = hojeNaLoja(agora);
  const { ids: favoritos, alternar } = useFavoritos();
  const [saborId, setSaborId] = useState(doce.sabores[0]?.id);
  const [quantidade, setQuantidade] = useState(1);
  const [data, setData] = useState<string | null>(null);
  const [folha, setFolha] = useState<Folha | null>(null);
  const fecharFolha = useCallback(() => setFolha(null), []);

  const noAr = campanhasNoAr(campanhas, hoje);
  // Doce "só em campanhas" sem campanha no ar: link antigo, fora de época.
  const foraDeEpoca = doce.ondeAparece === "so_campanhas" && !noAr.some((c) => doce.campanhaIds.includes(c.id));
  const campanha = campanhaDoDoce(doce, noAr);
  const prazoCampanha = campanha && doce.sobEncomenda ? encomendaAberta(campanha, hoje) : null;

  const sabor = doce.sabores.find((s) => s.id === saborId);
  const preco = precoDoSabor(doce, sabor);
  const estoque = estoqueDoDoce(doce, hoje);
  const maximo = limiteDoPedido(doce, hoje);
  const qtd = Math.min(quantidade, maximo);
  const prazo = doce.prazoDias ?? 1;
  const datas = doce.sobEncomenda ? datasDeEncomenda(prazo, hoje, loja.horarios, campanha?.fim) : [];
  // Doce de campanha que não fica pronto antes de a campanha acabar.
  const semTempo = Boolean(campanha && doce.sobEncomenda && prazoCampanha?.aberta && datas.length === 0);
  const encerrada = Boolean(prazoCampanha && !prazoCampanha.aberta);
  // Sem escolha, vale a primeira data possível.
  const dataEscolhida = data === "outra" ? null : data && datas.includes(data) ? data : (datas[0] ?? null);
  const favorito = favoritos.has(doce.id);
  const foto = doce.fotos[0];
  const podePedir = !foraDeEpoca && !encerrada && !semTempo && estoque.disponivel;
  const noLimite = podePedir && qtd >= maximo;
  // "Pedir 6 · R$ 54,00", "Encomendar · R$ 120,00"
  const textoDoBotao = `${doce.sobEncomenda ? "Encomendar" : "Pedir"}${qtd > 1 ? ` ${qtd}` : ""} · ${formatarPreco(preco * qtd)}`;
  const tracos = loja.tracos.filter((t) => !(t === "trigo" && doce.contemGluten) && !(t === "leite" && doce.contemLactose));

  return (
    <div className={cx("mx-auto min-h-dvh max-w-md", noLimite ? "pb-36" : "pb-28")}>
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
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <Link
            href="/"
            aria-label="Voltar para a vitrine"
            className="flex size-11 items-center justify-center rounded-full bg-white/75 text-cacau-900 backdrop-blur-md active:scale-95"
          >
            <IconeVoltar />
          </Link>
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

      <div className="relative -mt-7 flex flex-col gap-5 rounded-t-[30px] bg-cacau-950 px-5 pt-6 pb-7">
        {!foraDeEpoca && (
          <div className="flex flex-wrap gap-2">
            {doce.sobEncomenda ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pessego px-2.5 py-1 text-[11px] font-bold text-cacau-900">
                  <IconeRelogio tamanho={13} strokeWidth={2.2} />
                  Sob encomenda
                </span>
                <span className="rounded-full border border-pessego/40 px-2.5 py-1 text-[11px] font-bold text-pessego">
                  Fica pronto em {prazo} {prazo === 1 ? "dia" : "dias"}
                </span>
              </>
            ) : (
              <>
                {doce.selo === "mais_vendido" && (
                  <span className="rounded-full bg-dourado px-2.5 py-1 text-[11px] font-bold text-cacau-900">Mais vendido</span>
                )}
                {doce.selo === "novo" && (
                  <span className="rounded-full bg-creme px-2.5 py-1 text-[11px] font-bold text-cacau-900">Novo</span>
                )}
                {estoque.disponivel && estoque.deHoje && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-menta/12 px-2.5 py-1 text-[11px] font-bold text-menta">
                    <span className="size-1.5 animate-pulsa rounded-full bg-menta" />
                    Pronta entrega
                  </span>
                )}
                <span
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-[11px] font-bold",
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

        <div className="flex items-baseline gap-2">
          <span className="font-display text-[30px] font-semibold text-dourado">{formatarPreco(preco)}</span>
          <span className="text-[13px] text-creme-400">{doce.unidade}</span>
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
            titulo={`Não dá mais tempo ${paraCampanha(campanha)}`}
            texto={`Este doce leva ${prazo} ${prazo === 1 ? "dia" : "dias"}. Pergunte no WhatsApp se ainda dá.`}
          />
        )}

        {podePedir && doce.sabores.length > 1 && (
          <div role="group" aria-label="Sabor" className="flex flex-col gap-2.5">
            <span className={rotulo}>Sabor</span>
            <div className="flex flex-wrap gap-2">
              {doce.sabores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === saborId}
                  onClick={() => setSaborId(s.id)}
                  className={cx("h-11 rounded-[14px] px-4", escolha(s.id === saborId))}
                >
                  {s.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {podePedir && doce.sobEncomenda && datas.length > 0 && (
          <div role="group" aria-label="Para quando" className="flex flex-col gap-2.5">
            <span className={rotulo}>Para quando?</span>
            <div className="flex flex-wrap gap-2">
              {datas.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === dataEscolhida}
                  onClick={() => setData(d)}
                  className={cx("h-11 rounded-[14px] px-3.5", escolha(d === dataEscolhida))}
                >
                  {rotuloData(d)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={data === "outra"}
                onClick={() => setData("outra")}
                className={cx("h-11 rounded-[14px] px-3.5", escolha(data === "outra"))}
              >
                Outra data
              </button>
            </div>
            <span className="text-xs text-creme-400">
              A primeira data já respeita o prazo de {prazo} {prazo === 1 ? "dia" : "dias"}
              {temHorario(loja.horarios) ? " e os dias em que a loja abre." : "."}
            </span>
            {prazoCampanha?.urgente && <span className="text-xs font-bold text-pessego">{prazoCampanha.texto}</span>}
          </div>
        )}

        {!foraDeEpoca && (
          <div className="grid grid-cols-2 gap-2.5">
            {doce.sobEncomenda ? (
              <>
                <Info icone={<IconeRelogio />} texto="Feito na hora do pedido" />
                <Info icone={<IconeCaixa />} texto={`Pronto em ${prazo} ${prazo === 1 ? "dia" : "dias"}`} />
              </>
            ) : (
              <>
                <Info icone={<IconeRelogio />} texto="Pronto para levar" />
                <Info icone={<IconeCaixa />} texto={estoque.deHoje ? estoque.texto : "Confirme no WhatsApp se tem hoje"} />
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <h2 className={rotulo}>Alergênicos</h2>
          <div className="flex flex-wrap gap-2">
            <Alergenico contem={doce.contemGluten} pode={loja.tracos.includes("trigo")} nome="glúten" />
            <Alergenico contem={doce.contemLactose} pode={loja.tracos.includes("leite")} nome="lactose" />
          </div>
          {tracos.length > 0 && (
            <p className="text-[13px] leading-snug text-creme-200">Pode conter traços de {juntar(tracos)}: a cozinha usa esses ingredientes.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Composição</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.composicao}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={rotulo}>Conservação</h2>
          <p className="text-sm leading-relaxed text-creme-200">{doce.conservacao}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md flex-col gap-2 border-t border-dourado/14 bg-cacau-950/88 px-5 pt-3.5 pb-6 backdrop-blur-lg">
        {noLimite && (
          <p role="status" className="text-center text-xs font-semibold text-pessego">
            Para mais unidades, combine no WhatsApp.
          </p>
        )}
        <div className="flex h-[52px] items-center gap-3">
          {foraDeEpoca ? (
            <Link href="/" className={cx(botaoPrimario, "h-[52px] text-[15px]")}>
              Ver o que tem hoje
            </Link>
          ) : encerrada || semTempo || !estoque.disponivel ? (
            <button
              type="button"
              onClick={() => setFolha(estoque.disponivel ? "encerrada" : "outro-dia")}
              className="flex h-[52px] grow items-center justify-center gap-2 rounded-full border-[1.5px] border-dourado text-[15px] font-bold text-dourado active:scale-[0.97]"
            >
              <IconeConversa tamanho={20} strokeWidth={2} />
              {estoque.disponivel ? "Perguntar no WhatsApp" : "Esgotou hoje · Pedir para outro dia"}
            </button>
          ) : (
            <>
              <div className="flex h-[52px] shrink-0 items-center rounded-full border border-dourado/22 pl-3.5">
                <span aria-hidden="true" className="text-xs font-semibold text-creme-400">
                  Qtd.
                </span>
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantidade(Math.max(1, qtd - 1))}
                  className="flex size-11 items-center justify-center rounded-full active:scale-95"
                >
                  <IconeMenos tamanho={18} />
                </button>
                <span aria-live="polite" aria-atomic="true" className="min-w-[22px] text-center text-base font-bold">
                  <span className="sr-only">Quantidade: </span>
                  {qtd}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  aria-disabled={noLimite}
                  onClick={() => setQuantidade(Math.min(maximo, qtd + 1))}
                  className={cx("flex size-11 items-center justify-center rounded-full active:scale-95", noLimite && "opacity-40")}
                >
                  <IconeMais tamanho={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFolha("pedido")}
                className={cx(
                  botaoWhatsApp,
                  "h-[52px] min-w-0 grow px-3 whitespace-nowrap",
                  textoDoBotao.length > 24 ? "text-[13px]" : "text-[15px]",
                )}
              >
                {/* Em celular estreito, texto comprido perde o ícone para caber. */}
                {textoDoBotao.length <= 18 && <IconeConversa tamanho={20} strokeWidth={2} className="shrink-0" />}
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
                mensagem: mensagemDoDoce({ nomeLoja: LOJA.nome, doce, sabor, quantidade: qtd, data: dataEscolhida }),
                explicacao: doce.sobEncomenda
                  ? "A conversa abre com a encomenda e a data já escritas. A Mone responde confirmando o pedido e o total, e vocês combinam a retirada ou a entrega."
                  : "A conversa abre com o pedido já escrito. A Mone responde confirmando o pedido e o total, e vocês combinam a retirada ou a entrega.",
                dica: "Quer outro sabor ou mais doces? É só escrever na conversa.",
              })}
      />
    </div>
  );
}
