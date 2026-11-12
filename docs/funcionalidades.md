# Funcionalidades

Uma vitrine com sacola: quem compra escolhe os doces, confere na sacola e envia o pedido pelo WhatsApp, com o recibo já escrito. Nada é gravado no banco.

Preços, sabores, quantidades e textos que aparecem no mockup são exemplos. Só a foto da palha italiana é real.

## Vitrine, sacola e pedido pelo WhatsApp

### Vitrine (cliente)

- No topo, "Aberto agora · até 18h" ou "Fechado · abre amanhã às 9h", pelo horário de cada dia em Dados da loja (horário de Brasília). Sem horário cadastrado, não aparece.
- Banner da campanha ativa (o mesmo componente da prévia do painel): a frase e, embaixo, o prazo ("Encomende até 20/12", "Faltam 3 dias para encomendar", "Encomendas encerradas"), com botão que filtra os doces da campanha. Campanha sem doce na vitrine não ganha chip nem botão.
- No cabeçalho, os botões redondos **Falar com a Mone** (folha do WhatsApp para dúvidas) e **Área da loja**.
- Destaque da semana (carro-chefe), só com 3 doces ou mais na vitrine; o doce do destaque não se repete na lista. Banner de campanha sem doce próprio fica com a logo.
- Categorias em abas que ficam presas no topo enquanto a pessoa rola: Todos, campanha ativa, Brigadeiros, Palhas, Bolos de pote, Caixas e kits. Tocar numa aba, em Favoritos ou em "Ver doces de…" leva até a lista.
- Duas seções: **Pronta entrega hoje** ("Pronta entrega" quando a quantidade não foi salva hoje) e **Sob encomenda** ("Feitos para você. O dia você combina no WhatsApp.").
- Doces em **lista**, um por linha: foto quadrada pequena, nome, descrição curta, situação do estoque, selo (Novo, Mais vendido, Últimas unidades, campanha), "Sem glúten" quando o doce não leva trigo e a cozinha não usa trigo, preço ("a partir de R$ 9,00" quando os sabores têm preços diferentes), favorito e o selo "3 na sacola". Esgotado mostra "Peça para amanhã".
- **Como funciona** no rodapé: "Monte sua sacola e envie o pedido pelo WhatsApp", retirada, entrega, pagamento e horário (só o que estiver preenchido em Dados da loja), "Falar com a Mone no WhatsApp" e o número com DDD.
- Barra de baixo: **Início · Favoritos · Sacola**, com o selo da quantidade na sacola.

### Ficha do doce (cliente)

- Foto, Voltar, **Compartilhar** (o compartilhar do celular; sem ele, copia o link e mostra "Link copiado") e favorito. O link leva nome, descrição e foto do doce (Open Graph), para ficar bonito no WhatsApp.
- Situação do estoque em faixas, sem o número; nome, descrição, preço ("a partir de" quando for o caso) e unidade.
- Alergênicos logo depois do preço: "Contém: leite, trigo", "Pode conter: …" (ingredientes da cozinha que o doce não leva) ou, sem informação, "Alergênicos: pergunte no WhatsApp antes de pedir".
- **Quantos de cada?** (doce com 2 ou mais sabores ou tamanhos): uma linha por opção com o preço e − 0 +. Doce sem opções tem "Qtd." na barra, começando em 1. O botão dourado diz **Adicionar 3 · R$ 30,00** e põe na sacola sem sair da ficha ("Na sacola" por 1,5 s). Embaixo: "Na sua sacola: 1x Tradicional, 1x Ninho · Ver sacola" e, na barra, "Sacola: 4 itens · Ver sacola".
- Limite por doce, somando o que já está na sacola: a quantidade de hoje, 20 com a contagem de outro dia e 99 sob encomenda ("Para mais unidades, combine no WhatsApp"). No máximo 20 linhas diferentes na sacola.
- Sob encomenda: "Fica pronto em 3 dias. O mais cedo é dom., 15/11. O dia e o horário você combina com a Mone no WhatsApp."
- "Tirar uma dúvida no WhatsApp", composição e conservação.
- Sem beco sem saída: esgotado vira **Esgotou hoje · Pedir para outro dia**; doce só de campanha fora de época diz quando volta e leva para "Ver o que tem hoje"; doce de campanha com as encomendas encerradas (ou sem tempo de ficar pronto) oferece "Perguntar no WhatsApp".

### Sacola e recibo pelo WhatsApp (cliente)

- **Sua sacola** (`/sacola`): um cartão por doce, na ordem do cardápio, com uma linha por sabor ou tamanho e − n + (com 1 unidade, o − vira lixeira, com "Desfazer" por 6 s). Pedido misto mostra os blocos "Pronta entrega" e "Sob encomenda · pronto a partir de …" (uma data só, a mais tardia).
- Total dos doces, nome opcional (lembrado neste celular), "Como funciona" com o horário e a prévia da mensagem com "Copiar o pedido".
- A sacola confere tudo com o cardápio do dia: preço novo ("Preço atualizado (antes R$ 9,00)"), quantidade cortada pelo estoque de hoje, esgotado, opção que saiu, doce que saiu da vitrine e campanha encerrada. O que não vai no pedido fica apagado, fora do total e do recibo, com "Tirar".
- **Enviar pedido no WhatsApp** abre a conversa da loja com o recibo: número do pedido (4 dígitos), nome, itens agrupados por doce, total e "Aguardo a confirmação para combinar retirada ou entrega, dia, horário e pagamento." Com a loja fechada, o rodapé diz "Fechado no momento · Abrimos terça às 9h" e o envio continua liberado.
- **Pedido nº 4821 no WhatsApp** (`/sacola/enviado`): "O pedido só vale depois que a Mone confirmar", abrir o WhatsApp de novo, copiar o pedido, colocar os doces de volta na sacola, **Pedir uma mudança** e **Cancelar pelo WhatsApp** (mensagens prontas com o número).
- Tudo fica só no celular: a sacola some 7 dias depois da última mudança e o último pedido, 7 dias depois do envio. Retirada ou entrega, dia, horário e pagamento são combinados no WhatsApp; nada vai para o banco e nada baixa o estoque sozinho.

### Painel da dona

Entrada em `/entrar` com o e-mail e a senha de cada pessoa. Só entra quem estiver em **Acessos**. Tudo o que é salvo vai para o banco e aparece na vitrine na hora.

- **Senha de cada pessoa:** a administração cadastra a pessoa em Acessos e o app cria uma senha provisória (palavra + 4 números, vale 7 dias), mostrada uma vez só, com o botão "Mandar convite pelo WhatsApp". No primeiro acesso, a pessoa cria a própria senha (pelo menos 8 letras ou números) antes de ver o painel.
- **Esqueci a senha:** a tela de entrar leva a `/entrar/esqueci`, que pede uma senha nova pelo WhatsApp. Quem administra toca em "Gerar senha nova" no cartão da pessoa e manda a nova provisória.
- **Chave de emergência:** a `PAINEL_SENHA` vale só para os e-mails de `ADMIN_EMAILS` (Administração fixa). Entrar com ela leva sempre a "Crie sua senha" e derruba as outras sessões dessa pessoa.
- **Limite de tentativas:** 10 senhas erradas em 15 minutos do mesmo e-mail no mesmo IP, ou 30 do mesmo IP, bloqueiam por 15 minutos. Nunca bloqueia só pelo e-mail.
- **Sessão:** quem usa o painel pelo menos uma vez por mês continua conectado (a sessão de 30 dias se renova). Quando a sessão termina, a tela de entrar explica e, depois de entrar, volta para a página em que a pessoa estava.
- **Minha conta** (`/painel/conta`, tocando no próprio nome no alto do painel): nome, trocar senha (os outros aparelhos saem), sair deste celular e sair de todos os aparelhos.
- **Como usar:** guia em passos que abre sozinho no primeiro acesso, depois de criar a senha, e depois pelo botão "Como usar". Mostra só o que o papel da pessoa permite: "Toda manhã… Salvar o dia (ou Está igual a ontem)" para todos, "Acabou um doce? Toque em Esgotou" só para o Estoque e "Os pedidos chegam no WhatsApp" (com o link para o guia) para Equipe e Administração.
- **Guia da loja** (`/guia`, fora do Google): rotina do dia, dicas dos pedidos e respostas prontas do WhatsApp. Atalho no painel. (Versão provisória; a completa vem com a documentação.)
- **Alterações não salvas:** em Novo/Editar doce, Nova/Editar campanha e O que tem hoje, a barra de baixo mostra "• alterações não salvas". Tocar em Voltar ou em qualquer link do app pergunta "Sair sem salvar?" com [Salvar e sair] e [Sair sem salvar] (o X continua editando); recarregar ou fechar a aba faz o navegador perguntar. O aviso de "Salvar e sair" aparece na tela seguinte.
- **Avisos:** erro que é de um campo (do servidor ou da conferência da tela) deixa a borda do campo rosa, escreve o problema embaixo dele e a tela rola até lá.
- **Acessos** (só Administração): adicionar pessoas com nome, e-mail (qualquer um) e papel, gerar senha nova, mudar o papel e tirar o acesso (a pessoa fica guardada como inativa). Dar Administração e mudar o próprio papel pedem confirmação. Quem está em `ADMIN_EMAILS` aparece como "Administração fixa", sem remover nem mudar o papel. O painel nunca fica sem administração.
- **Sem permissão:** quem abre uma parte que o papel não permite volta para o início do painel com uma faixa explicando e dizendo com quem falar.

| Papel | Pode fazer |
| --- | --- |
| Administração | Tudo, inclusive liberar e tirar acessos |
| Equipe | Doces, fotos, campanhas, destaque e quantidades do dia |
| Estoque | Só as quantidades do dia |


- **O que tem hoje** (primeira coisa do painel): quantidade de cada doce da vitrine no dia. Tocar no número abre o teclado numérico para digitar; − e + (48 px) para ajustes. "Esgotou" zera e salva na hora só aquele doce (com Desfazer). Os pedidos não baixam a quantidade sozinhos: depois de confirmar um pedido no WhatsApp, a loja diminui aqui ou toca em Esgotou. A estrela escolhe o destaque e salva na hora (o destaque só aparece na vitrine com 3 doces ou mais, e o painel avisa). "Salvar o dia" fica preso embaixo: cinza "Tudo salvo · hoje 9:12" ou dourado "Salvar o dia (2 doces mudaram)", com borda dourada nos doces alterados; salva só os doces que a pessoa mexeu (não apaga o que outro celular salvou em outro doce) e confirma os que ninguém salvou hoje. O que foi mexido e não salvo fica guardado no celular, por pessoa, até salvar ou sair do painel; ao voltar ao app depois de 3 minutos ou na virada do dia, a tela busca os dados de novo e mantém o que a pessoa mexeu. Resumo com doces na vitrine, esgotados e "Última atualização: hoje 9:12 · por Ana". Em dia de atendimento, se ninguém salvou hoje, a faixa "Você ainda não salvou hoje" com o botão "Está igual a ontem" (salva as mesmas quantidades num toque). Doces escondidos ou de campanha fora do ar ficam na seção recolhida "Fora da vitrine (N)", com o motivo (só Equipe e Administração; o Estoque vê só os doces da vitrine com quantidade). Embaixo: "Cadastrar novo doce", atalhos (Campanhas, Acessos, Dados da loja, Guia da loja, Instalar) e "Sair do painel".
- **Dados da loja** (só Administração): WhatsApp que recebe os pedidos (vale para todos os botões de WhatsApp do app), horário de cada dia (fechado, ou abre e fecha), retirada, entrega, pagamento e ingredientes usados na cozinha. Fica no banco e muda na hora, sem publicar de novo.
- **Ficha do doce:** fotos, nome, preço, descrição, sabores ou tamanhos (cada um com "Preço (opcional)"; vazio = preço do doce), alergênicos em chips (leite, trigo, ovo, castanhas, amendoim, soja ou "Nenhum destes"; doce novo começa "não informado"), composição, conservação, selo, campanhas, sob encomenda com prazo de preparo, quantidade de hoje e se o doce está na vitrine. Mostra uma prévia de como o doce aparece na vitrine (com o "Sem glúten" e o "a partir de" de verdade). Embaixo do preço, "Vai aparecer: R$ 12,50"; preço vazio ou 0 não salva. Doce novo sem foto pergunta "Publicar sem foto?"; "Só em campanhas" sem campanha marcada pergunta antes de salvar. Foto nova mostra "Foto nova · toque em Salvar ficha" e "Desfazer" até salvar ("Trocar foto" quando já tem). Depois de salvar, o aviso diz se o doce aparece e por quê ("Salvo. Já aparece na vitrine.", "Salvo. Aparece como esgotado (quantidade 0).", "Salvo, mas só aparece quando a campanha Natal entrar no ar, em 01/12.", "Salvo, mas não aparece: marque uma campanha."). Salvar a ficha só grava a quantidade de hoje se a pessoa mexeu nela.
- **Campanhas:** lista das campanhas no ar, próximas e encerradas. Criar e editar campanha:
  - datas prontas: Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia do Chocolate, Dia dos Pais, ou outra data qualquer. Se já existe campanha do tipo para a próxima data, o modelo vira "Já criada · abrir";
  - o tipo fica fixo no formulário; "Mudar tipo" muda só o tipo e pergunta se quer usar os textos e as datas do modelo;
  - nome, início, fim, último dia para encomendar (entre o começo e o fim), frase do banner (até 60 letras), cor do banner;
  - doces da campanha: doces do cardápio ou doces criados só para a campanha. Salvar sem nenhum doce pede confirmação;
  - prévia do banner, igual à da vitrine;
  - pausar uma campanha no ar pede confirmação.

### Extra: modo balcão

Tela para TV ou tablet na loja que mostra os doces em sequência, com QR Code para quem compra pedir pelo celular (aponta para o endereço público, `SITE_URL`, com o endereço escrito embaixo). Atualiza sozinha a cada 3 minutos. Sem doce disponível, mostra a logo, o QR e "Encomende pelo WhatsApp (21) 98063-1673".

## Regras de negócio

| Situação | O que a vitrine mostra |
| --- | --- |
| Quantidade de hoje 0 | "Esgotado", cartão apagado, "Peça para amanhã" |
| Quantidade de hoje de 1 a 3 | "Últimas unidades" (faixa e selo automático) |
| Quantidade de hoje acima de 3 | "Tem hoje" |
| Quantidade salva em outro dia | "Pronta entrega · confirme no WhatsApp", sem número (a sacola aceita até 20) |
| Sob encomenda | "Sob encomenda · N dias". Não tem quantidade e nunca fica esgotado |

O número exato só aparece no painel.

- **Sob encomenda:** "pronto a partir de" é hoje mais o prazo de preparo, pulando os dias em que a loja não abre. O dia é combinado no WhatsApp.
- **Prazo da campanha:** depois do último dia para encomendar, os doces sob encomenda só da campanha não entram mais na sacola; também não entram se ficariam prontos depois do fim da campanha.
- **Campanha:** fica no ar entre a data de início e a de fim, a menos que a dona pause.
- **Doce e campanhas:** um doce pode estar em várias campanhas. Na ficha, a dona escolhe se ele aparece "o ano todo" ou "só em campanhas". Um doce "só em campanhas" só aparece na vitrine enquanto alguma das campanhas dele estiver no ar.
- **WhatsApp:** o pedido abre uma conversa com o número da loja e o recibo preenchido. Só vale depois que a Mone responde confirmando; mudar ou cancelar também é pela conversa.

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
| Sacola | `mockup/telas/Carrinho.dc.html` (superado em parte: ver `mockup/README.md`) |
