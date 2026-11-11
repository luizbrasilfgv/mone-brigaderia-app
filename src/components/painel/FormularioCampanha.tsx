"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Campanha, Doce, TipoCampanha } from "@/lib/tipos";
import { useHoje } from "@/lib/hooks";
import { CORES_BANNER, TIPOS_CAMPANHA, sugestaoDeCampanha } from "@/lib/campanhas-modelo";
import { NOMES_CAMPANHA, formatarData } from "@/lib/regras";
import { ImagemDoce } from "../ImagemDoce";
import { IconeMais } from "../Icones";
import { botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { salvarCampanha } from "@/app/painel/acoes";
import { CabecalhoPainel, FaixaDemo, useAviso } from "./comum";

interface Props {
  campanha: Campanha | null;
  tipoInicial: TipoCampanha;
  doces: Doce[];
  demo: boolean;
}

// As datas sugeridas dependem de hoje, que só se conhece no navegador.
export function FormularioCampanha(props: Props) {
  const hoje = useHoje();
  if (!hoje) {
    return <CabecalhoPainel titulo="Campanha" subtitulo="Só aparece na vitrine dentro do período" voltar="/painel/campanhas" />;
  }
  return <Formulario {...props} hoje={hoje} />;
}

function Formulario({ campanha, tipoInicial, doces, demo, hoje }: Props & { hoje: string }) {
  const router = useRouter();
  const [aviso, mostrarAviso] = useAviso();
  const [salvando, iniciar] = useTransition();
  const sugestaoInicial = campanha ? null : sugestaoDeCampanha(tipoInicial, hoje);
  const [tipo, setTipo] = useState<TipoCampanha>(campanha?.tipo ?? tipoInicial);
  const [nome, setNome] = useState(campanha?.nome ?? sugestaoInicial?.nome ?? "");
  const [inicio, setInicio] = useState(campanha?.inicio ?? sugestaoInicial?.inicio ?? "");
  const [fim, setFim] = useState(campanha?.fim ?? sugestaoInicial?.fim ?? "");
  const [limite, setLimite] = useState(campanha?.limiteEncomenda ?? sugestaoInicial?.limiteEncomenda ?? "");
  const [frase, setFrase] = useState(campanha?.fraseBanner ?? sugestaoInicial?.fraseBanner ?? "");
  const [cor, setCor] = useState(campanha?.cor ?? sugestaoInicial?.cor ?? "#3A1D13");
  const [docesIds, setDocesIds] = useState<string[]>(
    campanha ? doces.filter((d) => d.campanhaIds.includes(campanha.id)).map((d) => d.id) : [],
  );

  function escolherTipo(novo: TipoCampanha) {
    setTipo(novo);
    const s = sugestaoDeCampanha(novo, hoje);
    setNome(s?.nome ?? "");
    setInicio(s?.inicio ?? "");
    setFim(s?.fim ?? "");
    setLimite(s?.limiteEncomenda ?? "");
    setFrase(s?.fraseBanner ?? "");
    setCor(s?.cor ?? "#3A1D13");
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const resultado = await salvarCampanha({
        id: campanha?.id ?? null,
        tipo,
        nome,
        inicio,
        fim,
        limiteEncomenda: limite || null,
        fraseBanner: frase,
        cor,
        docesIds,
      });
      mostrarAviso(resultado.mensagem, resultado.ok);
      if (resultado.ok && resultado.id && !campanha) router.replace(`/painel/campanhas/${resultado.id}`);
    });
  }

  const nomeDoTipo = tipo === "outra" ? "Campanha" : `Campanha de ${NOMES_CAMPANHA[tipo]}`;
  const docePrevia = doces.find((d) => docesIds.includes(d.id));

  return (
    <form onSubmit={salvar} className="pb-28">
      {aviso}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel
        titulo={campanha ? "Editar campanha" : "Nova campanha"}
        subtitulo="Só aparece na vitrine dentro do período"
        voltar="/painel/campanhas"
      />

      <div className="flex flex-col gap-5 px-5 pt-3.5 pb-7">
        <div role="group" aria-label="Data da campanha" className="flex flex-col gap-2.5">
          <span className={rotulo}>Data</span>
          <div className="flex flex-wrap gap-2">
            {TIPOS_CAMPANHA.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tipo === t}
                onClick={() => escolherTipo(t)}
                className={cx("h-11 rounded-full px-3.5 text-[13px]", escolha(tipo === t))}
              >
                {t === "outra" ? "Outra" : NOMES_CAMPANHA[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={rotulo}>
            Nome da campanha
          </label>
          <input
            id="nome"
            required
            placeholder="Ex.: Festa junina"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={cx(campo, "h-12")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="inicio" className={rotulo}>
              Começa em
            </label>
            <input
              id="inicio"
              type="date"
              required
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className={cx(campo, "h-12 min-w-0 px-3 text-sm [color-scheme:dark]")}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="fim" className={rotulo}>
              Termina em
            </label>
            <input
              id="fim"
              type="date"
              required
              min={inicio || undefined}
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className={cx(campo, "h-12 min-w-0 px-3 text-sm [color-scheme:dark]")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="limite" className={rotulo}>
            Último dia para encomendar
          </label>
          <input
            id="limite"
            type="date"
            value={limite}
            max={fim || undefined}
            onChange={(e) => setLimite(e.target.value)}
            className={cx(campo, "h-12 px-3 text-sm [color-scheme:dark]")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="frase" className={rotulo}>
            Frase do banner
          </label>
          <textarea
            id="frase"
            rows={2}
            placeholder="Ex.: Encomende até 20/12"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            className={cx(campo, "resize-none py-3 leading-normal")}
          />
        </div>

        <div role="group" aria-label="Cor do banner" className="flex flex-col gap-2.5">
          <span className={rotulo}>Cor do banner</span>
          <div className="flex flex-wrap gap-1.5">
            {CORES_BANNER.map((c) => (
              <button
                key={c.hex}
                type="button"
                aria-label={c.nome}
                aria-pressed={cor === c.hex}
                onClick={() => setCor(c.hex)}
                className="flex size-11 items-center justify-center rounded-full"
              >
                <span
                  className={cx(
                    "size-8 rounded-full",
                    cor === c.hex ? "ring-2 ring-dourado ring-offset-[3px] ring-offset-cacau-950" : "ring-1 ring-creme/25",
                  )}
                  style={{ background: c.hex }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Doces da campanha</span>
          <div className={cx(cartao, "flex flex-col overflow-hidden")}>
            {doces.map((d) => {
              const exclusivo = d.ondeAparece === "so_campanhas";
              return (
                <label
                  key={d.id}
                  className="flex min-h-[60px] cursor-pointer items-center gap-3 border-b border-dourado/8 py-2 pr-3.5 pl-2"
                >
                  <span className="fundo-vitrine size-11 shrink-0 overflow-hidden rounded-[10px]">
                    <ImagemDoce doce={d} tamanhos="44px" />
                  </span>
                  <span className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="text-sm leading-tight font-semibold">{d.nome}</span>
                    <span className={cx("text-[11px]", exclusivo ? "text-pessego" : "text-creme-400")}>
                      {exclusivo ? "Só em campanhas" : "Do cardápio"}
                      {d.sobEncomenda && " · sob encomenda"}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={docesIds.includes(d.id)}
                    onChange={() =>
                      setDocesIds((ids) => (ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id]))
                    }
                    className="size-[22px] shrink-0 accent-dourado"
                  />
                </label>
              );
            })}
            <Link
              href="/painel/doces/novo"
              className="flex min-h-[52px] items-center justify-center gap-2 text-sm font-bold text-dourado"
            >
              <IconeMais tamanho={18} />
              Criar doce só para esta campanha
            </Link>
          </div>
          <span className="text-xs text-creme-400">
            {docesIds.length} {docesIds.length === 1 ? "doce aparece" : "doces aparecem"} quando a cliente filtra pela campanha
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Como aparece na vitrine</span>
          <div className="relative h-[150px] overflow-hidden rounded-[28px] border border-dourado/25 transition-colors" style={{ background: cor }}>
            <div className="absolute -top-12 -right-10 size-[220px] rounded-full bg-[radial-gradient(closest-side,rgba(240,207,152,0.3),rgba(240,207,152,0))]" />
            {docePrevia && (
              <div className="fundo-vitrine absolute top-5 right-4 w-[108px] -rotate-4 overflow-hidden rounded-[22px] border-[3px] border-pessego">
                <ImagemDoce doce={docePrevia} tamanhos="108px" />
              </div>
            )}
            <div className="absolute top-4 bottom-4 left-[18px] flex w-[200px] flex-col gap-1">
              <span className="text-[11px] font-bold tracking-[0.14em] text-[#F0CF98] uppercase">{nomeDoTipo}</span>
              <span className="font-display text-[22px] leading-tight font-semibold text-[#FFF4E6]">{nome || "Nome da campanha"}</span>
              <span className="text-xs leading-snug text-[#F6DCCB]">{frase || "Frase do banner"}</span>
              <span className="mt-auto inline-flex h-9 items-center self-start rounded-full bg-pessego px-3.5 text-xs font-bold text-cacau-900">
                Ver doces da campanha
              </span>
            </div>
          </div>
          <span className="text-xs text-creme-400">
            {inicio && fim
              ? `No ar de ${formatarData(inicio)} a ${formatarData(fim)}${limite ? `. Encomendas até ${formatarData(limite)}.` : "."}`
              : "Escolha o período para a campanha entrar no ar sozinha."}
          </span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-24 max-w-md items-center border-t border-dourado/14 bg-cacau-950/90 px-5 pt-3.5 pb-6 backdrop-blur-lg">
        <button type="submit" disabled={salvando} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {salvando ? "Salvando…" : "Salvar campanha"}
        </button>
      </div>
    </form>
  );
}
