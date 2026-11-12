"use client";

import { useState } from "react";
import { IconeConversa } from "@/components/Icones";
import { botaoWhatsApp, campo, cx, rotulo } from "@/components/ui";
import { linkWhatsAppSemContato } from "@/lib/loja";

export function PedirSenhaNova({ emailInicial }: { emailInicial: string }) {
  const [email, setEmail] = useState(emailInicial);
  const mensagem = `Oi! Esqueci minha senha do painel da Mone Brigaderia. Pode gerar uma senha nova para mim em Acessos?${
    email.trim() ? `\nMeu e-mail: ${email.trim()}` : ""
  }`;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={rotulo}>
          Seu e-mail no painel
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          inputMode="email"
          className={cx(campo, "h-12")}
        />
      </div>
      <a
        href={linkWhatsAppSemContato(mensagem)}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(botaoWhatsApp, "h-[54px] w-full text-base")}
      >
        <IconeConversa tamanho={20} strokeWidth={2} />
        Pedir pelo WhatsApp
      </a>
      <p className="text-center text-xs leading-relaxed text-creme-400">
        O WhatsApp abre com a mensagem pronta: escolha a conversa com quem administra o painel.
      </p>
    </div>
  );
}
