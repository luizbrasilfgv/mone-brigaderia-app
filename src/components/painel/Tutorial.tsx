"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pode, type Papel } from "@/lib/papeis";
import { IconeCaixa, IconeCalendario, IconeConversa, IconeEstrela, IconeLoja, IconePessoa, IconePessoas, IconeRelogio } from "../Icones";
import { botaoPrimario, cx } from "../ui";

interface Passo {
  titulo: string;
  texto: string;
  icone: ReactNode;
  // Só aparece para quem tem pelo menos este papel.
  minimo: Papel;
}

const PASSOS: Passo[] = [
  {
    titulo: "Boas-vindas ao painel",
    texto: "Aqui você cuida da vitrine que quem compra vê em monebrigaderia.com.br. Leva um minuto para conhecer.",
    icone: <IconeLoja tamanho={40} />,
    minimo: "estoque",
  },
  {
    titulo: "Todo dia: o que tem hoje",
    texto:
      "Ajuste a quantidade de cada doce com − e + e toque em Salvar o dia. Com zero, o doce aparece como esgotado; com 3 ou menos, como “Últimas unidades”. Salve todo dia: sem isso, a vitrine pede para quem compra confirmar no WhatsApp.",
    icone: <IconeCaixa tamanho={40} />,
    minimo: "estoque",
  },
  {
    titulo: "Fichas dos doces",
    texto:
      "Toque num doce para mudar foto, preço, sabores, glúten, lactose e composição. Para um doce novo, use Cadastrar novo doce. A estrela escolhe o destaque da vitrine.",
    icone: <IconeEstrela tamanho={40} />,
    minimo: "equipe",
  },
  {
    titulo: "Doces sob encomenda",
    texto:
      "Para doces que só são feitos quando alguém pede, ligue Sob encomenda na ficha e informe o prazo. Eles não têm quantidade e nunca aparecem como esgotados.",
    icone: <IconeRelogio tamanho={40} />,
    minimo: "equipe",
  },
  {
    titulo: "Campanhas",
    texto:
      "Natal, Páscoa, Dia das Mães… Escolha a data pronta, os doces e a cor do banner. A campanha entra e sai da vitrine sozinha nas datas escolhidas.",
    icone: <IconeCalendario tamanho={40} />,
    minimo: "equipe",
  },
  {
    titulo: "Dados da loja",
    texto:
      "WhatsApp que recebe os pedidos, horário de cada dia, retirada, entrega, pagamento e ingredientes da cozinha. A vitrine mostra “Aberto agora” e o “Como funciona” com esses dados.",
    icone: <IconeLoja tamanho={40} />,
    minimo: "admin",
  },
  {
    titulo: "Acessos",
    texto:
      "Escreva nome e e-mail e escolha o que a pessoa pode fazer. O app cria uma senha provisória: mande pelo WhatsApp. No primeiro acesso, a pessoa cria a própria senha.",
    icone: <IconePessoas tamanho={40} />,
    minimo: "admin",
  },
  {
    titulo: "Sua conta",
    texto: "Toque no seu nome, no alto, para trocar a senha ou sair.",
    icone: <IconePessoa tamanho={40} />,
    minimo: "estoque",
  },
  {
    titulo: "As encomendas chegam no WhatsApp",
    texto:
      "Quem compra escolhe na vitrine e manda o pedido já escrito no WhatsApp da loja. Divulgue o endereço monebrigaderia.com.br. Para rever este guia, toque em Como usar.",
    icone: <IconeConversa tamanho={40} />,
    minimo: "estoque",
  },
];

// Guia de primeiro acesso, em passos. Mostra só o que o papel da pessoa permite usar.
export function Tutorial({ papel, aberto, aoFechar }: { papel: Papel; aberto: boolean; aoFechar: () => void }) {
  const passos = PASSOS.filter((p) => pode({ papel }, p.minimo));
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  const passo = passos[Math.min(indice, passos.length - 1)];
  const ultimo = indice >= passos.length - 1;
  const fechar = () => {
    setIndice(0);
    aoFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Como usar o painel"
        className="flex w-full max-w-md animate-sobe flex-col items-center gap-5 rounded-t-[32px] border-t border-dourado/20 bg-cacau-900 px-6 pt-5 pb-7 text-center sm:rounded-[32px] sm:border"
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-xs font-semibold text-creme-400">
            {indice + 1} de {passos.length}
          </span>
          {!ultimo && (
            <button type="button" onClick={fechar} className="h-11 px-2 text-sm font-semibold text-creme-400">
              Pular
            </button>
          )}
        </div>
        <span key={indice} className="flex size-24 animate-entra items-center justify-center rounded-full bg-dourado/14 text-dourado">
          {passo.icone}
        </span>
        <div className="flex min-h-[150px] flex-col gap-2.5">
          <h2 className="font-display text-[26px] leading-tight font-semibold">{passo.titulo}</h2>
          <p className="text-[15px] leading-relaxed text-creme-200">{passo.texto}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {passos.map((_, i) => (
            <span key={i} className={cx("h-1.5 rounded-full transition-all", i === indice ? "w-6 bg-dourado" : "w-1.5 bg-creme/25")} />
          ))}
        </div>
        <div className="flex w-full gap-2.5">
          {indice > 0 && (
            <button
              type="button"
              onClick={() => setIndice(indice - 1)}
              className="h-[54px] shrink-0 rounded-full border border-dourado/30 px-5 text-base font-bold text-dourado"
            >
              Voltar
            </button>
          )}
          <button type="button" onClick={ultimo ? fechar : () => setIndice(indice + 1)} className={botaoPrimario}>
            {ultimo ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
