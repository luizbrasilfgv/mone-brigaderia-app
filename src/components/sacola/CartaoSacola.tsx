"use client";

import Link from "next/link";
import type { Campanha } from "@/lib/tipos";
import { daCampanha, formatarDiaMes, formatarPreco, paraCampanha } from "@/lib/regras";
import { temOpcoes, type LinhaConferida } from "@/lib/sacola";
import { Contador } from "../Contador";
import { ImagemDoce } from "../ImagemDoce";
import { IconeAlerta } from "../Icones";
import { cx } from "../ui";

const botaoPequeno = "inline-flex h-11 items-center rounded-full border border-dourado/30 px-4 text-sm font-bold text-dourado active:scale-95";

// "Palha italiana Ninho" (ou só o nome do doce, sem opção).
export function nomeDaLinha(linha: LinhaConferida): string {
  return linha.opcao && (!linha.doce || temOpcoes(linha.doce)) ? `${linha.nomeDoce} ${linha.opcao}` : linha.nomeDoce;
}

function motivoDaLinha(linha: LinhaConferida, campanha: Campanha | null): string {
  if (linha.situacao === "escolher") return "Agora tem opções. Escolha qual você quer.";
  switch (linha.motivo) {
    case "esgotou":
      return "Esgotou hoje · não vai no pedido";
    case "opcao_saiu":
      return "Esta opção saiu do cardápio · não vai no pedido";
    case "encomenda_encerrada":
      return `Encomendas ${campanha ? daCampanha(campanha) : "da campanha"} encerradas · não vai no pedido`;
    case "sem_tempo_campanha":
      return `Não dá mais tempo ${campanha ? paraCampanha(campanha) : "para a campanha"} · não vai no pedido`;
    default:
      return "Saiu da vitrine · não vai no pedido";
  }
}

// Um cartão por doce na sacola, com uma linha por sabor ou tamanho.
export function CartaoSacola({
  linhas,
  campanha,
  limite,
  aoMudar,
  aoTirar,
  aoPerguntarOutroDia,
}: {
  linhas: LinhaConferida[];
  // Campanha que manda no doce (para "Encomendas do Natal encerradas").
  campanha: Campanha | null;
  // Unidades deste doce que ainda podem ir no pedido (todas as opções).
  limite: number;
  aoMudar: (linha: LinhaConferida, quantidade: number) => void;
  aoTirar: (linha: LinhaConferida) => void;
  aoPerguntarOutroDia: (linha: LinhaConferida) => void;
}) {
  const primeira = linhas[0];
  const doce = primeira.doce;
  const somaQueVai = linhas.filter((l) => l.situacao === "vai").reduce((t, l) => t + l.quantidade, 0);
  const noLimite = somaQueVai >= limite;
  const algumaVai = linhas.some((l) => l.situacao === "vai");
  const prazo = doce?.prazoDias ?? 1;

  return (
    <li className="flex flex-col gap-1 rounded-[20px] border border-dourado/12 bg-cacau-900 p-3">
      <div className="flex items-center gap-3">
        <div className={cx("fundo-vitrine size-14 shrink-0 overflow-hidden rounded-xl", !algumaVai && "opacity-50")}>
          {doce && <ImagemDoce doce={doce} tamanhos="56px" decorativa />}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className={cx("text-base leading-tight font-semibold", !algumaVai && "text-creme-400")}>{primeira.nomeDoce}</h2>
          {doce?.sobEncomenda && (
            <span className="self-start rounded-full border border-pessego/40 px-2 py-0.5 text-xs font-bold text-pessego">
              Sob encomenda · {prazo} {prazo === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>
      </div>

      <ul className="flex flex-col">
        {linhas.map((linha) => {
          const comNome = linha.opcao && doce && temOpcoes(doce);
          return (
            <li key={linha.chave} data-linha={linha.chave} className="flex flex-col gap-1 border-t border-dourado/8 pt-2.5 pb-1 first:border-t-0">
              {linha.situacao === "vai" ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold">{comNome ? linha.opcao : ""}</span>
                    <span className="text-[15px] font-bold text-dourado">{formatarPreco(linha.subtotalCentavos)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-creme-400">{formatarPreco(linha.precoCentavos)} cada</span>
                    <Contador
                      nome={nomeDaLinha(linha)}
                      valor={linha.quantidade}
                      noLimite={noLimite}
                      aoMudar={(q) => aoMudar(linha, q)}
                      lixeira={{ rotulo: `Tirar ${nomeDaLinha(linha)} da sacola`, aoTirar: () => aoTirar(linha) }}
                    />
                  </div>
                  {linha.precoAntes !== null && (
                    <p className="text-[13px] font-semibold text-pessego">Preço atualizado (antes {formatarPreco(linha.precoAntes)})</p>
                  )}
                  {linha.cortada && <p className="text-[13px] font-semibold text-pessego">Tem menos hoje. Ajustamos sua quantidade.</p>}
                  {linha.ateFimDaCampanha && (
                    <p className="text-[13px] font-semibold text-pessego">
                      Precisa ficar pronto até {formatarDiaMes(linha.ateFimDaCampanha)}. Combine as datas na conversa.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-creme-400">
                    <span className="text-[15px] font-semibold line-through decoration-creme-400/60">
                      {comNome || (!doce && linha.opcao) ? `${linha.quantidade}x ${linha.opcao}` : `${linha.quantidade}x`}
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 text-[13px] font-semibold text-pessego">
                    <IconeAlerta tamanho={16} className="mt-px shrink-0" />
                    {motivoDaLinha(linha, campanha)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {doce && (linha.motivo === "opcao_saiu" || linha.situacao === "escolher") && (
                      <Link href={`/doce/${doce.id}`} className={botaoPequeno}>
                        Ver o doce
                      </Link>
                    )}
                    <button type="button" onClick={() => aoTirar(linha)} aria-label={`Tirar ${nomeDaLinha(linha)} da sacola`} className={botaoPequeno}>
                      Tirar
                    </button>
                    {linha.motivo === "esgotou" && doce && (
                      <button
                        type="button"
                        onClick={() => aoPerguntarOutroDia(linha)}
                        className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-whatsapp underline underline-offset-4"
                      >
                        Perguntar por outro dia
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {algumaVai && noLimite && <p className="text-[13px] font-semibold text-pessego">Para mais unidades, combine no WhatsApp.</p>}
      {doce && temOpcoes(doce) && algumaVai && (
        <Link href={`/doce/${doce.id}`} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-dourado">
          + Outra opção
        </Link>
      )}
    </li>
  );
}
