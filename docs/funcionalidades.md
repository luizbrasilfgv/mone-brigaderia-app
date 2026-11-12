# Funcionalidades

A primeira versão é uma vitrine com encomenda pelo WhatsApp. Pedido dentro do app fica para a fase 2.

Preços, sabores, quantidades e textos que aparecem no mockup são exemplos. Só a foto da palha italiana é real.

## Fase 1: vitrine e encomenda pelo WhatsApp

### Vitrine (cliente)

- Banner da campanha ativa no topo (exemplo: "Natal Mone · Encomendas até 20/12"), com botão que filtra os doces da campanha.
- Destaque da semana (carro-chefe).
- Categorias em chips: Todos, campanha ativa, Brigadeiros, Palhas, Bolos de pote, Caixas e kits.
- Duas seções: **Itens fresquinhos** (prontos hoje) e **Sob encomenda** (feitos com prazo).
- Cartão de cada doce: foto, nome, preço, situação do estoque, etiqueta "Sem glúten" quando for o caso, selo (Novo, Mais vendido, Últimas unidades, campanha) e botão de favorito.
- Aba Favoritos.
- Botão **Encomendar** que abre o WhatsApp com uma mensagem pronta.

### Ficha do doce (cliente)

- Fotos, nome, descrição, preço, sabores.
- Alergênicos: contém ou não glúten, contém ou não lactose.
- Composição e conservação.
- Quantidade disponível hoje.
- Botão **Pedir no WhatsApp**: a mensagem já vai com doce, sabor, quantidade e valor. Para doce sob encomenda, vai também a data escolhida.

### Painel da dona

Entrada em `/entrar` com o e-mail e a senha de cada pessoa. Só entra quem estiver em **Acessos**. Tudo o que é salvo vai para o banco e aparece na vitrine na hora.

- **Senha de cada pessoa:** a administração cadastra a pessoa em Acessos e o app cria uma senha provisória (palavra + 4 números, vale 7 dias), mostrada uma vez só, com o botão "Mandar convite pelo WhatsApp". No primeiro acesso, a pessoa cria a própria senha (pelo menos 8 letras ou números) antes de ver o painel.
- **Esqueci a senha:** a tela de entrar leva a `/entrar/esqueci`, que pede uma senha nova pelo WhatsApp. Quem administra toca em "Gerar senha nova" no cartão da pessoa e manda a nova provisória.
- **Chave de emergência:** a `PAINEL_SENHA` vale só para os e-mails de `ADMIN_EMAILS` (Administração fixa). Entrar com ela leva sempre a "Crie sua senha" e derruba as outras sessões dessa pessoa.
- **Limite de tentativas:** 10 senhas erradas em 15 minutos do mesmo e-mail no mesmo IP, ou 30 do mesmo IP, bloqueiam por 15 minutos. Nunca bloqueia só pelo e-mail.
- **Sessão:** quem usa o painel pelo menos uma vez por mês continua conectado (a sessão de 30 dias se renova). Quando a sessão termina, a tela de entrar explica e, depois de entrar, volta para a página em que a pessoa estava.
- **Minha conta** (`/painel/conta`, tocando no próprio nome no alto do painel): nome, trocar senha (os outros aparelhos saem), sair deste celular e sair de todos os aparelhos.
- **Como usar:** guia em passos que abre sozinho no primeiro acesso, depois de criar a senha, e depois pelo botão "Como usar". Mostra só o que o papel da pessoa permite.
- **Acessos** (só Administração): adicionar pessoas com nome, e-mail (qualquer um) e papel, gerar senha nova, mudar o papel e tirar o acesso (a pessoa fica guardada como inativa). Dar Administração e mudar o próprio papel pedem confirmação. Quem está em `ADMIN_EMAILS` aparece como "Administração fixa", sem remover nem mudar o papel. O painel nunca fica sem administração.
- **Sem permissão:** quem abre uma parte que o papel não permite volta para o início do painel com uma faixa explicando e dizendo com quem falar.

| Papel | Pode fazer |
| --- | --- |
| Administração | Tudo, inclusive liberar e tirar acessos |
| Equipe | Doces, fotos, campanhas, destaque e quantidades do dia |
| Estoque | Só as quantidades do dia |


- **O que tem hoje:** quantidade de cada doce no dia, com − e +. Escolha do destaque da vitrine. Totais de doces na vitrine, esgotados e unidades.
- **Ficha do doce:** fotos, nome, preço, descrição, sabores, glúten e lactose (sim ou não), composição, conservação, selo, campanhas, sob encomenda com prazo de preparo, quantidade de hoje e se o doce está na vitrine. Mostra uma prévia de como o doce aparece na vitrine.
- **Campanhas:** lista das campanhas no ar, próximas e encerradas. Criar e editar campanha:
  - datas prontas: Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia do Chocolate, Dia dos Pais, ou outra data qualquer;
  - nome, início, fim, último dia para encomendar, frase do banner, cor do banner;
  - doces da campanha: doces do cardápio ou doces criados só para a campanha;
  - prévia do banner.

### Extra: modo balcão

Tela para TV ou tablet na loja que mostra os doces em sequência, com QR Code para a cliente pedir pelo celular.

## Regras de negócio

| Situação | O que a vitrine mostra |
| --- | --- |
| Quantidade 0 | "Esgotado", cartão apagado |
| Quantidade de 1 a 3 | "Só restam N" e selo "Últimas unidades" automático |
| Quantidade acima de 3 | "N disponíveis hoje" |
| Sob encomenda | "Sob encomenda · N dias". Não tem quantidade e nunca fica esgotado |

- **Sob encomenda:** a primeira data que a cliente pode escolher é hoje mais o prazo de preparo.
- **Campanha:** fica no ar entre a data de início e a de fim, a menos que a dona pause.
- **Doce e campanhas:** um doce pode estar em várias campanhas. Na ficha, a dona escolhe se ele aparece "o ano todo" ou "só em campanhas". Um doce "só em campanhas" só aparece na vitrine enquanto alguma das campanhas dele estiver no ar.
- **WhatsApp:** a encomenda abre uma conversa com o número da loja e a mensagem preenchida. Nada é gravado no app na fase 1.

## Fase 2: encomenda pelo app

- Sacola com vários doces.
- Retirada na loja ou entrega, com data.
- O pedido continua chegando no WhatsApp da loja, já organizado.
- Pagamento por Pix.

## Telas do mockup

| Tela | Arquivo |
| --- | --- |
| 1. Vitrine | `mockup/telas/Main.dc.html` |
| 2. Ficha do doce | `mockup/telas/Produto.dc.html` |
| 2b. Doce sob encomenda | `mockup/telas/ProdutoEncomenda.dc.html` |
| 3. Painel: o que tem hoje | `mockup/telas/Admin.dc.html` |
| 4. Painel: ficha do doce | `mockup/telas/AdminEditar.dc.html` |
| 5. Painel: campanhas | `mockup/telas/AdminCampanhas.dc.html` |
| 6. Painel: criar ou editar campanha | `mockup/telas/AdminCampanhaEditar.dc.html` |
| Extra: modo balcão | `mockup/telas/Balcao.dc.html` |
| Fase 2: sacola | `mockup/telas/Carrinho.dc.html` |
