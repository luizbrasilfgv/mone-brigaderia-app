"use client";

import { useState, type InputHTMLAttributes } from "react";
import { campo, cx } from "./ui";

// Campo de senha com o botão "Mostrar", para conferir o que foi digitado.
export function CampoSenha({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input
        type={visivel ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        className={cx(campo, "h-12 pr-[88px]", className)}
      />
      <button
        type="button"
        onClick={() => setVisivel(!visivel)}
        aria-pressed={visivel}
        aria-label={visivel ? "Esconder a senha" : "Mostrar a senha"}
        className="absolute inset-y-0 right-0 my-auto flex h-11 min-w-11 items-center justify-center rounded-[12px] px-3.5 text-sm font-bold text-dourado"
      >
        {visivel ? "Esconder" : "Mostrar"}
      </button>
    </div>
  );
}
