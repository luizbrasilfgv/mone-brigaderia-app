# Mone Brigaderia: app vitrine

App vitrine da Mone Brigaderia. A cliente vê os doces do dia, abre a ficha de cada um (descrição, glúten, lactose, composição) e faz a encomenda pelo WhatsApp. A dona controla tudo num painel com senha: o que tem hoje e em que quantidade, fichas e fotos dos doces, doces sob encomenda e campanhas como Natal e Páscoa.

## Onde estamos

O app está pronto para ir ao ar em **monebrigaderia.com.br**: grava no MySQL, o painel tem senha e o GitHub publica sozinho a cada push no `main`. Para a primeira publicação, siga [docs/publicar.md](docs/publicar.md).

- **O que o app faz e as regras:** [docs/funcionalidades.md](docs/funcionalidades.md)
- **O que vem depois:** [docs/proximos-passos.md](docs/proximos-passos.md)
- **Mockup interativo:** https://claude.ai/artifact/NbaerYRi3uWoKwrCNHYcPu (peça acesso ao Luiz)

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

- **Sem MySQL** (deixe `MYSQL_DATABASE` vazio): o app usa os dados de exemplo e o painel abre sem senha, em modo demonstração.
- **Com MySQL**: crie um banco vazio, preencha `MYSQL_*`, `PAINEL_SENHA` e `SESSAO_SEGREDO` no `.env.local`. Na primeira visita, o app cria as tabelas e carrega os doces de exemplo.

| Endereço | Tela |
| --- | --- |
| `/` | Vitrine |
| `/doce/palha-italiana` | Ficha do doce |
| `/doce/caixa-presente-4` | Ficha de doce sob encomenda, com escolha de data |
| `/entrar` | Entrada do painel |
| `/painel` | O que tem hoje e quantidades |
| `/painel/doces/novo` | Cadastro de doce |
| `/painel/campanhas` | Campanhas |
| `/balcao` | Tela para TV ou tablet na loja |

Outros comandos: `npm run build` (versão de produção), `npm run lint` (verifica o código), `npm run banco:exemplo` (gera `banco/dados-exemplo.sql` a partir de `src/lib/dados-exemplo.ts`).

## Como o código está organizado

| Caminho | O que tem |
| --- | --- |
| `src/app/` | Páginas (uma pasta por endereço) |
| `src/app/painel/acoes.ts` | Ações que gravam no banco (Server Actions). Cada uma confere a sessão |
| `src/proxy.ts` | Manda quem não entrou para `/entrar` |
| `src/components/` | Partes das telas: vitrine, ficha, painel, balcão |
| `src/lib/dados.ts` | Leitura dos dados (MySQL ou exemplos), com cache |
| `src/lib/banco.ts` | Conexão com o MySQL; cria as tabelas num banco vazio |
| `src/lib/regras.ts` | Regras de negócio: estoque, selos, campanhas no ar, mensagem do WhatsApp |
| `src/lib/campanhas-modelo.ts` | Datas prontas das campanhas (Páscoa, Dia das Mães e Dia dos Pais calculados por ano) |
| `banco/` | Tabelas (`schema.sql`) e dados de exemplo (`dados-exemplo.sql`) |
| `deploy/app.js` e `.github/workflows/publicar.yml` | Publicação automática na hospedagem |
| `docs/` | Funcionalidades, modelo de dados, publicação e próximos passos |
| `mockup/` | Código-fonte das telas do mockup, para referência |

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript, MySQL (`mysql2`). Esta versão do Next.js mudou bastante: antes de mexer, leia o guia em `node_modules/next/dist/docs/` (o arquivo `AGENTS.md` explica).

## Como trabalhar juntos

1. Crie um branch por tarefa a partir do `main` (exemplo: `feature/fotos-varias`).
2. Abra um pull request para o `main`: o GitHub roda a verificação e a compilação sozinho.
3. Peça revisão de outra pessoa do time. Ao juntar no `main`, o app é publicado.
4. Decisões que mudam o escopo entram em `docs/funcionalidades.md` no mesmo pull request.

**Nunca coloque senhas no código.** Elas ficam nos Secrets do GitHub (docs/publicar.md) ou no seu `.env.local`, que não vai para o repositório.
