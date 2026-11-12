# Funcionalidades

O app é a vitrine da Mone Brigaderia com sacola: quem compra escolhe os doces, confere na sacola e envia o pedido pelo WhatsApp, com o recibo já escrito. A loja cuida de tudo num painel com login, e cada pessoa da loja vê só o que o papel dela permite.

Este documento descreve o que o app faz **hoje**, por tipo de usuário, e as regras. O passo a passo para a loja (com prints) está no próprio app, em [`/guia`](https://monebrigaderia.com.br/guia). Ideias e pendências: [proximos-passos.md](proximos-passos.md).

| Quem | Onde | O que faz |
| --- | --- | --- |
| Quem compra | `/`, `/doce/<id>`, `/sacola` | Vê o que tem hoje, monta a sacola e envia o pedido pelo WhatsApp. Sem cadastro |
| Estoque | `/painel` | Só as quantidades do dia |
| Equipe | `/painel` | Quantidades, doces, fotos, destaque e campanhas |
| Administração | `/painel` | Tudo, mais Dados da loja e Acessos |

## Quem compra

### Vitrine (`/`)

- No topo: logo, "Vitrine de hoje" e **Aberto agora · até 18h** (bolinha verde) ou **Fechado · abre amanhã às 9h**, pelo horário de cada dia em Dados da loja (horário de Brasília). Sem horário cadastrado, não aparece.
- Botões redondos **Falar com a Mone** (folha do WhatsApp para dúvidas) e **Área da loja** (ícone de pessoa, leva a `/entrar`).
- **Banner da campanha** no ar: a frase e, embaixo, o prazo ("Encomende até 20/12", "Faltam 3 dias para encomendar", "Encomendas encerradas"), com o botão "Ver doces de Natal". Campanha sem doce na vitrine não ganha banner com botão nem aba.
- **Destaque** (carro-chefe), só com 3 doces ou mais na vitrine; o doce do destaque não se repete na lista.
- **Abas de categoria** presas no topo enquanto a pessoa rola: Todos, a campanha no ar e as categorias que têm doce.
- Duas seções: **Pronta entrega hoje** ("Pronta entrega" quando a quantidade não foi salva hoje) e **Sob encomenda** ("Feitos para você. O dia você combina no WhatsApp.").
- Doces em **lista**, um por linha: foto quadrada, nome, descrição curta, situação do estoque, selo (Novo, Mais vendido, Últimas unidades), "Sem glúten" quando vale, preço ("a partir de R$ 9,00" quando os sabores têm preços diferentes), favorito e o selo "3 na sacola". Doce sem foto usa um desenho provisório.
- **Como funciona** no rodapé: "Monte sua sacola e envie o pedido pelo WhatsApp. A Mone confirma por lá.", retirada, entrega, pagamento e horário (só o que estiver preenchido), "Falar com a Mone no WhatsApp" e o número com DDD. Embaixo, "Instalar o app" e "Área da loja".
- Barra de baixo: **Início · Favoritos · Sacola**, com o selo da quantidade na sacola. Favoritos ficam só no celular ("Toque no coração de um doce para guardar aqui").

### Ficha do doce (`/doce/<id>`)

- Foto, Voltar, **Compartilhar** (o compartilhar do celular; sem ele, copia o link e mostra "Link copiado") e favorito. O link leva nome, descrição e foto (Open Graph), para ficar bonito no WhatsApp.
- Situação do estoque em faixas (sem o número), nome, descrição, preço e unidade.
- **Alergênicos logo depois do preço**: "Contém: leite, trigo", "Pode conter: …" (ingredientes da cozinha que o doce não leva) ou, sem informação, "Alergênicos: pergunte no WhatsApp antes de pedir".
- **Quantos de cada?** (doce com 2 ou mais sabores ou tamanhos): uma linha por opção com o preço e − 0 +. Doce sem opções tem "Qtd." na barra, começando em 1.
- Botão dourado **Adicionar 3 · R$ 30,00**: põe na sacola sem sair da ficha ("Na sacola" por 1,5 s). Embaixo: "Na sua sacola: 1x Tradicional, 1x Ninho · Ver sacola"; na barra, "Sacola: 4 itens · Ver sacola".
- Sob encomenda: "Fica pronto em 3 dias. O mais cedo é dom., 15/11. O dia e o horário você combina com a Mone no WhatsApp."
- "Tirar uma dúvida no WhatsApp", composição e conservação.
- Sem beco sem saída: esgotado vira **Esgotou hoje · Pedir para outro dia** (mensagem pronta no WhatsApp); doce só de campanha fora de época diz "Este doce volta no Natal" e leva para "Ver o que tem hoje"; doce de campanha com as encomendas encerradas (ou sem tempo de ficar pronto) oferece "Perguntar no WhatsApp".

### Sacola (`/sacola`)

- Um cartão por doce, na ordem do cardápio, com uma linha por sabor ou tamanho, "R$ 10,00 cada" e − n + (com 1 unidade, o − vira lixeira, com "Desfazer" por 6 s). "+ Outra opção" e "Continuar escolhendo".
- Pedido misto mostra os blocos "Pronta entrega" e "Sob encomenda · pronto a partir de …" (uma data só, a mais tardia).
- A sacola **confere tudo com o cardápio do dia** sempre que abre: preço novo ("Preço atualizado (antes R$ 9,00)"), quantidade cortada pelo estoque de hoje ("Tem menos hoje. Ajustamos sua quantidade."), esgotado, opção que saiu, doce que saiu da vitrine, campanha encerrada. O que não vai no pedido fica apagado, fora do total e do recibo, com "Tirar".
- **Total dos doces**, nome opcional ("Seu nome e sua sacola ficam só neste celular"), **Como funciona** em 3 passos com o horário, e "Ver a mensagem que vai no WhatsApp" com "Copiar o pedido".
- **Enviar pedido no WhatsApp** (verde, preso embaixo) abre a conversa da loja com o recibo. Com a loja fechada, o rodapé diz "Fechado no momento · Abrimos terça às 9h" e o envio continua liberado.
- Sacola vazia: "Ver a vitrine", "Falar com a Mone no WhatsApp" e o cartão do último pedido (por 7 dias).

### Pedido enviado (`/sacola/enviado`)

- "Pedido nº 4821 no WhatsApp" e o destaque **O pedido só vale depois que a Mone confirmar**.
- "A mensagem não foi?": Abrir o WhatsApp de novo (mesma mensagem e mesmo número), Copiar o pedido e "Colocar os doces de volta na sacola".
- "Mudou de ideia?": **Pedir uma mudança** e **Cancelar pelo WhatsApp**, com a mensagem pronta e o número do pedido. "Apagar a mensagem no WhatsApp não cancela o pedido."

### Instalar e balcão

- **Instalar o app**: a vitrine e o painel podem ser instalados no celular (PWA). No Android, o botão abre a instalação do Chrome; no iPhone, mostra o passo a passo do Safari. Some quando já está instalado. O painel instalado se chama "Painel Mone" e abre direto em `/painel`.
- **Modo balcão** (`/balcao`): tela para TV ou tablet na loja que mostra os doces em sequência, com QR Code para o endereço público (`SITE_URL/?origem=balcao`) e o endereço escrito. Atualiza sozinha a cada 3 minutos. Sem doce disponível, mostra a logo, o QR e o WhatsApp. Abre pelo Menu do painel (Tela do balcão, na mesma janela) e tem um botão pequeno "Painel", no canto de cima, para voltar.
- **Sem digitar endereço**: o app instalado não tem barra de endereço (e, no iPhone, nem botão Voltar), então tudo tem caminho dentro do app. A tela de entrar tem "Ver a vitrine"; o guia tem Vitrine e Painel no topo e no fim; a página não encontrada leva à vitrine e, para quem entrou, ao painel; a página de erro tem "Tentar de novo", a vitrine e o painel. Só `/saude` (técnica) fica só por endereço.

## Todos do painel

- **Entrar** (`/entrar`) com o e-mail e a senha de cada pessoa. Só entra quem a Administração cadastrou em Acessos. Campos com 16 px (sem zoom no iPhone), botão "Mostrar" e o e-mail que fica no erro.
- **Menu** (em todas as telas do painel): botão "Menu" (três linhas + rótulo, 44 px) sempre no canto de cima, à direita, ao lado do Voltar. Abre uma folha (`<dialog>`: Esc fecha, o foco fica dentro e o fundo fica inerte) com as partes em quadrados, agrupadas e só com o que o papel permite:
  - **Dia a dia**: O que tem hoje · Cadastrar novo doce (Equipe) · Campanhas (Equipe).
  - **Loja**: Dados da loja (Administração) · Acessos (Administração) · Tela do balcão.
  - **Ajuda**: Como usar · Guia da loja · Instalar no celular (some quando já instalado).
  - **Conta**: Minha conta · Ver vitrine · Sair (pergunta "Sair do painel neste celular?").
  - A tela atual fica marcada (`aria-current="page"`; nas telas de campanha, Campanhas). Tocar nela só fecha o Menu. Com alterações não salvas, os itens do Menu passam pela pergunta **Sair sem salvar?** e o Sair avisa que o que mudou se perde.
  - Em **Crie sua senha**, o Menu tem só o mínimo: Guia da loja, Ver vitrine e Sair.
- **Primeiro acesso**: a senha provisória (palavra + 4 números, vale 7 dias) leva a **Crie sua senha** (`/painel/criar-senha`, pelo menos 8 letras ou números, sem exigir maiúscula ou símbolo). Só depois abre o painel e o guia **Como usar**. O convite pelo WhatsApp leva o link para entrar e ensina Menu › Instalar no celular.
- **Como usar**: guia em passos que abre sozinho no primeiro acesso e depois pelo botão "Como usar" da tela inicial ou por Menu › Como usar (de outra tela, o Menu leva ao início com `?como-usar=1`, que abre o guia e sai do endereço). Mostra só o que o papel permite; um dos passos apresenta o Menu. No último passo, "Ver o guia completo" (`/guia`); no passo dos pedidos, "Ver as respostas prontas" (`/guia#respostas`).
- **Guia da loja** (`/guia`): página pública, fora do Google, com o passo a passo de tudo (com prints reais), as 4 respostas prontas do WhatsApp com botão Copiar, as etiquetas sugeridas e como criar respostas rápidas no WhatsApp Business. Os passos citam o Menu ("Menu › Acessos"). No painel, Menu › Guia da loja e o atalho da tela inicial.
- **Minha conta** (`/painel/conta`, por Menu › Minha conta ou tocando no próprio nome no alto da tela inicial): nome, trocar senha (os outros aparelhos saem), sair deste celular e sair de todos os aparelhos.
- **Esqueci a senha** (`/entrar/esqueci`): abre o WhatsApp da loja com o pedido de senha nova pronto; a Administração gera uma provisória em Acessos.
- **Sessão**: dura 30 dias e se renova quando faltam menos de 7. Quem usa o painel pelo menos uma vez por mês continua conectado. Quando a sessão termina, a tela de entrar explica e, depois de entrar, volta para a página em que a pessoa estava.
- **Sem permissão**: quem abre uma parte que o papel não permite volta ao início do painel com uma faixa explicando e dizendo com quem falar.
- **Avisos**: sucesso em verde (some sozinho); erro em rosa, que fica até fechar e traz o que fazer ("Tentar de novo" quando a internet cai, "Entrar de novo" quando a sessão termina). Erro de um campo deixa a borda rosa, escreve o problema embaixo e a tela rola até lá.
- **Alterações não salvas**: em O que tem hoje, Novo/Editar doce e Nova/Editar campanha, a barra mostra "• alterações não salvas"; Voltar, os itens do Menu ou qualquer link do app pergunta **Sair sem salvar?** ([Salvar e sair] [Sair sem salvar], o X continua editando); recarregar ou fechar a aba faz o navegador perguntar.
- **Sair do painel**: botão no fim da tela inicial e Menu › Sair, com confirmação.
- **Tela inicial**: além do Menu, continuam os atalhos (Campanhas, Acessos, Dados da loja, Guia da loja, Ver vitrine, Instalar no celular, conforme o papel), "Cadastrar novo doce", o nome com "Minha conta e sair", "Como usar" e "Sair do painel".

## Estoque (e todos os outros papéis)

**O que tem hoje** é a primeira coisa do painel:

- Quantidade de cada doce da vitrine. Tocar no número abre o teclado numérico; − e + (48 px) para ajustes.
- **Salvar o dia** fica preso embaixo: cinza "Tudo salvo · hoje 9:12" ou dourado "Salvar o dia (2 doces mudaram)", com borda dourada nos doces alterados. Salva só os doces que a pessoa mexeu (não apaga o que outro celular salvou em outro doce) e confirma os que ninguém salvou hoje.
- **Você ainda não salvou hoje** (em dia de atendimento): faixa com "Está igual a ontem", que salva as mesmas quantidades num toque.
- **Esgotou**: zera e salva na hora só aquele doce, com "Desfazer".
- Resumo: doces na vitrine, esgotados e "Última atualização: hoje 9:12 · por Ana".
- O que foi mexido e não salvo fica guardado no celular, por pessoa, até salvar ou sair do painel. Ao voltar ao app depois de 3 minutos ou na virada do dia, a tela busca os dados de novo e mantém o que a pessoa mexeu.
- O Estoque vê só os doces da vitrine que têm quantidade. Os pedidos não baixam a quantidade sozinhos: depois de confirmar um pedido no WhatsApp, a loja diminui aqui ou toca em Esgotou.

## Equipe (além do Estoque)

- **Destaque**: a estrela de cada doce em O que tem hoje escolhe o destaque e salva na hora (o painel avisa que ele só aparece com 3 doces ou mais).
- **Fora da vitrine (N)**: seção recolhida com os doces escondidos ou de campanha fora do ar, com o motivo.
- **Ficha do doce** (`/painel/doces/novo` e `/painel/doces/<id>`): fotos ("Trocar foto", "Foto nova · toque em Salvar ficha" e "Desfazer"; a foto é reduzida no celular antes de enviar), nome, preço ("Vai aparecer: R$ 12,50"; vazio ou 0 não salva), unidade, categoria, descrição, sabores ou tamanhos com "Preço (opcional)", alergênicos em chips (doce novo começa "não informado"), composição, conservação, selo, onde aparece ("O ano todo" ou "Só em campanhas") e campanhas, sob encomenda com prazo, quantidade de hoje, "Na vitrine" e a prévia de como aparece na vitrine.
  - Doce novo sem foto pergunta "Publicar sem foto?"; "Só em campanhas" sem campanha marcada pergunta antes de salvar.
  - Depois de salvar, o aviso diz se o doce aparece e por quê ("Salvo. Já aparece na vitrine.", "Salvo, mas só aparece quando a campanha Natal entrar no ar, em 01/12.", "Salvo, mas não aparece: marque uma campanha.").
  - Salvar a ficha só grava a quantidade de hoje se a pessoa mexeu nela.
- **Campanhas** (`/painel/campanhas`): no ar, próximas e encerradas.
  - Datas prontas: Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia do Chocolate, Dia dos Pais (Páscoa, Dia das Mães e Dia dos Pais calculados por ano) ou outra data. Se a campanha do tipo já existe, o modelo vira "Já criada · abrir".
  - Tipo fixo no formulário ("Mudar tipo" pergunta se quer usar os textos e as datas do modelo); nome, início, fim, último dia para encomendar (entre o início e o fim), frase do banner (até 60 letras, com contador), cor.
  - Doces da campanha (do cardápio ou só da campanha); salvar sem nenhum doce pede confirmação. Prévia do banner igual à da vitrine.
  - Pausar uma campanha no ar (a chave do cartão) pede confirmação.

## Administração (além da Equipe)

- **Dados da loja** (`/painel/loja`): WhatsApp que recebe os pedidos (validado: 55 + DDD; "Testar"), horário de cada dia (fechado, ou abre e fecha), retirada, entrega, pagamento e ingredientes usados na cozinha. Fica no banco e muda na hora, sem publicar de novo. Prévia de como aparece na vitrine.
- **Acessos** (`/painel/acessos`):
  - Adicionar pessoa com nome, e-mail (qualquer um; avisa domínio digitado errado, como "gmial.com") e papel. **Dar acesso** e **Gerar senha nova** criam uma senha provisória mostrada uma vez só, com "Mandar convite pelo WhatsApp" (endereço, e-mail e senha prontos) e "Copiar".
  - Cartão de cada pessoa com a situação ("Ainda não entrou · provisória vence 19/11", "Último acesso em…"), o papel e a lixeira. Dar Administração, mudar o próprio papel, gerar senha nova e tirar o acesso pedem confirmação. Tirar o acesso vale na hora (a pessoa fica guardada como inativa).
  - Faixa "Recomendado: ter 2 pessoas na Administração" quando só há uma. O painel nunca fica sem Administração.
  - Quem está em `ADMIN_EMAILS` aparece como "Administração fixa", sem lixeira nem troca de papel.

| Papel | Pode fazer |
| --- | --- |
| Administração | Tudo, inclusive Dados da loja e Acessos |
| Equipe | Doces, fotos, campanhas, destaque e quantidades do dia |
| Estoque | Só as quantidades do dia |

## Regras de negócio

### Estoque honesto

| Situação | O que a vitrine mostra |
| --- | --- |
| Quantidade de hoje 0 | "Esgotado", cartão apagado, "Peça para amanhã" |
| Quantidade de hoje de 1 a 3 | "Últimas unidades" (faixa e selo automático) |
| Quantidade de hoje acima de 3 | "Tem hoje" |
| Quantidade salva em outro dia | "Pronta entrega · confirme no WhatsApp", sem número |
| Sob encomenda | "Sob encomenda · N dias". Não tem quantidade e nunca esgota |

- O número exato só aparece no painel.
- Vale a quantidade salva mais recente. "Hoje" é o dia no horário de Brasília.
- Sob encomenda: "pronto a partir de" é hoje mais o prazo de preparo, pulando os dias em que a loja não abre (Dados da loja). O dia é combinado no WhatsApp.

### Sacola

- Fica **só no celular** de quem compra; nada vai para o banco. Some 7 dias depois da última mudança (com o aviso "Sua sacola de 03/11 foi esvaziada"); sem armazenamento no navegador, vale enquanto a página estiver aberta, com aviso.
- Cada linha é o doce mais o **nome** do sabor (o id do sabor muda a cada "Salvar ficha").
- Limite por doce, somando o que já está na sacola: a quantidade de hoje; 20 quando a contagem é de outro dia; 99 sob encomenda ("Para mais unidades, combine no WhatsApp"). No máximo 20 linhas diferentes.
- O preço que vale é o do cardápio na hora de enviar.

### Recibo pelo WhatsApp

Enviar a mensagem é fazer o pedido, e ele só vale depois que a loja responde confirmando. Formato (montado em `src/lib/sacola.ts`, `mensagemDoPedido`):

```text
Olá, Mone Brigaderia! Quero fazer este pedido:

*Pedido nº 4821*
Nome: Ana

• 3x Palha italiana
  – 1x Tradicional: R$ 9,00
  – 1x Ninho: R$ 10,00
  – 1x Ninho com Nutella: R$ 11,00
• 1x Bolo de pote Ninho com morango (250 ml): R$ 16,00
• 2x Brownie: R$ 16,00

*Total dos doces: R$ 62,00* (6 itens)

Aguardo a confirmação para combinar retirada ou entrega, dia, horário e pagamento.
```

- Número do pedido de 4 dígitos, criado quando o primeiro doce entra na sacola. Mesmo número = mesmo pedido: se chegar duas vezes, vale a última mensagem.
- "Nome:" só se a pessoa escreveu. Itens na ordem do cardápio; doce com 2 ou mais opções na sacola vira grupo com sublinhas; doce com uma opção escolhida entre várias leva a opção entre parênteses.
- Pedido misto ganha os títulos "*Pronta entrega*" e "*Sob encomenda* · pronto a partir de dom., 15/11"; pedido só de encomenda ganha a linha "Sob encomenda: pronto a partir de …" depois do total.
- Sem preço unitário, emoji, link nem data de envio. Negrito só no número, nos títulos e no total. Todo valor da lista soma no total.
- Retirada ou entrega, dia, horário e pagamento são combinados na conversa. Mudar ou cancelar também. O app não guarda a situação do pedido e não baixa o estoque.

### Alergênicos

- Por doce: o que ele **contém** (leite, trigo, ovo, castanhas, amendoim, soja), "Nenhum destes" ou não informado (NULL). Doce novo começa não informado, nunca "sem".
- Pela cozinha (Dados da loja): os ingredientes usados em alguma receita viram "Pode conter traços de…" em todas as fichas (menos os que o doce já contém).
- "Sem glúten" só aparece se o doce não leva trigo **e** a cozinha não usa trigo.

### Campanhas

- No ar entre a data de início e a de fim, a menos que a loja pause.
- Um doce pode estar em várias campanhas. "Só em campanhas" = só aparece enquanto alguma campanha dele estiver no ar.
- Depois do último dia para encomendar, os doces sob encomenda só da campanha não entram mais na sacola; também não entram se ficariam prontos depois do fim da campanha ("Não dá mais tempo para o Natal: este doce leva 3 dias.").

### Aberto / fechado

- Horário de cada dia em Dados da loja (fuso America/Sao_Paulo). "Aberto agora · até 18h", "Fechado · abre amanhã às 9h", "Atendimento: seg. a sex., 9h às 18h; sáb., 9h às 13h".
- Calculado no servidor na visita e atualizado no navegador sem piscar. Sem horário cadastrado, não aparece.
- Fechado não impede o pedido: a sacola avisa "Fechado no momento · Abrimos terça às 9h" e a loja responde quando abrir.

### Login

- Cada pessoa tem a própria senha, guardada só como resumo scrypt com salt por pessoa, comparada em tempo constante.
- Senha provisória: palavra + 4 números, vale 7 dias, só serve para criar a senha.
- Limite de tentativas: 10 senhas erradas em 15 minutos do mesmo e-mail no mesmo IP, ou 30 do mesmo IP, bloqueiam por 15 minutos. Nunca bloqueia só pelo e-mail (ninguém consegue trancar outra pessoa fora).
- Sessão num cookie assinado (HttpOnly, SameSite=Lax) com o id, a versão e a validade. Trocar a senha, gerar senha nova ou "Sair de todos os aparelhos" aumenta a versão e derruba os outros cookies.
- **Chave de emergência** (`PAINEL_SENHA`): vale só para os e-mails de `ADMIN_EMAILS`, leva sempre a "Crie sua senha" e derruba as outras sessões dessa pessoa.
- Cada página e cada ação de salvar conferem no banco se a pessoa ainda tem acesso e o que o papel permite.

## Modo demonstração

Sem `MYSQL_DATABASE`, o app roda com os doces de exemplo de `src/lib/dados-exemplo.ts` e o painel abre sem login, com a faixa "Painel em modo demonstração" (nada é gravado).

## Telas do mockup

O mockup aprovado no começo está em `mockup/` ([mockup/README.md](../mockup/README.md) diz o que mudou desde então).

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
| Sacola | `mockup/telas/Carrinho.dc.html` (superado em parte) |
