"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Acesso } from "@/lib/auth";
import { PAPEIS, type Papel } from "@/lib/papeis";
import { formatarData } from "@/lib/regras";
import { adicionarAcesso, mudarPapel, removerAcesso, type Resultado } from "@/app/painel/acoes";
import { IconeLixo } from "../Icones";
import { botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { CabecalhoPainel, FaixaDemo, useAviso } from "./comum";

export function ListaAcessos({ acessos, meuId, demo }: { acessos: Acesso[]; meuId: number; demo: boolean }) {
  const router = useRouter();
  const [aviso, mostrarAviso] = useAviso();
  const [ocupado, iniciar] = useTransition();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("equipe");

  // Executa a ação, mostra o resultado e recarrega a lista.
  function executar(acao: () => Promise<Resultado>, depois?: () => void) {
    iniciar(async () => {
      const resultado = await acao();
      mostrarAviso(resultado.mensagem, resultado.ok);
      if (resultado.ok) {
        depois?.();
        router.refresh();
      }
    });
  }

  function adicionar(e: FormEvent) {
    e.preventDefault();
    executar(() => adicionarAcesso(email, papel), () => setEmail(""));
  }

  return (
    <div className="pb-10">
      {aviso}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel titulo="Acessos" subtitulo="Quem pode entrar no painel" voltar="/painel" />

      <div className="flex flex-col gap-[22px] px-5 pt-3.5">
        <p className="text-[13px] leading-relaxed text-creme-200">
          Cada pessoa entra com a própria conta do Google. Adicione o e-mail dela aqui e escolha o que ela pode fazer.
        </p>

        <form onSubmit={adicionar} className={cx(cartao, "flex flex-col gap-3.5 p-4")}>
          <h2 className="font-display text-xl font-semibold">Adicionar pessoa</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={rotulo}>
              E-mail do Google
            </label>
            <input
              id="email"
              type="email"
              required
              inputMode="email"
              autoComplete="off"
              placeholder="nome@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cx(campo, "h-12")}
            />
          </div>
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
          <button type="submit" disabled={ocupado} className={cx(botaoPrimario, "disabled:opacity-60")}>
            {ocupado ? "Salvando…" : "Dar acesso"}
          </button>
        </form>

        <section className="flex flex-col gap-2.5">
          <h2 className={rotulo}>
            {acessos.length} {acessos.length === 1 ? "pessoa tem acesso" : "pessoas têm acesso"}
          </h2>
          {acessos.map((a) => {
            const souEu = a.id === meuId;
            return (
              <div key={a.id} className={cx(cartao, "flex flex-col gap-2.5 p-3.5")}>
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold">
                      {a.nome || a.email}
                      {souEu && <span className="ml-2 rounded-full bg-dourado/15 px-2 py-0.5 text-[10px] font-bold text-dourado">você</span>}
                    </span>
                    {a.nome && <span className="truncate text-xs text-creme-400">{a.email}</span>}
                    <span className="text-[11px] text-creme-600">
                      {a.ultimoAcesso ? `Último acesso em ${formatarData(a.ultimoAcesso)}` : "Ainda não entrou"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={ocupado}
                    aria-label={`Remover acesso de ${a.email}`}
                    onClick={() => {
                      const pergunta = souEu
                        ? "Remover o seu próprio acesso? Você sai do painel."
                        : `Remover o acesso de ${a.email}?`;
                      if (window.confirm(pergunta)) executar(() => removerAcesso(a.id));
                    }}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-creme-400 active:scale-90 disabled:opacity-50"
                  >
                    <IconeLixo tamanho={20} />
                  </button>
                </div>
                <div role="group" aria-label={`O que ${a.email} pode fazer`} className="grid grid-cols-3 gap-1.5">
                  {PAPEIS.map((p) => (
                    <button
                      key={p.valor}
                      type="button"
                      disabled={ocupado}
                      aria-pressed={a.papel === p.valor}
                      onClick={() => a.papel !== p.valor && executar(() => mudarPapel(a.id, p.valor))}
                      className={cx("h-11 rounded-xl px-1 text-[13px]", escolha(a.papel === p.valor))}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
