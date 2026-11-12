import type { ReactNode } from "react";

// Recado na tela de entrar (informação ou erro).
export function Aviso({ children, erro }: { children: ReactNode; erro?: boolean }) {
  return (
    <p
      role={erro ? "alert" : "status"}
      className={
        erro
          ? "rounded-2xl border-2 border-rosa/60 bg-rosa/15 p-4 text-center text-sm leading-relaxed font-semibold text-rosa"
          : "rounded-2xl border border-dourado/20 bg-cacau-900 p-4 text-center text-sm leading-relaxed text-creme-200"
      }
    >
      {children}
    </p>
  );
}
