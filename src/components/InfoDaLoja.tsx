import type { ReactNode } from "react";
import { textoAtendimento } from "@/lib/horarios";
import { formatarWhatsApp, linkWhatsApp, type DadosLoja } from "@/lib/loja";
import { IconeCaixa, IconeDinheiro, IconeLocal, IconeRelogio } from "./Icones";
import { cx } from "./ui";

// Retirada, entrega, pagamento e horário, como a Administração escreveu em Dados da
// loja. Só aparece o que estiver preenchido (vitrine, folha do WhatsApp e, depois, a sacola).
export function InfoDaLoja({ loja, className }: { loja: DadosLoja; className?: string }) {
  const atendimento = textoAtendimento(loja.horarios);
  const linhas: { icone: ReactNode; texto: string }[] = [];
  if (loja.retirada) linhas.push({ icone: <IconeLocal tamanho={18} />, texto: loja.retirada });
  if (loja.entrega) linhas.push({ icone: <IconeCaixa tamanho={18} />, texto: loja.entrega });
  if (loja.pagamento) linhas.push({ icone: <IconeDinheiro tamanho={18} />, texto: `Pagamento: ${loja.pagamento}` });
  if (atendimento) linhas.push({ icone: <IconeRelogio tamanho={18} />, texto: `Atendimento: ${atendimento}.` });
  if (linhas.length === 0) return null;
  return (
    <ul className={cx("flex flex-col gap-2", className)}>
      {linhas.map((linha) => (
        <li key={linha.texto} className="flex items-start gap-2.5 text-sm leading-snug text-creme-200">
          <span className="mt-px shrink-0 text-dourado">{linha.icone}</span>
          {linha.texto}
        </li>
      ))}
    </ul>
  );
}

// Número da loja escrito com DDD, que abre a conversa ao tocar.
export function NumeroWhatsApp({ numero, className }: { numero: string; className?: string }) {
  return (
    <a
      href={linkWhatsApp(numero)}
      target="_blank"
      rel="noopener noreferrer"
      className={cx("inline-flex min-h-11 items-center justify-center underline underline-offset-4", className)}
    >
      WhatsApp {formatarWhatsApp(numero)}
    </a>
  );
}
