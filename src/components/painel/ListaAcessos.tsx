"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import type { Acesso } from "@/lib/auth";
import { linkWhatsAppSemContato } from "@/lib/loja";
import { PAPEIS, type Papel } from "@/lib/papeis";
import { formatarData, formatarDiaMes } from "@/lib/regras";
import { sugestaoDeEmail } from "@/lib/texto";
import { adicionarAcesso, gerarSenhaNova, mudarPapel, removerAcesso, type Convite, type Resultado } from "@/app/painel/acoes";
import { IconeChave, IconeConversa, IconeCopiar, IconeFechar, IconeLixo } from "../Icones";
import { botaoPrimario, botaoWhatsApp, campo, cartao, cx, escolha, rotulo } from "../ui";
import { CabecalhoPainel, FaixaAviso, FaixaDemo, tentar, useAviso, useConfirmacao, useErroDeCampo } from "./comum";

// Situação da senha de cada pessoa, para quem administra saber quem já entrou.
function situacao(a: Acesso): { texto: string; alerta: boolean } {
  if (!a.temSenha) return { texto: "Ainda não tem senha · toque em Gerar senha nova", alerta: true };
  if (a.trocarSenha && a.provisoriaVence) {
    const vence = formatarDiaMes(a.provisoriaVence);
    if (a.provisoriaVencida) return { texto: `A senha provisória venceu em ${vence} · gere outra`, alerta: true };
    return { texto: `${a.ultimoAcesso ? "Ainda não criou a senha" : "Ainda não entrou"} · provisória vence ${vence}`, alerta: true };
  }
  if (a.trocarSenha) return { texto: "Ainda não criou a senha nova", alerta: true };
  return { texto: a.ultimoAcesso ? `Último acesso em ${formatarData(a.ultimoAcesso)}` : "Ainda não entrou", alerta: false };
}

function mensagemDoConvite(c: Convite, enderecoPainel: string): string {
  return [
    `Oi, ${c.nome}! Seu acesso ao painel da Mone Brigaderia está pronto.`,
    "",
    `Entre em: ${enderecoPainel}`,
    `E-mail: ${c.email}`,
    `Senha provisória: ${c.senha}`,
    "",
    `A senha provisória vale 7 dias (até ${formatarDiaMes(c.vence)}). No primeiro acesso, o painel pede para você criar a sua senha.`,
  ].join("\n");
}

export function ListaAcessos({
  acessos,
  meuId,
  demo,
  enderecoPainel,
}: {
  acessos: Acesso[];
  meuId: number;
  demo: boolean;
  enderecoPainel: string;
}) {
  const router = useRouter();
  const [aviso, mostrarAviso, mostrarResultado] = useAviso();
  const [confirmacao, perguntar] = useConfirmacao();
  const erroCampo = useErroDeCampo();
  const [ocupado, iniciar] = useTransition();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("equipe");
  // E-mail que parece ter erro de digitação: pergunta antes de dar acesso.
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [convite, setConvite] = useState<Convite | null>(null);
  const [copiado, setCopiado] = useState(false);
  const cartaoConvite = useRef<HTMLDivElement>(null);
  const naAdministracao = acessos.filter((a) => a.papel === "admin").length;

  // Executa a ação, mostra o resultado (ou o cartão com a senha provisória) e recarrega a lista.
  function executar(acao: () => Promise<Resultado>, depois?: () => void) {
    iniciar(async () => {
      const resultado = await tentar(acao);
      if (resultado.convite) {
        setConvite(resultado.convite);
        setCopiado(false);
        const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() => cartaoConvite.current?.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" }));
      } else {
        mostrarResultado(resultado, () => executar(acao, depois));
        if (!resultado.ok && resultado.campo) erroCampo.marcar(resultado.campo, resultado.mensagem);
      }
      if (resultado.ok) {
        depois?.();
        router.refresh();
      }
    });
  }

  async function darAcesso(emailFinal: string) {
    setSugestao(null);
    const quem = nome.trim() || "Essa pessoa";
    if (
      papel === "admin" &&
      !(await perguntar({
        titulo: `Dar Administração para ${quem}?`,
        texto: `${quem} vai poder fazer tudo, inclusive tirar o seu acesso.`,
        confirmar: "Confirmar",
      }))
    ) {
      return;
    }
    executar(
      () => adicionarAcesso({ nome, email: emailFinal, papel }),
      () => {
        setNome("");
        setEmail("");
        setPapel("equipe");
      },
    );
  }

  function adicionar(e: FormEvent) {
    e.preventDefault();
    const sugerido = sugestaoDeEmail(email);
    if (sugerido) setSugestao(sugerido);
    else void darAcesso(email);
  }

  async function mudar(a: Acesso, novo: Papel) {
    if (a.papel === novo) return;
    const quem = a.nome || a.email;
    const souEu = a.id === meuId;
    if (souEu && !(await perguntar({ titulo: "Mudar o seu próprio acesso?", texto: "Você vai perder a tela de Acessos.", confirmar: "Confirmar" }))) {
      return;
    }
    if (
      !souEu &&
      novo === "admin" &&
      !(await perguntar({ titulo: `Dar Administração para ${quem}?`, texto: `${quem} vai poder fazer tudo, inclusive tirar o seu acesso.`, confirmar: "Confirmar" }))
    ) {
      return;
    }
    iniciar(async () => {
      const resultado = await tentar(() => mudarPapel(a.id, novo));
      if (!resultado.ok) return mostrarResultado(resultado, () => void mudar(a, novo));
      if (souEu) return router.push("/painel");
      router.refresh();
      mostrarAviso(resultado.mensagem, true, { rotulo: "Desfazer", aoTocar: () => executar(() => mudarPapel(a.id, a.papel)) });
    });
  }

  async function remover(a: Acesso) {
    const quem = a.nome || a.email;
    const souEu = a.id === meuId;
    const sim = await perguntar(
      souEu
        ? {
            titulo: "Remover o seu próprio acesso?",
            texto: "Você sai do painel e só volta se alguém da Administração der acesso de novo.",
            confirmar: "Remover",
            perigo: true,
          }
        : { titulo: `Remover o acesso de ${quem}?`, texto: `${quem} sai do painel na hora e não consegue mais entrar.`, confirmar: "Remover", perigo: true },
    );
    if (sim) executar(() => removerAcesso(a.id));
  }

  async function gerarSenha(a: Acesso) {
    const quem = a.nome || a.email;
    if (
      a.temSenha &&
      !(await perguntar({
        titulo: `Gerar senha nova para ${quem}?`,
        texto: `A senha de agora deixa de valer e ${quem} sai do painel nos aparelhos em que estiver. Depois, mande a senha provisória pelo WhatsApp.`,
        confirmar: "Gerar senha nova",
      }))
    ) {
      return;
    }
    executar(() => gerarSenhaNova(a.id));
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      mostrarAviso("Não deu para copiar aqui. Segure o dedo sobre a senha para copiar.", false);
    }
  }

  return (
    <div className="pb-10">
      {aviso}
      {confirmacao}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel titulo="Acessos" subtitulo="Quem pode entrar no painel" voltar="/painel" />

      <div className="flex flex-col gap-[22px] px-5 pt-3.5">
        <p className="text-[13px] leading-relaxed text-creme-200">
          Escreva o nome e o e-mail da pessoa e escolha o que ela pode fazer. O app cria uma senha provisória para você mandar pelo
          WhatsApp. No primeiro acesso, a pessoa cria a própria senha.
        </p>

        {naAdministracao === 1 && (
          <FaixaAviso>
            <strong>Recomendado: ter 2 pessoas na Administração.</strong> Assim uma gera senha nova para a outra se alguém esquecer.
          </FaixaAviso>
        )}

        {convite && (
          <div
            ref={cartaoConvite}
            role="status"
            className="flex scroll-mt-4 flex-col gap-3 rounded-[20px] border-2 border-menta/50 bg-cacau-800 p-4"
          >
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 grow flex-col gap-1">
                <span className="text-[13px] font-semibold text-menta">Senha provisória de {convite.nome}</span>
                <span className="font-mono text-[28px] leading-tight font-bold tracking-wide break-all text-creme select-all">
                  {convite.senha}
                </span>
                <span className="text-[13px] leading-snug text-creme-200">
                  Vale 7 dias (até {formatarDiaMes(convite.vence)}). A senha só aparece agora: mande o convite antes de fechar.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConvite(null)}
                aria-label="Fechar o cartão da senha provisória"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-creme-400"
              >
                <IconeFechar tamanho={20} />
              </button>
            </div>
            <a
              href={linkWhatsAppSemContato(mensagemDoConvite(convite, enderecoPainel))}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(botaoWhatsApp, "h-[52px] text-[15px]")}
            >
              <IconeConversa tamanho={20} strokeWidth={2} />
              Mandar convite pelo WhatsApp
            </a>
            <button
              type="button"
              onClick={() => copiar(mensagemDoConvite(convite, enderecoPainel))}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-dourado/30 text-[15px] font-bold text-dourado"
            >
              <IconeCopiar tamanho={18} />
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
        )}

        <form onSubmit={adicionar} className={cx(cartao, "flex flex-col gap-3.5 p-4")}>
          <h2 className="font-display text-xl font-semibold">Adicionar pessoa</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className={rotulo}>
              Nome
            </label>
            <input
              id="nome"
              required
              maxLength={120}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="ex.: Ana da cozinha"
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
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={rotulo}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              placeholder="ex.: seunome@email.com"
              aria-describedby="ajuda-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSugestao(null);
                erroCampo.limpar("email");
              }}
              {...erroCampo.props("email")}
              className={cx(campo, "h-12", erroCampo.classe("email"))}
            />
            {erroCampo.texto("email")}
            <span id="ajuda-email" className="text-xs text-creme-400">
              Qualquer e-mail serve: Gmail, Hotmail, Outlook, iCloud…
            </span>
          </div>
          {sugestao && (
            <div role="alert" className="flex flex-col gap-2.5 rounded-2xl border border-pessego/40 bg-pessego/12 p-3.5">
              <span className="text-sm leading-snug font-semibold text-pessego">
                Você quis dizer <strong className="break-all">{sugestao}</strong>?
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(sugestao);
                    void darAcesso(sugestao);
                  }}
                  className="h-11 rounded-full bg-pessego px-4 text-sm font-bold text-cacau-900"
                >
                  Sim, corrigir
                </button>
                <button
                  type="button"
                  onClick={() => void darAcesso(email)}
                  className="h-11 rounded-full border border-pessego/50 px-4 text-sm font-bold text-pessego"
                >
                  Não, está certo
                </button>
              </div>
            </div>
          )}
          <div role="group" aria-label="O que a pessoa pode fazer" className="flex flex-col gap-2">
            <span className={rotulo}>Pode fazer</span>
            {PAPEIS.map((p) => (
              <button
                key={p.valor}
                type="button"
                aria-pressed={papel === p.valor}
                onClick={() => setPapel(p.valor)}
                className={cx("flex flex-col items-start gap-0.5 rounded-2xl px-3.5 py-3 text-left", escolha(papel === p.valor))}
              >
                <span className="text-sm font-bold text-creme">{p.nome}</span>
                <span className="text-xs font-normal text-creme-400">{p.descricao}</span>
              </button>
            ))}
          </div>
          <button type="submit" disabled={ocupado || sugestao !== null} className={cx(botaoPrimario, "disabled:opacity-60")}>
            {ocupado ? "Salvando…" : "Dar acesso"}
          </button>
        </form>

        <section className="flex flex-col gap-2.5">
          <h2 className={rotulo}>
            {acessos.length} {acessos.length === 1 ? "pessoa tem acesso" : "pessoas têm acesso"}
          </h2>
          {acessos.map((a) => {
            const souEu = a.id === meuId;
            const quem = a.nome || a.email;
            const { texto, alerta } = situacao(a);
            return (
              <div key={a.id} className={cx(cartao, "flex flex-col gap-2.5 p-3.5")}>
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-base font-bold">
                      <span className="truncate">{quem}</span>
                      {souEu && <span className="shrink-0 rounded-full bg-dourado/15 px-2 py-0.5 text-[10px] font-bold text-dourado">você</span>}
                    </span>
                    {a.nome && <span className="truncate text-[13px] text-creme-400">{a.email}</span>}
                    <span className={cx("text-xs leading-snug", alerta ? "text-pessego" : "text-creme-600")}>{texto}</span>
                  </div>
                  {!a.fixo && (
                    <button
                      type="button"
                      disabled={ocupado}
                      aria-label={`Remover o acesso de ${quem}`}
                      onClick={() => void remover(a)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-creme-400 active:scale-90 disabled:opacity-50"
                    >
                      <IconeLixo tamanho={20} />
                    </button>
                  )}
                </div>
                {a.fixo ? (
                  <div className="flex flex-col items-start gap-1">
                    <span className="rounded-full border border-dourado/40 bg-dourado/14 px-3 py-1 text-xs font-bold text-dourado">
                      Administração fixa
                    </span>
                    <span className="text-xs leading-snug text-creme-400">Configurada no servidor. Para mudar, fale com quem cuida do site.</span>
                  </div>
                ) : (
                  <div role="group" aria-label={`O que ${quem} pode fazer`} className="grid grid-cols-3 gap-1.5">
                    {PAPEIS.map((p) => (
                      <button
                        key={p.valor}
                        type="button"
                        disabled={ocupado}
                        aria-pressed={a.papel === p.valor}
                        onClick={() => void mudar(a, p.valor)}
                        className={cx("h-11 rounded-xl px-1 text-[13px]", escolha(a.papel === p.valor))}
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
                {!souEu && (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => void gerarSenha(a)}
                    className="flex h-11 items-center justify-center gap-2 self-start rounded-full border border-dourado/25 px-4 text-[13px] font-bold text-dourado disabled:opacity-50"
                  >
                    <IconeChave tamanho={18} />
                    Gerar senha nova
                  </button>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
