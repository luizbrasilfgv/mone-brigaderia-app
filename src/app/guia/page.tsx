import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LOJA } from "@/lib/loja";
import { cartao, cx, rotulo } from "@/components/ui";

// Guia da loja: versão provisória e curta. A versão completa (com "Copiar" nas respostas
// prontas) vem na próxima etapa. Pública, mas fora do Google.
export const metadata: Metadata = { title: "Guia da loja", robots: { index: false, follow: false } };

const TODO_DIA = [
  "Toda manhã, abra o painel, confira O que tem hoje e toque em Salvar o dia. Se está tudo igual, toque em Está igual a ontem. Sem isso, a vitrine mostra “confirme no WhatsApp”.",
  "Para mudar uma quantidade, toque no número e digite, ou use − e +.",
  "Acabou um doce? Toque em Esgotou: ele aparece como esgotado na hora.",
  "Confirmou um pedido no WhatsApp? Diminua a quantidade em O que tem hoje (ou toque em Esgotou). A quantidade não baixa sozinha.",
];

const DICAS = [
  "Para ver todos os pedidos do app, busque Pedido nº na lupa do WhatsApp.",
  "Para responder, deslize a mensagem do pedido para a direita: sua resposta fica presa ao pedido.",
  "Se o mesmo número de pedido chegar duas vezes, vale a última mensagem.",
];

const RESPOSTAS = [
  {
    atalho: "/recebi",
    texto: "Oi! Recebi seu pedido nº ____. Já confiro e te respondo.\nPara fechar, me conta:\n1. Vai retirar ou prefere entrega?\n2. Qual dia e horário?\n3. Pix ou dinheiro?",
  },
  {
    atalho: "/confirmado",
    texto:
      "Pedido nº ____ confirmado! Total: R$ ____.\n[Retirada / Entrega] em [dia], [horário]. Pagamento: [Pix ou dinheiro].\nSe precisar mudar ou cancelar, é só responder esta mensagem.",
  },
  { atalho: "/pix", texto: "Pode fazer o Pix para a chave ____, no nome ____. Depois me manda o comprovante aqui, por favor." },
  {
    atalho: "/cancelado",
    texto: "Pronto, o pedido nº ____ foi cancelado. Quando quiser, é só montar outro na vitrine: monebrigaderia.com.br",
  },
];

export default function PaginaGuia() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={44} height={44} className="rounded-full" />
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-xs text-creme-400">{LOJA.nome}</span>
          <h1 className="font-display text-[26px] leading-tight font-semibold">Guia da loja</h1>
        </div>
        <Link
          href="/painel"
          className="flex h-11 shrink-0 items-center rounded-full border border-dourado/30 px-3.5 text-[13px] font-bold text-dourado"
        >
          Painel
        </Link>
      </header>

      <section aria-labelledby="todo-dia" className="flex flex-col gap-2.5">
        <h2 id="todo-dia" className={rotulo}>
          Todo dia
        </h2>
        <ol className={cx(cartao, "flex flex-col gap-3 p-4")}>
          {TODO_DIA.map((passo, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-sm font-bold text-dourado">
                {i + 1}
              </span>
              <span className="pt-0.5">{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pedidos" className="flex flex-col gap-2.5">
        <h2 id="pedidos" className={rotulo}>
          Pedidos pelo WhatsApp
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-snug text-creme-200">
          {DICAS.map((dica) => (
            <li key={dica}>{dica}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="respostas" className="flex flex-col gap-2.5">
        <h2 id="respostas" className={rotulo}>
          Respostas prontas
        </h2>
        <p className="text-[13px] leading-snug text-creme-400">
          No WhatsApp Business: Ferramentas comerciais &gt; Respostas rápidas &gt; +. Cole o texto e escolha o atalho. Na conversa, digite /
          e escolha. (O nome do menu pode variar com a versão.)
        </p>
        {RESPOSTAS.map((r) => (
          <div key={r.atalho} className={cx(cartao, "flex flex-col gap-1.5 p-4")}>
            <span className="text-sm font-bold text-dourado">{r.atalho}</span>
            <p className="text-[15px] leading-relaxed whitespace-pre-line select-all">{r.texto}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
