"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Resultado } from "@/app/painel/acoes";
import { IconeAlerta, IconeCheck, IconeFechar, IconeMais, IconeMenos } from "../Icones";
import { botaoPrimario, botaoRedondo, cx } from "../ui";

export interface AcaoDoAviso {
  rotulo: string;
  aoTocar?: () => void;
  href?: string;
}

interface Aviso {
  texto: string;
  deuCerto: boolean;
  acao?: AcaoDoAviso;
}

// Endereço para entrar de novo e voltar para esta mesma página.
function linkEntrarDeNovo(): string {
  const volta = window.location.pathname + window.location.search;
  return `/entrar?motivo=expirou&volta=${encodeURIComponent(volta)}`;
}

// "Entrar de novo" sai da página sem perguntar "Sair sem salvar?": o rascunho de O que
// tem hoje fica guardado no celular e volta depois de entrar.
let saidaLiberada = false;

function semAnimacao(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Caixa do aviso, presa no alto da tela.
function CaixaAviso({ aviso, aoFechar }: { aviso: Aviso; aoFechar: () => void }) {
  return (
    <div
      role={aviso.deuCerto ? "status" : "alert"}
      className={cx(
        "fixed inset-x-4 top-[calc(18px+env(safe-area-inset-top))] z-50 mx-auto flex max-w-[calc(28rem-2rem)] animate-entra flex-col gap-2 rounded-[18px] py-3 pr-1.5 pl-4 text-sm font-bold shadow-2xl",
        aviso.deuCerto ? "bg-menta text-cacau-950" : "border-2 border-[#8a2a22] bg-rosa text-cacau-950",
      )}
    >
      <div className="flex items-center gap-2.5">
        {aviso.deuCerto ? (
          <IconeCheck tamanho={22} className="shrink-0 text-[#1d5a29]" />
        ) : (
          <IconeAlerta tamanho={28} className="shrink-0 text-[#8a2a22]" />
        )}
        <span className="grow leading-snug">{aviso.texto}</span>
        <button type="button" onClick={aoFechar} aria-label="Fechar o aviso" className="flex size-11 shrink-0 items-center justify-center rounded-full">
          <IconeFechar tamanho={20} />
        </button>
      </div>
      {aviso.acao && (
        <div className="flex justify-end pr-2.5">
          {aviso.acao.href ? (
            <a
              href={aviso.acao.href}
              data-sair-livre=""
              onClick={() => (saidaLiberada = true)}
              className="flex h-11 items-center rounded-full bg-cacau-950 px-5 text-sm font-bold text-creme"
            >
              {aviso.acao.rotulo}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                aoFechar();
                aviso.acao?.aoTocar?.();
              }}
              className="flex h-11 items-center rounded-full bg-cacau-950 px-5 text-sm font-bold text-creme"
            >
              {aviso.acao.rotulo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Aviso no topo da tela. O de sucesso some sozinho; o de erro fica até a pessoa
// fechar e, quando dá, traz o que fazer ("Tentar de novo", "Entrar de novo").
export function useAviso(): [
  ReactNode,
  (texto: string, deuCerto?: boolean, acao?: AcaoDoAviso) => void,
  (resultado: Resultado, tentarDeNovo?: () => void) => void,
] {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fechar = useCallback(() => {
    clearTimeout(timer.current);
    setAviso(null);
  }, []);
  const mostrar = useCallback((texto: string, deuCerto = true, acao?: AcaoDoAviso) => {
    setAviso({ texto, deuCerto, acao });
    clearTimeout(timer.current);
    if (deuCerto) timer.current = setTimeout(() => setAviso(null), acao ? 6000 : 5000);
  }, []);
  const mostrarResultado = useCallback(
    (resultado: Resultado, tentarDeNovo?: () => void) => {
      if (resultado.ok) return mostrar(resultado.mensagem, true);
      if (resultado.motivo === "sessao") return mostrar(resultado.mensagem, false, { rotulo: "Entrar de novo", href: linkEntrarDeNovo() });
      const repetir = (resultado.motivo === "rede" || resultado.motivo === "servidor") && tentarDeNovo;
      mostrar(resultado.mensagem, false, repetir ? { rotulo: "Tentar de novo", aoTocar: tentarDeNovo } : undefined);
    },
    [mostrar],
  );
  // Página escondida pelo Next (Activity) ao navegar: o aviso não volta junto com ela.
  useLayoutEffect(
    () => () => {
      clearTimeout(timer.current);
      setAviso(null);
    },
    [],
  );

  const elemento = aviso ? <CaixaAviso aviso={aviso} aoFechar={fechar} /> : null;
  return [elemento, mostrar, mostrarResultado];
}

// Aviso que atravessa a navegação ("Salvar e sair"): a tela que salvou fica escondida,
// então o aviso aparece pelo layout do painel (AvisoDoPainel).
const avisoDeSaida = { texto: null as string | null, ouvintes: new Set<() => void>(), timer: undefined as ReturnType<typeof setTimeout> | undefined };
function mudarAvisoDeSaida(texto: string | null) {
  clearTimeout(avisoDeSaida.timer);
  avisoDeSaida.texto = texto;
  // Some sozinho, mesmo se a pessoa saiu do painel (não volta depois, fora de hora).
  if (texto) avisoDeSaida.timer = setTimeout(() => mudarAvisoDeSaida(null), 5000);
  avisoDeSaida.ouvintes.forEach((o) => o());
}
function assinarAvisoDeSaida(ouvinte: () => void) {
  avisoDeSaida.ouvintes.add(ouvinte);
  return () => avisoDeSaida.ouvintes.delete(ouvinte);
}

export function avisarNaProximaTela(texto: string) {
  mudarAvisoDeSaida(texto);
}

export function AvisoDoPainel() {
  const texto = useSyncExternalStore(assinarAvisoDeSaida, () => avisoDeSaida.texto, () => null);
  return texto ? <CaixaAviso aviso={{ texto, deuCerto: true }} aoFechar={() => mudarAvisoDeSaida(null)} /> : null;
}

// Chama uma ação do servidor. Se a internet cair (ou o servidor não responder),
// devolve um erro com motivo, para o aviso oferecer "Tentar de novo".
export async function tentar(acao: () => Promise<Resultado>): Promise<Resultado> {
  try {
    return await acao();
  } catch (erro) {
    // Redirecionamentos do Next seguem adiante.
    if (typeof erro === "object" && erro && "digest" in erro && String(erro.digest).startsWith("NEXT_")) throw erro;
    if (!navigator.onLine || erro instanceof TypeError) {
      return { ok: false, motivo: "rede", mensagem: "Parece que a internet caiu. Confira o Wi-Fi ou os dados do celular e tente de novo." };
    }
    return { ok: false, motivo: "servidor", mensagem: "Não deu para falar com o servidor agora. Tente de novo em instantes." };
  }
}

// Faixa que explica alguma coisa e só sai quando a pessoa fecha.
export function FaixaAviso({ children, aoFechar }: { children: ReactNode; aoFechar?: () => void }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 py-2 pr-1 pl-3.5 text-[13px] leading-relaxed text-pessego">
      <IconeAlerta tamanho={20} className="mt-1.5 shrink-0" />
      <div className="grow py-1.5">{children}</div>
      {aoFechar && (
        <button type="button" onClick={aoFechar} aria-label="Fechar o aviso" className="flex size-11 shrink-0 items-center justify-center rounded-full">
          <IconeFechar tamanho={18} />
        </button>
      )}
    </div>
  );
}

export interface Pergunta {
  titulo: string;
  texto?: string;
  confirmar: string;
  // Botão de confirmar em rosa, para o que não tem volta.
  perigo?: boolean;
}

// Folha que sobe de baixo, feita com o <dialog> do navegador: prende o foco, fecha no
// Esc e no toque fora. Os botões de dentro fecham chamando aoFechar.
function Folha({ aberta, aoFechar, titulo, children }: { aberta: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberta && !dialogo.open) dialogo.showModal();
    if (!aberta && dialogo.open) dialogo.close();
    // Página escondida pelo Next (Activity) com a folha aberta: tira da camada de cima.
    return () => dialogo.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby={titulo}
      className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-md rounded-t-[32px] border-0 border-t border-dourado/20 bg-cacau-900 p-0 text-creme backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {aberta && (
        <div className="flex flex-col gap-4 px-[22px] pt-[26px] pb-[max(28px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      )}
    </dialog>
  );
}

// Folha de confirmação do próprio app (no lugar do window.confirm).
export function FolhaConfirmacao({
  pergunta,
  aoConfirmar,
  aoFechar,
}: {
  pergunta: Pergunta | null;
  aoConfirmar: () => void;
  aoFechar: () => void;
}) {
  return (
    <Folha aberta={pergunta !== null} aoFechar={aoFechar} titulo="folha-titulo">
      {pergunta && (
        <>
          <h2 id="folha-titulo" className="font-display text-2xl leading-tight font-semibold">
            {pergunta.titulo}
          </h2>
          {pergunta.texto && <p className="text-[15px] leading-relaxed text-creme-200">{pergunta.texto}</p>}
          <div className="mt-1 flex flex-col gap-2.5">
            <button
              type="button"
              autoFocus
              onClick={aoConfirmar}
              className={pergunta.perigo ? botaoPrimario.replace("bg-dourado text-cacau-900", "bg-rosa text-cacau-950") : botaoPrimario}
            >
              {pergunta.confirmar}
            </button>
            <button type="button" onClick={aoFechar} className="h-[54px] rounded-full border border-dourado/30 text-base font-bold text-dourado">
              Cancelar
            </button>
          </div>
        </>
      )}
    </Folha>
  );
}

// Jeito fácil de perguntar: `if (await perguntar({ ... })) fazerAlgo()`.
export function useConfirmacao(): [ReactNode, (pergunta: Pergunta) => Promise<boolean>] {
  const [atual, setAtual] = useState<{ pergunta: Pergunta; responder: (sim: boolean) => void } | null>(null);
  const perguntar = useCallback(
    (pergunta: Pergunta) => new Promise<boolean>((responder) => setAtual({ pergunta, responder })),
    [],
  );
  const elemento = (
    <FolhaConfirmacao
      pergunta={atual?.pergunta ?? null}
      aoConfirmar={() => {
        atual?.responder(true);
        setAtual(null);
      }}
      aoFechar={() => {
        atual?.responder(false);
        setAtual(null);
      }}
    />
  );
  return [elemento, perguntar];
}

// Telas à vista com alterações não salvas (o Sair do Menu avisa que elas se perdem).
let telasComAlteracoes = 0;
export function haAlteracoesPendentes(): boolean {
  return telasComAlteracoes > 0;
}

// Alterações que ainda não foram salvas (Novo/Editar doce, Nova/Editar campanha e O que
// tem hoje). Ao tocar em Voltar ou em qualquer link do app (também os do Menu), pergunta
// "Sair sem salvar?"; ao recarregar ou fechar a aba, quem pergunta é o navegador. salvar()
// devolve true quando salvou: aí a tela segue para onde a pessoa ia. descartar() desfaz o
// que mudou.
export function useAlteracoesPendentes(
  sujo: boolean,
  { salvar, descartar }: { salvar: () => Promise<boolean>; descartar?: () => void },
): ReactNode {
  const router = useRouter();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    if (!sujo) return;
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (saidaLiberada) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // Na fase de captura, antes do <Link> do Next: segura o toque e pergunta.
    const aoTocar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || link.hasAttribute("data-sair-livre")) return;
      if (link.target && link.target !== "_self") return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      // Link de dentro de uma folha aberta (o Menu): a folha fecha antes da pergunta.
      const folha = link.closest("dialog");
      if (folha?.open) folha.close();
      setDestino(url.pathname + url.search + url.hash);
    };
    telasComAlteracoes++;
    window.addEventListener("beforeunload", antesDeSair);
    window.addEventListener("click", aoTocar, true);
    return () => {
      telasComAlteracoes--;
      window.removeEventListener("beforeunload", antesDeSair);
      window.removeEventListener("click", aoTocar, true);
    };
  }, [sujo]);

  return (
    <Folha aberta={destino !== null} aoFechar={() => setDestino(null)} titulo="sair-titulo">
      <div className="flex items-start gap-2">
        <h2 id="sair-titulo" className="grow pt-1.5 font-display text-2xl leading-tight font-semibold">
          Sair sem salvar?
        </h2>
        <button type="button" onClick={() => setDestino(null)} aria-label="Continuar editando" className={botaoRedondo}>
          <IconeFechar tamanho={20} />
        </button>
      </div>
      <p className="text-[15px] leading-relaxed text-creme-200">Você perde o que mudou.</p>
      <div className="mt-1 flex flex-col gap-2.5">
        <button
          type="button"
          autoFocus
          onClick={async () => {
            const para = destino;
            setDestino(null);
            // Espera a folha fechar: salvar pode abrir outra pergunta ("Publicar sem foto?").
            await new Promise((pronto) => setTimeout(pronto, 0));
            if (para && (await salvar())) router.push(para);
          }}
          className={botaoPrimario}
        >
          Salvar e sair
        </button>
        <button
          type="button"
          onClick={() => {
            const para = destino;
            setDestino(null);
            descartar?.();
            if (para) router.push(para);
          }}
          className="h-[54px] rounded-full border border-rosa/50 text-base font-bold text-rosa"
        >
          Sair sem salvar
        </button>
      </div>
    </Folha>
  );
}

// Volta a tela escondida pelo Next (Activity) ao estado inicial quando ela sai de vista:
// depois de "Sair sem salvar" ou de criar um doce ou campanha nova. Uso: marcar() e
// navegar; quem chama recria o formulário em reiniciar() (com uma key nova).
export function useReiniciarAoSair(reiniciar: () => void): () => void {
  const marcado = useRef(false);
  useLayoutEffect(
    () => () => {
      if (!marcado.current) return;
      marcado.current = false;
      reiniciar();
    },
    [reiniciar],
  );
  return useCallback(() => {
    marcado.current = true;
  }, []);
}

// Linha da barra fixa quando há alterações não salvas.
export function AvisoNaoSalvo({ sujo }: { sujo: boolean }) {
  return sujo ? <span className="text-center text-xs font-bold text-dourado">• alterações não salvas</span> : null;
}

// Erro num campo do formulário (da conferência da tela ou do servidor, que devolve o
// campo): borda rosa, texto embaixo do campo e a tela rola até ele.
export function useErroDeCampo() {
  const [erro, setErro] = useState<{ campo: string; texto: string } | null>(null);
  const marcar = useCallback((campo: string, texto: string) => {
    setErro({ campo, texto });
    requestAnimationFrame(() => {
      // O Next guarda telas escondidas na página (Activity): pega o campo que está à vista.
      const elemento = [...document.querySelectorAll<HTMLElement>(`#${CSS.escape(campo)}`)].find((e) => e.getClientRects().length > 0);
      if (!elemento) return;
      elemento.scrollIntoView({ block: "center", behavior: semAnimacao() ? "auto" : "smooth" });
      elemento.focus({ preventScroll: true });
    });
  }, []);
  const limpar = useCallback((campo?: string) => setErro((atual) => (atual && (!campo || atual.campo === campo) ? null : atual)), []);
  return {
    erro,
    marcar,
    limpar,
    // aria-invalid e a ligação com o texto do erro.
    props: (campo: string) => (erro?.campo === campo ? { "aria-invalid": true, "aria-describedby": `${campo}-erro` } : {}),
    // Borda destacada (anel, para não brigar com a borda do campo).
    classe: (campo: string) => (erro?.campo === campo ? "ring-2 ring-rosa" : ""),
    texto: (campo: string) =>
      erro?.campo === campo ? (
        <span id={`${campo}-erro`} className="text-xs leading-snug font-bold text-rosa">
          {erro.texto}
        </span>
      ) : null,
  };
}

// Apaga do celular o rascunho de O que tem hoje (ao sair do painel).
export function apagarRascunhosDoEstoque() {
  try {
    for (const chave of Object.keys(localStorage)) if (chave.startsWith("mone:estoque:")) localStorage.removeItem(chave);
  } catch {
    // Sem armazenamento: não há rascunho guardado.
  }
}

// Faixa no topo do painel quando o banco não está configurado.
export function FaixaDemo({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <p className="bg-pessego px-5 py-2 text-center text-xs font-semibold text-cacau-900">
      Painel em modo demonstração: as alterações não ficam salvas.
    </p>
  );
}

// − n + do painel, com botões de 48 px. Tocar no número abre o teclado numérico com o
// número selecionado, para digitar direto (texto: mostra um texto fixo, sem digitar).
export function Contador({
  valor,
  aoMudar,
  minimo = 0,
  maximo = 999,
  rotulo,
  texto,
  id,
  className,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  minimo?: number;
  maximo?: number;
  rotulo: string;
  texto?: string;
  id?: string;
  className?: string;
}) {
  // O que a pessoa está digitando (pode ficar vazio enquanto digita).
  const [digitado, setDigitado] = useState<string | null>(null);
  const mudar = (v: number) => aoMudar(Math.min(maximo, Math.max(minimo, v)));
  return (
    <div
      role="group"
      aria-label={rotulo}
      // Com texto fixo, o id fica no grupo (para a tela rolar até ele num erro).
      id={texto ? id : undefined}
      tabIndex={texto && id ? -1 : undefined}
      className={cx("flex h-12 shrink-0 items-center rounded-full border border-dourado/22", className)}
    >
      <button
        type="button"
        aria-label={`Diminuir: ${rotulo}`}
        onClick={() => mudar(valor - 1)}
        className="flex size-12 items-center justify-center rounded-full active:scale-90"
      >
        <IconeMenos tamanho={18} />
      </button>
      {texto ? (
        <span aria-live="polite" className="min-w-14 text-center text-[15px] font-bold">
          {texto}
        </span>
      ) : (
        <>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="done"
            autoComplete="off"
            aria-label={rotulo}
            value={digitado ?? String(valor)}
            onFocus={(e) => {
              const campo = e.currentTarget;
              setDigitado(String(valor));
              campo.select();
              // De novo depois do toque (no iPhone, soltar o dedo desfaz a seleção).
              requestAnimationFrame(() => campo.select());
            }}
            onChange={(e) => {
              const limpo = e.target.value.replace(/\D/g, "").slice(0, String(maximo).length);
              setDigitado(limpo);
              if (limpo) mudar(Number(limpo));
            }}
            onBlur={() => setDigitado(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className={cx(
              "h-11 w-14 rounded-lg bg-transparent text-center text-xl font-bold outline-none focus:bg-creme/[0.08]",
              valor === 0 && digitado === null && "text-creme-400",
            )}
          />
          <span aria-live="polite" className="sr-only">
            {digitado === null ? `${rotulo}: ${valor}` : ""}
          </span>
        </>
      )}
      <button
        type="button"
        aria-label={`Aumentar: ${rotulo}`}
        onClick={() => mudar(valor + 1)}
        className="flex size-12 items-center justify-center rounded-full active:scale-90"
      >
        <IconeMais tamanho={18} />
      </button>
    </div>
  );
}

export function Chave({ ligada, aoMudar, rotulo }: { ligada: boolean; aoMudar: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={aoMudar}
      className="flex h-11 w-[60px] shrink-0 items-center justify-center"
    >
      <span className={cx("relative h-[30px] w-[50px] rounded-full transition-colors", ligada ? "bg-[#3F8F4E]" : "bg-cacau-700")}>
        <span
          className={cx(
            "absolute top-[3px] size-6 rounded-full bg-creme shadow-md transition-[left]",
            ligada ? "left-[23px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}
