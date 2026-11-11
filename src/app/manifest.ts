import type { MetadataRoute } from "next";
import { LOJA } from "@/lib/loja";

// Permite instalar a vitrine no celular como app (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: LOJA.nome,
    short_name: "Mone",
    description: "Brigadeiros, palha italiana e bolos de pote. Veja o que tem hoje e encomende pelo WhatsApp.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#1c0d08",
    theme_color: "#1c0d08",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-mascara-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
