import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Gera .next/standalone com server.js, para rodar num servidor próprio (docs/publicar.md).
  output: "standalone",
  // Leva junto os arquivos que o app usa para criar as tabelas num banco vazio.
  outputFileTracingIncludes: {
    "/**": ["./banco/*.sql"],
  },
  // As fotos já chegam reduzidas pelo painel. Sem otimização, o app não depende
  // do sharp no servidor, que costuma falhar em hospedagem compartilhada.
  images: {
    unoptimized: true,
  },
  experimental: {
    // Fotos do painel (já reduzidas no celular) com folga.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
