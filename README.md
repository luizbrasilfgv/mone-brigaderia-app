# Mone Brigaderia: app vitrine

App da Mone Brigaderia, no ar em **https://monebrigaderia.com.br**.

- **Quem compra** vê o que tem hoje, abre a ficha de cada doce (preço por sabor, alergênicos, composição), monta a sacola e envia o pedido pelo WhatsApp, com o recibo já escrito. Sem cadastro e sem pagamento no app: retirada ou entrega, dia e pagamento são combinados na conversa.
- **A loja** cuida de tudo num painel com login (cada pessoa com o seu e-mail e a sua senha): o que tem hoje e em que quantidade, fichas e fotos dos doces, doces sob encomenda, campanhas como Natal e Páscoa, dados da loja (WhatsApp, horário) e quem mais pode entrar.

## Situação

O app está **no ar e funcionando**, com publicação automática a cada push no `main`. Em produção, o cardápio tem só a palha italiana (3 sabores); a dona ainda vai preencher os dados da loja e cadastrar os outros doces. Pendências e ideias: [docs/proximos-passos.md](docs/proximos-passos.md).

| Documento | O que tem |
| --- | --- |
| [docs/funcionalidades.md](docs/funcionalidades.md) | Tudo o que o app faz hoje, por tipo de usuário, e as regras |
| [docs/modelo-de-dados.md](docs/modelo-de-dados.md) | Tabelas e colunas do banco, migrações e dados iniciais |
| [docs/publicar.md](docs/publicar.md) | Como está publicado (cPanel, MySQL, DNS, GitHub Actions) e os problemas já resolvidos |
| [docs/proximos-passos.md](docs/proximos-passos.md) | O que foi feito, o que falta e ideias para depois |
| [docs/historico.md](docs/historico.md) | Como o projeto foi feito, em ordem |
| [docs/revisao-ux.md](docs/revisao-ux.md) | As duas rodadas de revisão de experiência e as decisões |
| [/guia](https://monebrigaderia.com.br/guia) | Guia da loja (para a dona e a equipe), dentro do próprio app |
| [mockup/](mockup/README.md) | Código das telas do mockup aprovado no começo |

Mockup interativo: https://claude.ai/artifact/NbaerYRi3uWoKwrCNHYcPu (peça acesso ao Luiz).

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo (a publicação usa o 22).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

### Sem MySQL (modo demonstração)

Deixe `MYSQL_DATABASE` vazio no `.env.local`. O app usa os doces de exemplo de `src/lib/dados-exemplo.ts` (palha, brigadeiros, bolos de pote, caixas, cento, Natal), e o painel abre sem login, com a faixa "Painel em modo demonstração". Nada é gravado. É o jeito mais rápido de mexer nas telas.

### Com MySQL (ou MariaDB)

1. Crie um banco vazio e um usuário com todos os privilégios nele.
2. No `.env.local`, preencha `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `SESSAO_SEGREDO` (qualquer texto longo), `ADMIN_EMAILS` (o seu e-mail), `PAINEL_SENHA` (a chave de emergência local) e `SITE_URL=http://localhost:3000`.
3. `npm run dev` e abra a vitrine: na primeira visita, o app cria as tabelas, carrega a palha italiana e aplica as migrações.
4. Para entrar no painel pela primeira vez, vá em `/entrar` com o e-mail de `ADMIN_EMAILS` e a `PAINEL_SENHA`: o painel pede para criar a sua senha. Depois, cadastre outras pessoas em **Acessos**.

As fotos enviadas pelo painel vão para `./uploads` (ou `UPLOAD_DIR`). Para testar como no servidor: `npm run build` e `node .next/standalone/server.js` (copie antes `.next/static` para `.next/standalone/.next/static` e `public` para `.next/standalone/public`).

### Endereços

| Endereço | Tela |
| --- | --- |
| `/` | Vitrine |
| `/doce/palha-italiana` | Ficha do doce |
| `/sacola` | Sacola: confere os doces e envia o pedido pelo WhatsApp (fica só no celular) |
| `/sacola/enviado` | Pedido enviado: reenviar, copiar, pedir mudança ou cancelar |
| `/balcao` | Tela para TV ou tablet na loja, com QR Code |
| `/guia` | Guia da loja (público, fora do Google) |
| `/entrar` | Entrada do painel (e-mail e senha de cada pessoa) |
| `/entrar/esqueci` | Esqueci a senha: pedir uma senha nova pelo WhatsApp |
| `/painel` | O que tem hoje (quantidades), atalhos e Sair |
| `/painel/criar-senha` | Criar a própria senha no primeiro acesso |
| `/painel/doces/novo` e `/painel/doces/<id>` | Ficha do doce |
| `/painel/campanhas` | Campanhas (criar em `/painel/campanhas/nova/<tipo>`) |
| `/painel/loja` | Dados da loja (só Administração) |
| `/painel/acessos` | Acessos: quem entra, o que pode fazer, senha provisória (só Administração) |
| `/painel/conta` | Minha conta: nome, trocar senha e sair |
| `/saude` | Diagnóstico do servidor (configurações e banco, sem senhas) |

### Comandos

| Comando | Para quê |
| --- | --- |
| `npm run dev` | App em modo de desenvolvimento |
| `npm run lint` | Verifica o código (o GitHub roda antes de publicar) |
| `npm run build` | Versão de produção (`.next/standalone`) |
| `npm run banco:iniciais` | Gera `banco/dados-iniciais.sql` a partir de `src/lib/dados-exemplo.ts` (só os doces reais) |

## Mapa do código

| Caminho | O que tem |
| --- | --- |
| `src/app/` | Páginas, uma pasta por endereço (App Router) |
| `src/app/painel/acoes.ts` | Ações que gravam no banco (Server Actions): doces, quantidades, destaque, campanhas, dados da loja, acessos, conta. Cada uma confere a sessão e o papel |
| `src/app/entrar/` | Entrar, esqueci a senha e a ação de login |
| `src/app/guia/` | Guia da loja (prints em `public/guia/`) |
| `src/app/saude/route.ts` | Diagnóstico `/saude` |
| `src/app/fotos/[arquivo]/route.ts` | Entrega as fotos enviadas pelo painel (pasta `UPLOAD_DIR`) |
| `src/proxy.ts` | Manda quem não entrou para `/entrar` e renova a sessão de quem usa |
| `src/components/vitrine/`, `ficha/`, `sacola/`, `painel/` | Partes das telas de cada área |
| `src/components/painel/comum.tsx` | Peças do painel: avisos, confirmações (`<dialog>`), "Sair sem salvar?", contador, chave liga/desliga |
| `src/components/ui.ts` e `Icones.tsx` | Classes repetidas (cartão, botões, barra fixa) e ícones |
| `src/lib/dados.ts` | Leitura dos dados (MySQL ou exemplos), com cache por marcas |
| `src/lib/banco.ts` | Conexão com o MySQL; cria as tabelas, carrega os dados iniciais e aplica as migrações |
| `src/lib/regras.ts` | Regras de negócio: estoque honesto, selos, "a partir de", alergênicos e "Sem glúten", campanhas no ar e prazo de encomenda |
| `src/lib/sacola.ts` | Sacola (funções puras): limites, conferência com o cardápio do dia e o recibo do WhatsApp |
| `src/lib/hooks.ts` | O que fica no celular (favoritos, sacola, nome, último pedido) e o relógio ("agora" e "hoje") |
| `src/lib/loja.ts` | Nome, logo, dados da loja e padrões, links do WhatsApp |
| `src/lib/horarios.ts` | Horário de cada dia: "Aberto agora", "Atendimento: …", dias fechados e "hoje" em Brasília |
| `src/lib/auth.ts`, `sessao.ts`, `senhas.ts` | Entrada com senha, limite de tentativas, sessão assinada e senhas (scrypt, senha provisória) |
| `src/lib/papeis.ts` e `painel.ts` | O que cada papel pode fazer; proteção das páginas do painel |
| `src/lib/campanhas-modelo.ts` | Datas prontas das campanhas (Páscoa, Dia das Mães e Dia dos Pais calculados por ano) |
| `src/lib/fotos.ts`, `texto.ts`, `copiar.ts` | Fotos enviadas, ids a partir do nome e e-mail digitado errado, copiar texto |
| `src/lib/tipos.ts` e `dados-exemplo.ts` | Tipos do domínio e o catálogo do modo demonstração |
| `banco/schema.sql` | Tabelas do banco base |
| `banco/migracoes/` | Mudanças no banco, aplicadas uma vez cada (001 a 006) |
| `banco/dados-iniciais.sql` | O que um banco novo recebe (categorias e a palha italiana) |
| `deploy/app.js` | Arquivo de entrada no servidor: lê o `.env`, desempacota a versão e inicia o app |
| `.github/workflows/publicar.yml` | Verifica, compila e publica a cada push no `main` |
| `public/` | Logo, ícones, foto da palha, manifesto do painel e prints do guia |
| `docs/` e `mockup/` | Documentação e telas do mockup |

## Stack

- **Next.js 16** (App Router, Cache Components, Server Actions, `proxy.ts`), **React 19**, **TypeScript**, **Tailwind CSS 4**.
- **MySQL** (`mysql2`), sem ORM; MySQL 8.4 na hospedagem, MariaDB funciona localmente.
- PWA (manifesto da vitrine e do painel), `qrcode.react` no balcão.
- Hospedagem compartilhada com cPanel (Setup Node.js App, Passenger), publicação por GitHub Actions + FTPS.

Esta versão do Next.js mudou bastante: antes de mexer, leia o guia em `node_modules/next/dist/docs/` (o `AGENTS.md` explica).

## Como trabalhar juntos

1. Crie um branch por tarefa a partir do `main` (exemplo: `feature/fotos-varias`).
2. Abra um pull request para o `main`: o GitHub roda a verificação e a compilação sozinho.
3. Peça revisão de outra pessoa do time. **Juntar no `main` publica o app** em monebrigaderia.com.br.
4. Mudança no banco entra como arquivo novo em `banco/migracoes/` (o próximo número), nunca mexendo no `schema.sql`.
5. Decisões que mudam o escopo entram em `docs/funcionalidades.md` no mesmo pull request; mudança no jeito de usar o painel entra também no guia (`src/app/guia/page.tsx`).
6. Textos em português do Brasil, simples e com linguagem neutra ("quem compra", "a administração").

**Nunca coloque senhas no código.** Elas ficam nos Secrets do GitHub ([docs/publicar.md](docs/publicar.md)) ou no seu `.env.local`, que não vai para o repositório.
