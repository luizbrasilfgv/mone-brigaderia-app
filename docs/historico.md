# Histórico do projeto

Como o app da Mone Brigaderia foi feito, em ordem. O projeto é tocado pelo Luiz, com a dona da loja, e foi construído em conversas com o Claude (Claude Code), que escreveu o código, a documentação e os testes. Cada etapa terminou num commit no `main`; as mensagens dos commits têm o detalhe.

## 1. Conversa inicial e escopo

O Luiz queria um app vitrine para a loja: quem compra vê os doces do dia, abre a ficha de cada um (descrição, alergênicos, composição) e encomenda pelo WhatsApp; a dona controla tudo num painel. Ficou decidido desde o começo:

- Sem loja de aplicativos: um site que se instala no celular (PWA).
- Pedido pelo WhatsApp, sem pagamento no app. O pedido dentro do app ficou para uma "fase 2" (que virou a sacola, na etapa C).
- Português do Brasil, linguagem simples e neutra ("quem compra", "a administração").

## 2. Mockup aprovado

As telas foram desenhadas primeiro no canvas de design do Claude e aprovadas pelo Luiz: vitrine, ficha do doce, doce sob encomenda, painel (o que tem hoje, ficha do doce, campanhas), modo balcão e uma primeira sacola. As cores vieram da etiqueta da loja (chocolate, dourado e pêssego), com as fontes Fraunces e Manrope. O código das telas está em [`mockup/`](../mockup/README.md).

## 3. Pedidos do Leonardo: quantidades e sob encomenda

Ainda no mockup, o Leonardo, que colabora no projeto, pediu duas coisas que mudaram o painel e a vitrine:

- **Quantidades do dia**: a loja diz quanto tem de cada doce hoje ("O que tem hoje"), e a vitrine mostra o que tem e o que esgotou.
- **Sob encomenda**: doces feitos só quando alguém pede, com prazo de preparo em dias, sem quantidade e que nunca esgotam.

## 4. Campanhas

Datas especiais (Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia do Chocolate, Dia dos Pais ou outra) com banner na vitrine, filtro dos doces da campanha, último dia para encomendar e doces criados só para a campanha. As datas móveis (Páscoa, Dia das Mães, Dia dos Pais) são calculadas por ano.

## 5. Código no GitHub

- **11/11/2026**: mockup e documentação inicial no repositório (`dc9fd93`).
- App em **Next.js 16** com todas as telas do mockup, ainda com dados de exemplo (`91811da`).
- O plano inicial sugeria Supabase e Vercel, mas a hospedagem já contratada tem **cPanel com Node.js e MySQL**. O app passou a gravar no MySQL, com login no painel e publicação automática pelo GitHub Actions (`4ac7ab6`).

## 6. Publicação na hospedagem

A publicação foi aprendida na prática, problema por problema ([publicar.md](publicar.md) tem a versão final):

| Problema | Solução |
| --- | --- |
| O servidor tentava escutar no nome da máquina (a hospedagem define `HOSTNAME`) | `deploy/app.js` força `0.0.0.0` (`d31d2eb`) |
| Cancelar uma publicação no meio deixaria metade dos arquivos | No `main`, a próxima publicação espera a anterior (`d24b6c3`) |
| O FTP derrubava a conexão depois de ~20 minutos enviando ~1.600 arquivos | Publicação por **pacote único** (`pacote.tar.gz`), desempacotado pelo `app.js` no servidor (`3bdfff7`) |
| A publicação ia para uma pasta e o app do cPanel olhava para outra | Tudo na pasta `app`, a do app criado no cPanel (`a4b37b0`) |
| A vitrine só abria em `/app` | No cPanel, Application URL com o domínio puro |
| O domínio não abria | No registro.br, os servidores de DNS passaram a ser os da hospedagem |
| As tabelas não eram criadas (MySQL 8.4 negava `REFERENCES`) | Usuário do banco com **todos os privilégios** |
| Difícil saber o que estava errado no servidor | Diagnóstico em `/saude` e erros em `registro.log` na pasta `app` (`b02baf4`) |
| A lista de categorias abria branca, com letra clara | Menus e calendários do sistema no tema escuro (`18a177a`) |

Com o app no ar, o banco ficou só com o doce real (a **palha italiana**, com 3 sabores e preço próprio por sabor) e entrou o mecanismo de migrações (`a9390da`). Um erro que apagava o preço dos sabores ao salvar a ficha foi corrigido logo depois (`6d11c6b`).

## 7. Login: do Google à senha individual

1. **Login com Google** (`4868666`): exigia configurar um projeto no Google Cloud e só servia para quem tem conta Google. Foi abandonado.
2. **E-mail cadastrado + senha da loja** (`02a2434`): funcionava sem configurar nada, mas era uma senha só para todos.
3. A primeira revisão de UX mostrou o furo: com a senha da loja, qualquer pessoa entrava com o e-mail de outra, inclusive como Administração. Na **etapa A**, cada pessoa passou a ter a **própria senha**, com senha provisória pelo WhatsApp, troca obrigatória no primeiro acesso e Minha conta. O Google saiu de vez do código.

## 8. Duas rodadas de revisão de UX

Em 12/11/2026, 4 especialistas (compra no celular, gestão para pequenos negócios, acesso e segurança, operação diária e acessibilidade) revisaram o app, debateram entre si e um moderador fechou as decisões ([revisao-ux.md](revisao-ux.md)):

- **Rodada 1 (o app inteiro)**: 15 mudanças "fazer agora". As principais: login individual (modelo "b"), parar de apagar preço de sabor, quantidade "de hoje" honesta, nada de beco sem saída, alergênicos completos, campanhas com prazo de verdade e um "O que tem hoje" rápido. O porquê: os problemas não eram de visual, e sim de perder venda, dinheiro ou dado.
- **Rodada 2 (sacola e recibo)**: especificação da sacola com recibo pelo WhatsApp. O porquê das escolhas: a loja continua no WhatsApp, que já usa; nada de quem compra vai para o banco; o recibo chega sempre igual, somando certo, com número para conversar.
- **Decisões do Luiz**: WhatsApp e dados da loja no banco (tela Dados da loja), horário de cada dia com aberto/fechado e, comparando com um app de delivery, vitrine em lista, abas fixas e compartilhar doce.

## 9. Implementação em etapas (A a E)

| Etapa | Commit | O que entrou |
| --- | --- | --- |
| A. Login e conta | `69ef22b` | Senha individual (migração 003), senha provisória e convite pelo WhatsApp, Crie sua senha, Minha conta, limite de tentativas, chave de emergência só para `ADMIN_EMAILS`, sessão que se renova, confirmações em Acessos |
| B. Loja e vitrine honesta | `6e4dec0` | Dados da loja no banco (migração 004), horário de cada dia e "Aberto agora", "Como funciona", quantidade honesta e "Salvo por" (migração 005), sem beco sem saída, campanhas prontas para o Natal, traços da cozinha, botão Área da loja |
| C. Sacola | `001bde4` | Sacola e recibo pelo WhatsApp, `/sacola` e `/sacola/enviado`, vitrine em lista com abas fixas, alergênicos completos (migração 006), preço por sabor e "a partir de", compartilhar com Open Graph, ajustes para iPhone |
| D. Painel | `510ade8` | O que tem hoje rápido (digitar, Esgotou, Salvar o dia preso, rascunho no celular), formulários sem armadilhas, "Sair sem salvar?", erros de campo, guia provisório |
| E. Guia e documentação | este | Guia da loja completo em `/guia` (prints reais, respostas prontas com Copiar), "Ver o guia completo" no Como usar, documentação do repositório (este arquivo, [revisao-ux.md](revisao-ux.md), [publicar.md](publicar.md), [modelo-de-dados.md](modelo-de-dados.md), [funcionalidades.md](funcionalidades.md), [proximos-passos.md](proximos-passos.md)) |

Cada etapa foi testada com o app compilado rodando localmente contra um MariaDB, com scripts do Playwright num celular de 390 px, e terminou com `npm run lint` e `npm run build` sem erro.

## Quem participa

- **Luiz**: dono do projeto; decide o escopo e cuida do GitHub e da hospedagem.
- **A dona da loja**: usa o painel e responde os pedidos.
- **Leonardo e Bruno**: colaboradores; vão trabalhar no código pelo GitHub (convites pendentes, [proximos-passos.md](proximos-passos.md#pendências)).
