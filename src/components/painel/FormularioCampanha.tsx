"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import type { Campanha, Doce, TipoCampanha } from "@/lib/tipos";
import { useHoje } from "@/lib/hooks";
import { CORES_BANNER, TIPOS_CAMPANHA, campanhaDoProximoEvento, sugestaoDeCampanha } from "@/lib/campanhas-modelo";
import { NOMES_CAMPANHA, encomendaAberta, formatarData, nomeCurtoDaCampanha, nomeDoTipoDeCampanha } from "@/lib/regras";
import { BannerCampanha, botaoBanner } from "../BannerCampanha";
import { ImagemDoce } from "../ImagemDoce";
import { IconeMais } from "../Icones";
import { barraFixa, botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { salvarCampanha } from "@/app/painel/acoes";
import {
  AvisoNaoSalvo,
  CabecalhoPainel,
  FaixaAviso,
  FaixaDemo,
  avisarNaProximaTela,
  tentar,
  useAlteracoesPendentes,
  useAviso,
  useConfirmacao,
  useErroDeCampo,
  useReiniciarAoSair,
} from "./comum";

// A frase cabe em duas linhas curtas no banner (o servidor confere o mesmo limite).
const LIMITE_FRASE = 60;

interface Props {
  campanha: Campanha | null;
  tipoInicial: TipoCampanha;
  doces: Doce[];
  campanhas: Campanha[];
  // As datas sugeridas partem de hoje, calculado no servidor.
  hoje: string;
  demo: boolean;
}

// O Next guarda a tela escondida ao navegar (Activity). Depois de "Sair sem salvar" ou de
// criar a campanha, o formulário volta ao estado inicial com uma key nova.
export function FormularioCampanha(props: Props) {
  const [versao, setVersao] = useState(0);
  const reiniciar = useCallback(() => setVersao((v) => v + 1), []);
  return <Formulario key={versao} {...props} reiniciar={reiniciar} />;
}

function Formulario({ campanha, tipoInicial, doces, campanhas, hoje: hojeDoServidor, demo, reiniciar }: Props & { reiniciar: () => void }) {
  const hoje = useHoje(hojeDoServidor);
  const router = useRouter();
  const [aviso, mostrar, mostrarResultado] = useAviso();
  const [confirmacao, perguntar] = useConfirmacao();
  const erroCampo = useErroDeCampo();
  const reiniciarAoSair = useReiniciarAoSair(reiniciar);
  const [salvando, iniciar] = useTransition();
  const [mudandoTipo, setMudandoTipo] = useState(false);
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
  // Retrato do formulário, para saber se há alterações não salvas.
  const retrato = JSON.stringify([tipo, nome, inicio, fim, limite, frase, cor, [...docesIds].sort()]);
  const [retratoSalvo, setRetratoSalvo] = useState(retrato);
  const sujo = retrato !== retratoSalvo;

  // Mudar o tipo muda só o tipo; os textos e as datas do modelo só entram se a pessoa quiser.
  async function escolherTipo(novo: TipoCampanha) {
    setMudandoTipo(false);
    if (novo === tipo) return;
    setTipo(novo);
    const s = sugestaoDeCampanha(novo, hoje);
    if (!s) return;
    const usar = await perguntar({
      titulo: `Usar textos e datas do modelo de ${NOMES_CAMPANHA[novo]}?`,
      texto: "Nome, datas, frase e cor passam a ser os do modelo. Os doces marcados continuam. Se não, só o tipo muda.",
      confirmar: "Usar o modelo",
    });
    if (!usar) return;
    setNome(s.nome);
    setInicio(s.inicio);
    setFim(s.fim);
    setLimite(s.limiteEncomenda);
    setFrase(s.fraseBanner);
    setCor(s.cor);
  }

  function erro(campo: string, texto: string): false {
    erroCampo.marcar(campo, texto);
    mostrar(texto, false);
    return false;
  }

  // Confere, pergunta o que precisa e salva. sair: "Salvar e sair" (o aviso de salvo
  // aparece na próxima tela). Devolve true quando salvou.
  async function salvarCampanhaDaTela(sair: boolean): Promise<boolean> {
    erroCampo.limpar();
    if (!nome.trim()) return erro("nome", "Escreva o nome da campanha.");
    if (!inicio) return erro("inicio", "Preencha o começo da campanha.");
    if (!fim) return erro("fim", "Preencha o fim da campanha.");
    if (
      docesIds.length === 0 &&
      !(await perguntar({
        titulo: "Nenhum doce marcado",
        texto: "A campanha vai aparecer na vitrine sem doces. Salvar mesmo assim?",
        confirmar: "Salvar mesmo assim",
      }))
    ) {
      return false;
    }
    const enviado = retrato;
    const dados = {
      id: campanha?.id ?? null,
      tipo,
      nome,
      inicio,
      fim,
      limiteEncomenda: limite || null,
      fraseBanner: frase,
      cor,
      docesIds,
    };
    return new Promise((pronto) => {
      const enviar = () =>
        iniciar(async () => {
          const resultado = await tentar(() => salvarCampanha(dados));
          if (!resultado.ok) {
            mostrarResultado(resultado, enviar);
            if (resultado.campo) erroCampo.marcar(resultado.campo, resultado.mensagem);
            return pronto(false);
          }
          setRetratoSalvo(enviado);
          // Campanha nova também troca de tela (vai para a edição dela): o aviso vai junto.
          if (sair || !campanha) avisarNaProximaTela(resultado.mensagem);
          else mostrarResultado(resultado);
          if (!campanha) {
            // Da próxima vez, o formulário começa do modelo.
            reiniciarAoSair();
            if (!sair && resultado.id) router.replace(`/painel/campanhas/${resultado.id}`);
          }
          pronto(true);
        });
      enviar();
    });
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    void salvarCampanhaDaTela(false);
  }

  const saida = useAlteracoesPendentes(sujo, { salvar: () => salvarCampanhaDaTela(true), descartar: reiniciarAoSair });

  const docePrevia = doces.find((d) => docesIds.includes(d.id));
  // Já existe campanha deste tipo para a próxima data (ex.: abriu o modelo pelo endereço).
  const repetida = campanha ? null : campanhaDoProximoEvento(tipo, campanhas, hoje);
  const rascunho: Campanha = {
    id: campanha?.id ?? "nova",
    tipo,
    nome: nome || "Nome da campanha",
    inicio,
    fim,
    limiteEncomenda: limite || null,
    fraseBanner: frase || "Frase do banner",
    cor,
    pausada: false,
    rascunho: false,
  };

  return (
    <form onSubmit={salvar} noValidate className="pb-[calc(8rem+env(safe-area-inset-bottom))]">
      {aviso}
      {confirmacao}
      {saida}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel
        titulo={campanha ? "Editar campanha" : "Nova campanha"}
        subtitulo="Só aparece na vitrine dentro do período"
        voltar="/painel/campanhas"
      />

      <div className="flex flex-col gap-5 px-5 pt-3.5 pb-7">
        {repetida && (
          <FaixaAviso>
            Já existe a campanha <strong>{repetida.nome}</strong> ({formatarData(repetida.inicio)} a {formatarData(repetida.fim)}).{" "}
            <Link href={`/painel/campanhas/${repetida.id}`} className="font-bold underline underline-offset-2">
              Abrir essa campanha
            </Link>
          </FaixaAviso>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-bold text-dourado">{nomeDoTipoDeCampanha(tipo)}</span>
            <button
              type="button"
              aria-expanded={mudandoTipo}
              onClick={() => setMudandoTipo(!mudandoTipo)}
              className="flex h-11 shrink-0 items-center px-1 text-[13px] font-semibold text-creme-400 underline underline-offset-4"
            >
              {mudandoTipo ? "Deixar como está" : "Mudar tipo"}
            </button>
          </div>
          {mudandoTipo && (
            <div role="group" aria-label="Tipo da campanha" className="flex flex-wrap gap-2">
              {TIPOS_CAMPANHA.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tipo === t}
                  onClick={() => void escolherTipo(t)}
                  className={cx("h-11 rounded-full px-3.5 text-[13px]", escolha(tipo === t))}
                >
                  {t === "outra" ? "Outra" : NOMES_CAMPANHA[t]}
                </button>
              ))}
            </div>
          )}
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
            onChange={(e) => {
              setNome(e.target.value);
              erroCampo.limpar("nome");
            }}
            {...erroCampo.props("nome")}
            className={cx(campo, "h-12", erroCampo.classe("nome"))}
          />
          {erroCampo.texto("nome")}
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
              onChange={(e) => {
                setInicio(e.target.value);
                erroCampo.limpar("inicio");
              }}
              {...erroCampo.props("inicio")}
              className={cx(campo, "h-12 min-w-0 px-3 [color-scheme:dark]", erroCampo.classe("inicio"))}
            />
            {erroCampo.texto("inicio")}
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
              onChange={(e) => {
                setFim(e.target.value);
                erroCampo.limpar("fim");
              }}
              {...erroCampo.props("fim")}
              className={cx(campo, "h-12 min-w-0 px-3 [color-scheme:dark]", erroCampo.classe("fim"))}
            />
            {erroCampo.texto("fim")}
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
            min={inicio || undefined}
            max={fim || undefined}
            onChange={(e) => {
              setLimite(e.target.value);
              erroCampo.limpar("limite");
            }}
            {...erroCampo.props("limite")}
            className={cx(campo, "h-12 px-3 [color-scheme:dark]", erroCampo.classe("limite"))}
          />
          {erroCampo.texto("limite")}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="frase" className={rotulo}>
              Frase do banner
            </label>
            <span className={cx("text-xs", frase.length >= LIMITE_FRASE ? "text-pessego" : "text-creme-400")}>
              {frase.length}/{LIMITE_FRASE}
            </span>
          </div>
          <textarea
            id="frase"
            rows={2}
            maxLength={LIMITE_FRASE}
            placeholder="Ex.: Caixas e brigadeiros para a ceia"
            value={frase}
            onChange={(e) => {
              setFrase(e.target.value);
              erroCampo.limpar("frase");
            }}
            aria-describedby="frase-ajuda"
            {...erroCampo.props("frase")}
            className={cx(campo, "resize-none py-3 leading-normal", erroCampo.classe("frase"))}
          />
          {erroCampo.texto("frase")}
          <span id="frase-ajuda" className="text-xs text-creme-400">
            O prazo para encomendar aparece sozinho embaixo da frase.
          </span>
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
            {docesIds.length} {docesIds.length === 1 ? "doce aparece" : "doces aparecem"} quando quem compra filtra pela campanha
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Como aparece na vitrine</span>
          <BannerCampanha
            campanha={rascunho}
            prazo={encomendaAberta(rascunho, hoje)}
            doce={docePrevia}
            botao={docesIds.length > 0 && <span className={botaoBanner}>Ver doces de {nomeCurtoDaCampanha(rascunho)}</span>}
          />
          <span className="text-xs text-creme-400">
            {inicio && fim
              ? `No ar de ${formatarData(inicio)} a ${formatarData(fim)}${limite ? `. Encomendas até ${formatarData(limite)}.` : "."}`
              : "Escolha o período para a campanha entrar no ar sozinha."}
          </span>
        </div>
      </div>

      <div className={cx(barraFixa, "flex-col gap-1.5")}>
        <AvisoNaoSalvo sujo={sujo} />
        <button type="submit" disabled={salvando} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {salvando ? "Salvando…" : "Salvar campanha"}
        </button>
      </div>
    </form>
  );
}
