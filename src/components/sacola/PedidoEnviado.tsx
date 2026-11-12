"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { linkWhatsApp, type DadosLoja } from "@/lib/loja";
import { situacaoDaLoja, textoAtendimento, textoFechadoNaSacola } from "@/lib/horarios";
import { useAgora, useSacola, useUltimoPedido } from "@/lib/hooks";
import { copiarTexto } from "@/lib/copiar";
import { formatarPreco } from "@/lib/regras";
import { mensagemCancelar, mensagemMudar, sacolaDoPedido, textoItens } from "@/lib/sacola";
import { IconeConversa } from "../Icones";
import { botaoPrimario, cx } from "../ui";
import { EsqueletoSacola } from "./comum";

const botaoContorno = "flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] text-[15px] font-bold active:scale-[0.97]";

// "Pedido nº 4821 no WhatsApp": o que fazer se a mensagem não foi ou se mudou de ideia.
// Nenhuma tela diz que o pedido foi confirmado: quem confirma é a Mone, na conversa.
export function PedidoEnviado({ loja, agora: agoraDoServidor }: { loja: DadosLoja; agora: number }) {
  const router = useRouter();
  const agora = useAgora(agoraDoServidor);
  const { pedido } = useUltimoPedido();
  const { sacola, gravar } = useSacola();
  const [copiado, setCopiado] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  // Página guardada escondida pelo Next ao navegar: o "Pedido copiado" não volta junto.
  useLayoutEffect(() => () => setCopiado(false), []);

  // Sem pedido guardado (ou depois de 7 dias): volta para a sacola.
  useEffect(() => {
    if (pedido === null) router.replace("/sacola");
  }, [pedido, router]);

  if (!pedido || !sacola) return <EsqueletoSacola />;

  const atendimento = textoAtendimento(loja.horarios);
  const situacao = situacaoDaLoja(loja.horarios, agora);
  const fechado = situacao ? textoFechadoNaSacola(situacao) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 pt-[calc(28px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]">
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-pessego text-cacau-900">
          <IconeConversa tamanho={30} strokeWidth={2} />
        </span>
        <h1 className="font-display text-[28px] leading-tight font-semibold">Pedido nº {pedido.numero} no WhatsApp</h1>
        <p className="text-[15px] leading-relaxed text-creme-200">
          Confira se você tocou em enviar lá. A Mone responde na conversa confirmando o pedido e o total, e combinando retirada ou entrega, dia,
          horário e pagamento.
        </p>
      </div>

      <p className="rounded-2xl border border-dourado/40 bg-dourado/12 px-4 py-3 text-center text-[15px] font-bold text-dourado">
        O pedido só vale depois que a Mone confirmar.
      </p>
      {(atendimento || fechado) && (
        <div className="flex flex-col gap-1 text-center text-[13px] leading-snug">
          {fechado && <p className="font-semibold text-pessego">{fechado}</p>}
          {atendimento && <p className="text-creme-200">Atendimento: {atendimento}.</p>}
        </div>
      )}

      <details className="rounded-[20px] border border-dourado/12 bg-cacau-900">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-bold text-dourado">Ver o pedido</summary>
        <div className="flex flex-col gap-2 px-4 pb-4 text-sm">
          {pedido.nome && <p className="text-creme-200">Nome: {pedido.nome}</p>}
          <ul className="flex flex-col gap-1.5">
            {pedido.linhas.map((l, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {l.quantidade}x {l.nomeDoce}
                  {l.opcao && ` (${l.opcao})`}
                </span>
                <span className="shrink-0 font-semibold text-dourado">{formatarPreco(l.subtotalCentavos)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-3 border-t border-dourado/12 pt-2 font-bold">
            <span>Total dos doces ({textoItens(pedido.itens)})</span>
            <span className="text-dourado">{formatarPreco(pedido.totalCentavos)}</span>
          </p>
        </div>
      </details>

      <section aria-labelledby="nao-foi" className="flex flex-col gap-2.5">
        <h2 id="nao-foi" className="font-display text-xl font-semibold">
          A mensagem não foi?
        </h2>
        <a
          href={linkWhatsApp(loja.whatsapp, pedido.mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(botaoContorno, "border-whatsapp text-whatsapp")}
        >
          <IconeConversa tamanho={20} strokeWidth={2} />
          Abrir o WhatsApp de novo
        </a>
        <button
          type="button"
          onClick={async () => {
            if (await copiarTexto(pedido.mensagem)) {
              setCopiado(true);
              setAnuncio("Pedido copiado");
            }
          }}
          className={cx(botaoContorno, "border-dourado/40 text-dourado")}
        >
          {copiado ? "Pedido copiado" : "Copiar o pedido"}
        </button>
        {sacola.linhas.length === 0 && (
          <button
            type="button"
            onClick={() => {
              gravar(sacolaDoPedido(pedido, Date.now()));
              router.push("/sacola");
            }}
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-creme-200 underline underline-offset-4"
          >
            Não enviou? Colocar os doces de volta na sacola
          </button>
        )}
      </section>

      <section aria-labelledby="mudou" className="flex flex-col gap-2.5">
        <h2 id="mudou" className="font-display text-xl font-semibold">
          Mudou de ideia?
        </h2>
        <p className="text-sm leading-relaxed text-creme-200">Para trocar algum doce ou cancelar, responda na mesma conversa.</p>
        <a
          href={linkWhatsApp(loja.whatsapp, mensagemMudar(pedido.numero, pedido.nome))}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(botaoContorno, "border-dourado/40 text-dourado")}
        >
          Pedir uma mudança
        </a>
        <a
          href={linkWhatsApp(loja.whatsapp, mensagemCancelar(pedido.numero, pedido.nome))}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(botaoContorno, "border-dourado/40 text-dourado")}
        >
          Cancelar pelo WhatsApp
        </a>
        <p className="text-[13px] leading-snug text-creme-400">
          Apagar a mensagem no WhatsApp não cancela o pedido. Para cancelar, escreva para a Mone.
        </p>
      </section>

      <Link href="/" className={cx(botaoPrimario, "mt-2")}>
        Voltar para a vitrine
      </Link>
    </main>
  );
}
