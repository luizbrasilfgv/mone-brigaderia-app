# Mone Brigaderia: app vitrine

App vitrine da Mone Brigaderia. A cliente vê os doces do dia, abre a ficha de cada um (descrição, glúten, lactose, composição) e faz a encomenda pelo WhatsApp. A dona controla tudo num painel: o que tem hoje e em que quantidade, doces sob encomenda e campanhas como Natal e Páscoa.

## Onde estamos

O app já roda com **dados de exemplo**: todas as telas do mockup estão em código. Falta ligar o banco, colocar login no painel, publicar num servidor e registrar o domínio. O caminho está em [docs/proximos-passos.md](docs/proximos-passos.md).

- **Mockup interativo:** https://claude.ai/artifact/NbaerYRi3uWoKwrCNHYcPu (peça acesso ao Luiz)
- **O que o app faz e as regras:** [docs/funcionalidades.md](docs/funcionalidades.md)

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
cp .env.example .env.local   # opcional: coloque o número do WhatsApp
npm run dev
```

Abra http://localhost:3000.

| Endereço | Tela |
| --- | --- |
| `/` | Vitrine |
| `/doce/palha-italiana` | Ficha do doce (troque pelo id de qualquer doce) |
| `/doce/caixa-presente-4` | Ficha de doce sob encomenda, com escolha de data |
| `/painel` | Painel da dona: o que tem hoje e quantidades |
| `/painel/doces/novo` | Cadastro de doce |
| `/painel/campanhas` | Campanhas |
| `/balcao` | Tela para TV ou tablet na loja |

Outros comandos: `npm run build` (versão de produção), `npm run lint` (verifica o código).

## Como o código está organizado

| Caminho | O que tem |
| --- | --- |
| `src/app/` | Páginas (uma pasta por endereço) |
| `src/components/` | Partes das telas: vitrine, ficha, painel, balcão |
| `src/lib/dados.ts` | **Único ponto de acesso aos dados.** Troque o corpo destas funções por consultas ao banco e as telas continuam iguais |
| `src/lib/dados-exemplo.ts` | Doces e campanhas de exemplo |
| `src/lib/regras.ts` | Regras de negócio: estoque, selos, campanhas no ar, mensagem do WhatsApp |
| `src/lib/campanhas-modelo.ts` | Datas prontas das campanhas (Páscoa, Dia das Mães e Dia dos Pais calculados por ano) |
| `supabase/schema.sql` | Tabelas do banco, prontas para rodar no Supabase |
| `docs/` | Funcionalidades, modelo de dados e próximos passos |
| `mockup/` | Código-fonte das telas do mockup, para referência |

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript. Esta versão do Next.js mudou bastante: antes de mexer, leia o guia em `node_modules/next/dist/docs/` (o arquivo `AGENTS.md` explica).

## Como trabalhar juntos

1. Crie um branch por tarefa a partir do `main` (exemplo: `feature/login-painel`).
2. Rode `npm run lint` e `npm run build` antes de abrir o pull request.
3. Abra um pull request para o `main` e peça revisão de outra pessoa do time.
4. Decisões que mudam o escopo entram em `docs/funcionalidades.md` no mesmo pull request.

## Contato da loja

Encomendas pelo WhatsApp 98063-1673. O DDD precisa ser confirmado para preencher `NEXT_PUBLIC_WHATSAPP_NUMERO`.
