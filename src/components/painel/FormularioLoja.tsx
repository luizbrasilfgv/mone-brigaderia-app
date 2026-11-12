"use client";

import { useState, useTransition, type FormEvent } from "react";
import { DIAS, ORDEM_DA_SEMANA, situacaoDaLoja, type Horario, type Horarios } from "@/lib/horarios";
import { TRACOS, formatarWhatsApp, linkWhatsApp, normalizarWhatsApp, type DadosLoja, type Traco } from "@/lib/loja";
import { useAgora } from "@/lib/hooks";
import { salvarLoja } from "@/app/painel/acoes";
import { InfoDaLoja } from "../InfoDaLoja";
import { barraFixa, botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { CabecalhoPainel, Chave, FaixaDemo, tentar, useAviso, useErroDeCampo } from "./comum";

const HORARIO_PADRAO: Horario = { abre: "09:00", fecha: "18:00" };

function CampoTexto({
  id,
  rotulo: nome,
  valor,
  aoMudar,
  exemplo,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  exemplo: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={rotulo}>
        {nome}
      </label>
      <input
        id={id}
        value={valor}
        maxLength={80}
        placeholder={exemplo}
        onChange={(e) => aoMudar(e.target.value)}
        className={cx(campo, "h-12")}
      />
    </div>
  );
}

export function FormularioLoja({ loja, agora: agoraDoServidor, demo }: { loja: DadosLoja; agora: number; demo: boolean }) {
  const agora = useAgora(agoraDoServidor);
  const [aviso, mostrar, mostrarResultado] = useAviso();
  const erroCampo = useErroDeCampo();
  const [salvando, iniciar] = useTransition();
  const [whatsapp, setWhatsapp] = useState(formatarWhatsApp(loja.whatsapp));
  const [horarios, setHorarios] = useState<Horarios>(loja.horarios);
  const [retirada, setRetirada] = useState(loja.retirada);
  const [entrega, setEntrega] = useState(loja.entrega);
  const [pagamento, setPagamento] = useState(loja.pagamento);
  const [tracos, setTracos] = useState<Traco[]>(loja.tracos);

  const numero = normalizarWhatsApp(whatsapp);
  const diaComErro = horarios.findIndex((h) => h !== null && h.abre >= h.fecha);
  const rascunho: DadosLoja = {
    whatsapp: numero || loja.whatsapp,
    horarios: horarios.map((h) => (h && h.abre < h.fecha ? h : null)),
    retirada: retirada.trim(),
    entrega: entrega.trim(),
    pagamento: pagamento.trim(),
    tracos,
  };
  const situacao = situacaoDaLoja(rascunho.horarios, agora);

  function mudarDia(dia: number, horario: Horario | null) {
    setHorarios((atuais) => atuais.map((h, i) => (i === dia ? horario : h)));
  }

  // Ao abrir um dia, repete o horário do dia aberto mais próximo antes dele.
  function abrirDia(dia: number) {
    const posicao = ORDEM_DA_SEMANA.indexOf(dia);
    const anterior = [...ORDEM_DA_SEMANA.slice(0, posicao)].reverse().find((d) => horarios[d]);
    const qualquer = ORDEM_DA_SEMANA.find((d) => horarios[d]);
    mudarDia(dia, horarios[anterior ?? qualquer ?? -1] ?? HORARIO_PADRAO);
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    erroCampo.limpar();
    if (!numero) {
      const texto = "Confira o WhatsApp: escreva o DDD e o número, por exemplo (21) 98063-1673.";
      erroCampo.marcar("whatsapp", texto);
      return mostrar(texto, false);
    }
    if (diaComErro >= 0) {
      const texto = `Confira o horário de ${DIAS[diaComErro].toLowerCase()}: a loja precisa fechar depois de abrir.`;
      erroCampo.marcar(`fecha-${diaComErro}`, texto);
      return mostrar(texto, false);
    }
    const dados = { whatsapp: numero, horarios, retirada, entrega, pagamento, tracos };
    const enviar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarLoja(dados));
        mostrarResultado(resultado, enviar);
        if (!resultado.ok && resultado.campo) erroCampo.marcar(resultado.campo, resultado.mensagem);
        if (resultado.ok) setWhatsapp(formatarWhatsApp(numero));
      });
    enviar();
  }

  return (
    <form onSubmit={salvar} className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {aviso}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel titulo="Dados da loja" subtitulo="O que quem compra vê na vitrine e no WhatsApp" voltar="/painel" />

      <div className="flex flex-col gap-6 px-5 pt-3.5 pb-7">
        <div className="flex flex-col gap-2">
          <label htmlFor="whatsapp" className={rotulo}>
            WhatsApp da loja
          </label>
          <input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            aria-describedby="whatsapp-ajuda"
            aria-invalid={whatsapp.trim() !== "" && !numero}
            placeholder="(21) 98063-1673"
            className={cx(campo, "h-12", erroCampo.classe("whatsapp"))}
          />
          <span id="whatsapp-ajuda" className={cx("text-xs leading-snug", numero ? "text-creme-400" : "text-rosa")}>
            {numero ? (
              <>
                Recebe os pedidos de todos os botões de WhatsApp do app.{" "}
                <a href={linkWhatsApp(numero)} target="_blank" rel="noopener noreferrer" className="font-bold text-dourado underline underline-offset-2">
                  Testar {formatarWhatsApp(numero)}
                </a>
              </>
            ) : (
              "Escreva o DDD e o número, por exemplo (21) 98063-1673."
            )}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Horário de atendimento</span>
          <div className={cx(cartao, "flex flex-col px-4")}>
            {ORDEM_DA_SEMANA.map((dia) => {
              const horario = horarios[dia];
              const errado = horario !== null && horario.abre >= horario.fecha;
              return (
                <div key={dia} className="flex flex-col gap-2 border-b border-dourado/8 py-2 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold">{DIAS[dia]}</span>
                    <div className="flex items-center gap-1">
                      <span className={cx("text-xs", horario ? "text-menta" : "text-creme-400")}>{horario ? "Aberto" : "Fechado"}</span>
                      <Chave
                        ligada={horario !== null}
                        rotulo={`${DIAS[dia]}: loja aberta`}
                        aoMudar={() => (horario ? mudarDia(dia, null) : abrirDia(dia))}
                      />
                    </div>
                  </div>
                  {horario && (
                    <div className="grid grid-cols-2 gap-2.5 pb-1.5">
                      <label className="flex min-w-0 flex-col gap-1 text-xs text-creme-400">
                        Abre às
                        <input
                          id={`abre-${dia}`}
                          type="time"
                          required
                          value={horario.abre}
                          onChange={(e) => e.target.value && mudarDia(dia, { ...horario, abre: e.target.value })}
                          className={cx(campo, "h-11 min-w-0 px-3 [color-scheme:dark]")}
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-1 text-xs text-creme-400">
                        Fecha às
                        <input
                          id={`fecha-${dia}`}
                          type="time"
                          required
                          value={horario.fecha}
                          onChange={(e) => e.target.value && mudarDia(dia, { ...horario, fecha: e.target.value })}
                          aria-invalid={errado || undefined}
                          className={cx(campo, "h-11 min-w-0 px-3 [color-scheme:dark]", errado && "ring-2 ring-rosa")}
                        />
                      </label>
                      {errado && <span className="col-span-2 text-xs font-semibold text-rosa">A loja precisa fechar depois de abrir.</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-xs leading-snug text-creme-400">
            A vitrine mostra “Aberto agora” ou quando a loja abre, e as datas de encomenda pulam os dias fechados. Com todos os
            dias fechados, a vitrine não mostra horário.
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <CampoTexto id="retirada" rotulo="Retirada" valor={retirada} aoMudar={setRetirada} exemplo="Ex.: Retirada em Copacabana" />
          <CampoTexto id="entrega" rotulo="Entrega" valor={entrega} aoMudar={setEntrega} exemplo="Ex.: Entrega a combinar" />
          <CampoTexto id="pagamento" rotulo="Pagamento" valor={pagamento} aoMudar={setPagamento} exemplo="Ex.: Pix ou dinheiro" />
          <span className="-mt-2 text-xs leading-snug text-creme-400">
            Só informam: retirada ou entrega, dia e pagamento são combinados no WhatsApp. Deixe vazio o que não quiser mostrar.
          </span>
        </div>

        <div role="group" aria-label="Ingredientes usados na cozinha" className="flex flex-col gap-2.5">
          <span className={rotulo}>Ingredientes usados na cozinha</span>
          <div className="flex flex-wrap gap-2">
            {TRACOS.map((traco) => {
              const marcado = tracos.includes(traco);
              return (
                <button
                  key={traco}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => setTracos((atuais) => (marcado ? atuais.filter((t) => t !== traco) : [...atuais, traco]))}
                  className={cx("h-11 rounded-full px-4 capitalize", escolha(marcado))}
                >
                  {traco}
                </button>
              );
            })}
          </div>
          <span className="text-xs leading-snug text-creme-400">
            Marque o que entra em alguma receita da cozinha. A ficha dos doces mostra “Pode conter traços de…”. Com trigo
            marcado (a palha leva biscoito), nenhum doce aparece como “Sem glúten”.
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Como aparece na vitrine</span>
          <div className={cx(cartao, "flex flex-col gap-3 p-4")}>
            {situacao && (
              <span className={cx("inline-flex items-center gap-1.5 text-xs font-semibold", situacao.aberta ? "text-menta" : "text-creme-200")}>
                <span className={cx("size-2 rounded-full", situacao.aberta ? "bg-menta" : "bg-creme-400")} />
                {situacao.texto}
              </span>
            )}
            <InfoDaLoja loja={rascunho} />
            <span className="text-xs text-creme-400">WhatsApp {formatarWhatsApp(rascunho.whatsapp)}</span>
          </div>
        </div>
      </div>

      <div className={cx(barraFixa, "items-center")}>
        <button type="submit" disabled={salvando} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {salvando ? "Salvando…" : "Salvar dados da loja"}
        </button>
      </div>
    </form>
  );
}
