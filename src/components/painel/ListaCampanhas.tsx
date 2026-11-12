"use client";

import Link from "next/link";
import { useState } from "react";
import type { Campanha, Doce } from "@/lib/tipos";
import { useHoje } from "@/lib/hooks";
import { MODELOS, proximoEvento } from "@/lib/campanhas-modelo";
import { formatarData, formatarDiaMes, situacaoCampanha, type SituacaoCampanha } from "@/lib/regras";
import { IconeMais } from "../Icones";
import { cx, rotulo } from "../ui";
import { pausarCampanha } from "@/app/painel/acoes";
import { CabecalhoPainel, Chave, FaixaDemo, tentar, useAviso } from "./comum";

const ETIQUETA: Partial<Record<SituacaoCampanha, { texto: string; classe: string }>> = {
  agendada: { texto: "Agendada", classe: "border-menta/40 text-menta" },
  rascunho: { texto: "Rascunho", classe: "border-creme-400/45 text-creme-400" },
  pausada: { texto: "Pausada", classe: "border-pessego/45 text-pessego" },
};

function LinhaCampanha({ campanha, situacao, apagada }: { campanha: Campanha; situacao: SituacaoCampanha; apagada?: boolean }) {
  const etiqueta = ETIQUETA[situacao];
  return (
    <Link
      href={`/painel/campanhas/${campanha.id}`}
      className={cx(
        "flex items-center gap-3 overflow-hidden rounded-[18px] border py-3 pr-3",
        apagada ? "border-dourado/8 bg-cacau-900/50" : "border-dourado/10 bg-cacau-900",
      )}
    >
      <span className="w-[5px] self-stretch" style={{ background: apagada ? "#4A3329" : campanha.cor }} />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className={cx("text-[15px] font-semibold", apagada && "text-creme-200")}>{campanha.nome}</span>
        <span className="text-xs text-creme-400">
          {formatarDiaMes(campanha.inicio)} a {formatarData(campanha.fim)}
        </span>
      </span>
      {etiqueta && (
        <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap", etiqueta.classe)}>
          {etiqueta.texto}
        </span>
      )}
    </Link>
  );
}

export function ListaCampanhas({ campanhas, doces, demo }: { campanhas: Campanha[]; doces: Doce[]; demo: boolean }) {
  const hoje = useHoje();
  const [aviso, , mostrarResultado] = useAviso();
  const [pausadas, setPausadas] = useState<Record<string, boolean>>({});

  if (!hoje) return <CabecalhoPainel titulo="Campanhas" subtitulo="Datas especiais que aparecem na vitrine" voltar="/painel" />;

  const comPausa = campanhas.map((c) => ({ ...c, pausada: pausadas[c.id] ?? c.pausada }));
  const situacao = (c: Campanha) => situacaoCampanha(c, hoje);
  const atuais = comPausa.filter((c) => ["no_ar", "pausada"].includes(situacao(c)));
  const proximas = comPausa.filter((c) => ["agendada", "rascunho"].includes(situacao(c)));
  const encerradas = comPausa.filter((c) => situacao(c) === "encerrada").reverse();

  return (
    <div className="pb-8">
      {aviso}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel titulo="Campanhas" subtitulo="Datas especiais que aparecem na vitrine" voltar="/painel" />

      <div className="flex flex-col gap-[22px] px-5 pt-3.5">
        {atuais.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className={rotulo}>No ar agora</h2>
            {atuais.map((c) => {
              const noAr = situacao(c) === "no_ar";
              const docesDaCampanha = doces.filter((d) => d.campanhaIds.includes(c.id));
              const exclusivos = docesDaCampanha.filter((d) => d.ondeAparece === "so_campanhas").length;
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-2.5 rounded-3xl border border-dourado/25 p-[18px]"
                  style={{ background: noAr ? c.cor : "#4A2A24" }}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold",
                        noAr ? "text-menta" : "text-[#F6DCCB]",
                      )}
                    >
                      <span className={cx("size-1.5 rounded-full bg-current", noAr && "animate-pulsa")} />
                      {noAr ? "No ar na vitrine" : "Pausada"}
                    </span>
                    <Chave
                      ligada={noAr}
                      rotulo={`Campanha ${c.nome} no ar`}
                      aoMudar={async function mudar() {
                        setPausadas((p) => ({ ...p, [c.id]: noAr }));
                        const resultado = await tentar(() => pausarCampanha(c.id, noAr));
                        mostrarResultado(resultado, () => void mudar());
                        if (!resultado.ok) setPausadas((p) => ({ ...p, [c.id]: !noAr }));
                      }}
                    />
                  </div>
                  <span className="font-display text-[28px] leading-tight font-semibold text-[#FFF4E6]">{c.nome}</span>
                  <span className="text-[13px] leading-normal text-[#F6DCCB]">
                    {formatarDiaMes(c.inicio)} a {formatarDiaMes(c.fim)}
                    {c.limiteEncomenda && ` · encomendas até ${formatarDiaMes(c.limiteEncomenda)}`}
                    <br />
                    {docesDaCampanha.length} {docesDaCampanha.length === 1 ? "doce" : "doces"} na campanha
                    {exclusivos > 0 && `, ${exclusivos} só para ela`}
                  </span>
                  <Link
                    href={`/painel/campanhas/${c.id}`}
                    className="flex h-11 items-center self-start rounded-full bg-pessego px-[18px] text-sm font-bold text-[#5A1414]"
                  >
                    Editar campanha
                  </Link>
                </div>
              );
            })}
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <h2 className={rotulo}>Criar campanha</h2>
          <p className="text-[13px] text-creme-400">Comece por uma data pronta ou crie a sua.</p>
          <div className="grid grid-cols-2 gap-2">
            {MODELOS.map((m) => {
              const evento = proximoEvento(m.tipo, hoje);
              return (
                <Link
                  key={m.tipo}
                  href={`/painel/campanhas/nova/${m.tipo}`}
                  className="flex min-h-14 items-center gap-2.5 rounded-2xl border border-dourado/12 bg-cacau-900 px-3 py-2.5"
                >
                  <span className="size-3 shrink-0 rounded-full ring-2 ring-creme/25" style={{ background: m.cor }} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm leading-tight font-semibold">{m.nome.replace(" Mone", "")}</span>
                    {evento && <span className="text-[11px] text-creme-400">{formatarData(evento)}</span>}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/painel/campanhas/nova/outra"
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-dourado/40 text-sm font-bold text-dourado"
            >
              <IconeMais tamanho={18} />
              Outra data
            </Link>
          </div>
        </section>

        {proximas.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className={rotulo}>Próximas</h2>
            {proximas.map((c) => (
              <LinhaCampanha key={c.id} campanha={c} situacao={situacao(c)} />
            ))}
          </section>
        )}

        {encerradas.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className={rotulo}>Encerradas</h2>
            {encerradas.map((c) => (
              <LinhaCampanha key={c.id} campanha={c} situacao="encerrada" apagada />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
