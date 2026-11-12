import { Fragment } from "react";
import { cx } from "../ui";

// O recibo como aparece no WhatsApp: balão pêssego e *texto* em negrito.
export function BalaoDoPedido({ mensagem, className }: { mensagem: string; className?: string }) {
  return (
    <p className={cx("rounded-[18px] rounded-br-[4px] bg-pessego px-3.5 py-3 text-sm leading-normal break-words whitespace-pre-wrap text-cacau-900", className)}>
      {mensagem.split("\n").map((linha, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {linha.split(/(\*[^*]+\*)/).map((parte, j) =>
            parte.startsWith("*") && parte.endsWith("*") && parte.length > 2 ? <strong key={j}>{parte.slice(1, -1)}</strong> : parte,
          )}
        </Fragment>
      ))}
    </p>
  );
}

// Enquanto o celular não leu a sacola (o servidor não sabe o que tem nela): cartões
// vazios, para não piscar "Sua sacola está vazia".
export function EsqueletoSacola() {
  return (
    <div aria-hidden="true" className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-5 pt-[calc(76px+env(safe-area-inset-top))]">
      {[0, 1].map((i) => (
        <div key={i} className="flex h-[132px] animate-pulse gap-3 rounded-[20px] border border-dourado/10 bg-cacau-900 p-3">
          <div className="size-14 rounded-xl bg-creme/[0.06]" />
          <div className="flex grow flex-col gap-2 pt-1">
            <div className="h-4 w-2/3 rounded bg-creme/[0.08]" />
            <div className="h-3 w-1/3 rounded bg-creme/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
