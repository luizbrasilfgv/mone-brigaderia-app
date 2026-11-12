"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { nomeDoPapel, type Papel } from "@/lib/papeis";
import { sair } from "@/app/entrar/acoes";
import { sairDeTodos, salvarNome, trocarSenha } from "@/app/painel/acoes";
import { CampoSenha } from "../CampoSenha";
import { IconeCheck } from "../Icones";
import { botaoPrimario, campo, cartao, cx, rotulo } from "../ui";
import { FaixaDemo, apagarRascunhosDoEstoque, tentar, useAviso, useConfirmacao, useErroDeCampo } from "./comum";
import { CabecalhoPainel } from "./Menu";

// Minha conta: nome, troca de senha e saída deste celular ou de todos os aparelhos.
export function MinhaConta({ nome: nomeInicial, email, papel, demo }: { nome: string; email: string; papel: Papel; demo: boolean }) {
  const router = useRouter();
  const [aviso, , mostrarResultado] = useAviso();
  const [confirmacao, perguntar] = useConfirmacao();
  const erroCampo = useErroDeCampo();
  const [ocupado, iniciar] = useTransition();
  const [nome, setNome] = useState(nomeInicial);
  const [nomeSalvo, setNomeSalvo] = useState(nomeInicial);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [senhaTrocada, setSenhaTrocada] = useState(false);

  function guardarNome(e: FormEvent) {
    e.preventDefault();
    const executar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarNome(nome));
        mostrarResultado(resultado, executar);
        if (!resultado.ok && resultado.campo) erroCampo.marcar(resultado.campo, resultado.mensagem);
        if (resultado.ok) {
          setNomeSalvo(nome.trim());
          router.refresh();
        }
      });
    executar();
  }

  function guardarSenha(e: FormEvent) {
    e.preventDefault();
    const executar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => trocarSenha(atual, nova));
        mostrarResultado(resultado, executar);
        if (!resultado.ok && resultado.campo) erroCampo.marcar(resultado.campo, resultado.mensagem);
        if (resultado.ok) {
          setAtual("");
          setNova("");
          setSenhaTrocada(true);
        }
      });
    executar();
  }

  async function sairDesteCelular() {
    const sim = await perguntar({
      titulo: "Sair do painel neste celular?",
      texto: "Para entrar de novo, você vai precisar do seu e-mail e da sua senha.",
      confirmar: "Sair",
    });
    if (!sim) return;
    apagarRascunhosDoEstoque();
    iniciar(() => sair());
  }

  async function sairDeTodosOsAparelhos() {
    const sim = await perguntar({
      titulo: "Sair de todos os aparelhos?",
      texto: "O painel fecha em todos os celulares e computadores em que você entrou, inclusive neste. Para voltar, entre com o seu e-mail e a sua senha.",
      confirmar: "Sair de todos",
      perigo: true,
    });
    if (!sim) return;
    apagarRascunhosDoEstoque();
    iniciar(() => sairDeTodos());
  }

  return (
    <div className="pb-10">
      {aviso}
      {confirmacao}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel titulo="Minha conta" subtitulo={nomeDoPapel(papel)} voltar="/painel" />

      <div className="flex flex-col gap-[22px] px-5 pt-3.5">
        <form onSubmit={guardarNome} className={cx(cartao, "flex flex-col gap-3.5 p-4")}>
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className={rotulo}>
              Seu nome
            </label>
            <input
              id="nome"
              required
              maxLength={120}
              autoComplete="name"
              autoCapitalize="words"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                erroCampo.limpar("nome");
              }}
              {...erroCampo.props("nome")}
              className={cx(campo, "h-12", erroCampo.classe("nome"))}
            />
            {erroCampo.texto("nome")}
            <span className="text-xs text-creme-400">Aparece no alto do painel e para quem administra, em Acessos.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={rotulo}>E-mail</span>
            <span className="text-[15px] break-all">{email}</span>
            <span className="text-xs text-creme-400">É com ele que você entra. Para mudar, fale com a administração.</span>
          </div>
          <button
            type="submit"
            disabled={ocupado || !nome.trim() || nome.trim() === nomeSalvo}
            className="flex h-12 items-center justify-center rounded-full border border-dourado/30 text-[15px] font-bold text-dourado disabled:opacity-50"
          >
            Salvar nome
          </button>
        </form>

        <form onSubmit={guardarSenha} className={cx(cartao, "flex flex-col gap-3.5 p-4")}>
          <h2 className="font-display text-xl font-semibold">Trocar senha</h2>
          <input type="text" name="usuario" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
          <div className="flex flex-col gap-2">
            <label htmlFor="senha-atual" className={rotulo}>
              Senha atual
            </label>
            <CampoSenha
              id="senha-atual"
              required
              autoComplete="current-password"
              enterKeyHint="next"
              value={atual}
              onChange={(e) => {
                setAtual(e.target.value);
                setSenhaTrocada(false);
                erroCampo.limpar("senha-atual");
              }}
              {...erroCampo.props("senha-atual")}
              className={erroCampo.classe("senha-atual")}
            />
            {erroCampo.texto("senha-atual")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="senha-nova" className={rotulo}>
              Senha nova
            </label>
            <CampoSenha
              id="senha-nova"
              required
              minLength={8}
              autoComplete="new-password"
              enterKeyHint="done"
              value={nova}
              onChange={(e) => {
                setNova(e.target.value);
                setSenhaTrocada(false);
                erroCampo.limpar("senha-nova");
              }}
              {...erroCampo.props("senha-nova")}
              className={erroCampo.classe("senha-nova")}
            />
            {erroCampo.texto("senha-nova")}
            <span className="text-xs text-creme-400">Pelo menos 8 letras ou números. Não precisa de maiúscula nem de símbolo.</span>
          </div>
          {senhaTrocada && (
            <p role="status" className="flex items-start gap-2 rounded-2xl bg-menta/15 p-3 text-sm leading-snug font-semibold text-menta">
              <IconeCheck tamanho={20} className="mt-px shrink-0" />
              Senha trocada. Nos outros celulares, entre de novo com a senha nova.
            </p>
          )}
          <button type="submit" disabled={ocupado} className={cx(botaoPrimario, "disabled:opacity-60")}>
            {ocupado ? "Salvando…" : "Trocar senha"}
          </button>
        </form>

        {!demo && (
          <section className={cx(cartao, "flex flex-col gap-2.5 p-4")}>
            <h2 className="font-display text-xl font-semibold">Sair</h2>
            <p className="text-[13px] leading-relaxed text-creme-200">
              Neste celular, o painel fica conectado enquanto você usar pelo menos uma vez por mês.
            </p>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void sairDesteCelular()}
              className="flex h-12 items-center justify-center rounded-full border border-dourado/30 text-[15px] font-bold text-dourado disabled:opacity-50"
            >
              Sair deste celular
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void sairDeTodosOsAparelhos()}
              className="flex h-12 items-center justify-center rounded-full border border-rosa/40 text-[15px] font-bold text-rosa disabled:opacity-50"
            >
              Sair de todos os aparelhos
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
