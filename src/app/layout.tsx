import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { LOJA } from "@/lib/loja";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: LOJA.nome, template: `%s · ${LOJA.nome}` },
  description: "Brigadeiros, palha italiana e bolos de pote. Veja o que tem hoje e encomende pelo WhatsApp.",
  appleWebApp: { title: "Mone", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1c0d08",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
