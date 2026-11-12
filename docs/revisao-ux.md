# Revisão de experiência (UX)

Em novembro de 2026, com o app já no ar, o Luiz pediu duas rodadas de revisão de experiência. Cada rodada teve o mesmo formato:

1. **4 especialistas** olharam o app (código e telas) e escreveram um relatório ou uma proposta, cada um do seu ponto de vista.
2. **Debate**: cada especialista leu o trabalho dos outros e disse com o que concordava, do que discordava e o que vinha primeiro.
3. **Moderação**: um moderador juntou tudo numa decisão única, com o porquê de cada ponto em disputa.

As decisões viraram as etapas A a E de implementação ([historico.md](historico.md#9-implementação-em-etapas-a-a-e)). O que ficou para depois está em [proximos-passos.md](proximos-passos.md#ideias-para-depois).

## Os 4 especialistas

| Especialista | Olhou para | Prefixo dos achados |
| --- | --- | --- |
| UX de vitrine e compra no celular | quem compra: vitrine, ficha, WhatsApp | C |
| UX de ferramentas de gestão para pequenos negócios | quem cadastra: doces, fotos, campanhas | D |
| UX de identidade, acesso e segurança utilizável (na 2ª rodada, também confiança e dados) | login, senhas, papéis, privacidade | A |
| UX de operação diária, design visual e acessibilidade | quem cuida do estoque todo dia, contraste, tamanhos, iPhone | O |

## Rodada 1: o app inteiro

### O que acharam

Todos concordaram que a vitrine era bonita, leve e com bom contraste, com alvos de toque de 44 px. Os problemas estavam em detalhes que fazem perder venda, dinheiro ou dado:

- **Quem compra** (C): o app não dizia como retirar, pagar, em que horário nem quando a loja confirma; o número do WhatsApp aparecia sem DDD; a quantidade "de hoje" podia ser de dias atrás; "Esgotado" era um beco sem saída; os alergênicos se resumiam a glúten e lactose; o prazo de encomenda das campanhas era só um texto.
- **Quem cadastra** (D): salvar a ficha da palha **apagava os preços por sabor**; um preço digitado com ponto ("12.50") virava R$ 1.250,00 e preço vazio virava R$ 0,00; sair da tela perdia o que foi digitado sem aviso; um toque num chip de data apagava a campanha; a frase do banner não aparecia na vitrine; dava para criar campanhas repetidas.
- **Acesso** (A): havia **uma senha só para todo mundo** e o e-mail funcionava como nome de usuário (que não é segredo). Quem sabia a senha entrava como qualquer pessoa, inclusive como Administração. Não havia "esqueci a senha", troca de senha nem limite de tentativas, e a sessão vencia sem aviso.
- **Operação** (O): a vitrine dizia "feito hoje" com a contagem de dias atrás; mudar uma quantidade custava um toque por unidade; "Salvar o dia" ficava no fim da lista e regravava todos os doces, apagando o que outra pessoa salvou; textos importantes em 11–12 px; no iPhone, o topo podia ficar embaixo do relógio.

### O modelo de login decidido

Foram comparados 4 modelos: (a) manter a senha única; (b) senha individual com provisória pela administração; (c) "esqueci a senha" por e-mail; (d) só link mágico por e-mail. Os 4 especialistas fecharam no **modelo (b)**:

- Cada pessoa tem a própria senha. A administração cadastra a pessoa em Acessos e o app cria uma **senha provisória** fácil de ditar (ex.: cacau-4821), que vale 7 dias e vai pelo WhatsApp.
- No primeiro acesso, a troca é **obrigatória**; só depois abre o guia "Como usar".
- "Esqueci a senha" é resolvido pela administração ("Gerar senha nova"). A troca fica em **Minha conta**.
- A sessão se renova sozinha: quem usa o painel pelo menos uma vez por mês não digita a senha de novo.
- **2 pessoas na Administração** (o Luiz e a dona), para uma gerar senha nova para a outra. Sem segundo e-mail de recuperação.
- A `PAINEL_SENHA` ganha um valor novo e vira só uma **chave de emergência** para os e-mails de `ADMIN_EMAILS`.
- Limite de tentativas por e-mail + IP (10 em 15 minutos) e por IP (30), nunca só pelo e-mail.

**Por quê:** custa zero, não depende de e-mail chegar e fecha o furo da senha única. Combina com uma equipe de 2 a 4 pessoas que já conversa pelo WhatsApp. A renovação da sessão é o que mais evita "esqueci". Com login individual, "salvo por Ana" passa a ser confiável.

**Descartados:** (a) não resolve nada e os papéis continuariam sem efeito; (c) como primeira solução precisa de SMTP com SPF/DKIM, senão o e-mail cai no spam (fica para depois); (d) ninguém entra se o e-mail falhar, e no iPhone o app instalado não recebe o login feito pelo link aberto no Safari; transição em que todos entrariam "uma última vez" com a senha da loja reabriria o furo; bloqueio contado só pelo e-mail deixaria qualquer pessoa trancar a dona fora.

### As 15 mudanças "fazer agora"

1. Parar de apagar o preço dos sabores e mostrar "a partir de".
2. Formulário do doce sem armadilhas: preço, foto e aviso de salvo.
3. WhatsApp com número certo e "Como funciona" antes de pedir.
4. Quantidade "de hoje" honesta na vitrine e lembrete no painel.
5. Tela de entrar sem tropeços e textos que dizem "qualquer e-mail".
6. Senha individual para cada pessoa (modelo b).
7. Minha conta e sessão que não vence para quem usa.
8. "O que tem hoje" rápido: digitar o número, "Esgotou" e "Salvar o dia" fixo.
9. Sem beco sem saída: esgotado, doce fora de época e balcão.
10. Não perder o que foi digitado e confirmar só o que é perigoso.
11. Alergênicos completos e seguros.
12. Campanhas prontas para o Natal.
13. Avisos que explicam e não somem.
14. Guia "Como usar" de acordo com o novo jeito.
15. Acabamento da vitrine e do app instalado.

### Pontos em disputa e como fecharam

- **Salvar sozinho a cada toque** em O que tem hoje: rejeitado (3 a 1). Regra: ações de um toque (estrela, Esgotou) salvam na hora; os números esperam "Salvar o dia".
- **Rodapé do painel**: a barra de salvar ganhou da barra de abas (duas barras fixas não cabem em 390 px).
- **Limite do seletor de quantidade**: fica o limite, sem mostrar o número exato ("Para mais unidades, combine no WhatsApp").
- **Alergênicos**: "Contém" por doce e traços configurados uma vez para a cozinha toda; doce novo começa "não informado", nunca "sem".
- **Doce novo**: "Na vitrine" ligado, com a pergunta "Publicar sem foto?" (o bloqueio de preço 0 já evita o R$ 0,00).
- **Destaque com menos de 3 doces**: esconder, com aviso no painel ao lado da estrela.
- **Exemplo de e-mail em Acessos**: "ex.: seunome@email.com" (sem provedor, sem gênero).
- **Sessão**: 30 dias, renovada quando faltam menos de 7.

## Rodada 2: sacola e recibo pelo WhatsApp

O Luiz decidiu antes: **sem lista de pedidos no painel, sem nada gravado no banco**; retirada ou entrega, data e pagamento são combinados no WhatsApp; enviar a mensagem é fazer o pedido; o recibo tem que chegar "montadinho". Os 4 especialistas propuseram cada um uma sacola, debateram e o moderador fechou a especificação.

### A especificação

- **Caminho único**: todo pedido passa pela sacola, e só se adiciona pela ficha do doce. Dourado = adicionar à sacola; verde = abrir o WhatsApp.
- **Na ficha**: bloco "Quantos de cada?" com uma linha por sabor ou tamanho (preço e − 0 +); o botão soma tudo ("Adicionar 3 · R$ 30,00"). Sem folha nem janela depois de adicionar: "Na sacola" no botão e "Na sua sacola: …" embaixo.
- **A sacola fica no celular** (localStorage), por 7 dias desde a última mudança. A linha é o doce mais o **nome** do sabor (o id do sabor muda a cada "Salvar ficha").
- **O cardápio manda**: preço, opções, estoque, prazo e campanha vêm sempre do cardápio atual. A sacola confere tudo ao abrir e avisa o que mudou ("Preço atualizado", "Tem menos hoje"); o que não pode ir fica apagado, fora do total e do recibo.
- **Limites**: por doce, a quantidade de hoje (20 com contagem de outro dia, 99 sob encomenda); no máximo 20 linhas.
- **Número do pedido** de 4 dígitos, criado quando o primeiro doce entra; mesmo número = mesmo pedido, vale a última mensagem.
- **Nome opcional**; sem telefone, e-mail, endereço ou recado (o recado vai na própria caixa do WhatsApp, que abre editável).
- **Depois de enviar**: a sacola esvazia, o último pedido fica guardado 7 dias e abre `/sacola/enviado`, com "O pedido só vale depois que a Mone confirmar", reenviar, copiar, colocar de volta na sacola, "Pedir uma mudança" e "Cancelar pelo WhatsApp".
- **Sem reserva**: enviar não baixa estoque. A loja baixa em O que tem hoje depois de confirmar.
- **Do lado da loja**: nenhuma tela nova. Respostas prontas (/recebi, /confirmado, /pix, /cancelado) e etiquetas do WhatsApp Business, numa seção do guia com botão Copiar.

### O recibo

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

- Agrupado por doce só quando o mesmo doce tem 2 ou mais opções na sacola: mais curto, e mostra o total de cada doce, que é o número que a loja baixa no estoque.
- Sem preço unitário e sem subtotal no grupo: todo valor da lista soma no total, então a conta na calculadora bate.
- "**Total dos doces**", para a taxa de entrega combinada depois não parecer mudança de preço.
- Títulos "Pronta entrega" e "Sob encomenda · pronto a partir de …" só no pedido misto, com uma data só (a mais tardia).
- Sem emoji, link ou data de envio. A busca por "**Pedido nº**" na lupa do WhatsApp serve de lista de pedidos.
- Um fecho só: "Aguardo a confirmação para combinar retirada ou entrega, dia, horário e pagamento."

### Pontos em disputa e como fecharam

- **"+" no cartão da vitrine**: fica para depois. Com a palha (3 sabores), o "+" sempre abriria outra ficha e pularia os alergênicos.
- **Contadores na ficha**: começam em 0 e **somam** à sacola (em vez de espelhar a sacola), para quem volta e põe mais 1 Ninho não trocar 2 por 1 sem perceber.
- **Número do pedido**: fica (3 a 1), com 4 dígitos; código com letras saiu.
- **Selo "aguardando confirmação"**: não entra, porque o app não sabe quando a loja confirmou. Fica a frase fixa e nenhum check verde.
- **Mudar e cancelar**: os dois botões com mensagem pronta, para ninguém usar "abrir de novo" e reenviar o recibo.
- **Esgotado**: não entra na sacola; continua a pergunta direta "Pedir para outro dia".
- **Respostas prontas**: no `/guia`, com Copiar, em vez de uma tela nova no painel; não prometem devolução até a loja definir a regra de cancelamento.

## Decisões do Luiz depois das revisões

- WhatsApp e dados da loja **no banco**, editáveis em **Dados da loja** (só Administração), e não numa variável de ambiente como a rodada 1 propunha.
- **Horário de cada dia** (aberto/fechado) no lugar de um texto livre, com "Aberto agora" na vitrine e "Fechado no momento" na sacola, sem impedir o pedido.
- Depois de comparar com um app de delivery em funcionamento: **vitrine em lista**, **abas de categoria fixas** no topo e **compartilhar doce** com foto no link.

## O que ficou para depois

Está em [proximos-passos.md](proximos-passos.md#ideias-para-depois): "+" no cartão, "Pedir de novo", página "Seus dados", estoque por sabor, lista de pedidos no painel, "esqueci a senha" por e-mail, aviso de conflito, galeria de fotos, formulário em duas partes, ordem dos doces e categorias, campanhas ("criar doce para esta campanha", "fazer de novo este ano", chave "Ativa"), Wake Lock no balcão, página "sem internet" e convite de instalação.

## O que foi descartado

| Ideia | Por quê |
| --- | --- |
| Login com senha única, ou só por link mágico | Veja "O modelo de login decidido" |
| Segundo e-mail de recuperação | Ninguém mantém atualizado; 2 pessoas na Administração resolvem melhor |
| Todos entrarem "uma última vez" com a senha da loja para criar a própria | Quem sabe a senha da loja poderia criar antes a senha de outra pessoa |
| Bloqueio de tentativas só pelo e-mail | Qualquer pessoa trancaria a dona fora digitando o e-mail dela |
| Salvar sozinho cada quantidade 1 a 2 segundos depois do toque | Um toque errado iria direto para a vitrine |
| Barra de abas fixa no painel | Disputa o rodapé com "Salvar o dia" |
| Repetir ao segurar + ou − | Ninguém descobre e causa toques acidentais; digitar o número resolve |
| "Salvar rascunho" e "Publicar" na campanha | Obriga a decidir na hora de salvar |
| "Na vitrine" desligado no doce novo | A pessoa salvaria e não entenderia por que o doce não aparece |
| "Pode conter traços" com caixinhas em cada doce | Alonga demais o formulário; os traços são da cozinha |
| Mostrar "Temos 13 hoje" no limite do seletor | Revelaria o número que as faixas escondem |
| Guardar em cache a vitrine ou o painel para funcionar sem internet | Mostraria estoque e preço velhos depois de cada publicação |
| Botões "Vou retirar / Quero entrega" | Decisão do Luiz: retirada ou entrega é combinada no WhatsApp |
| Datas de encomenda com "Manhã/Tarde" e seletor de data | Não há escolha de data no app |
| Favoritos como "Minha lista" com um pedido único | A sacola cumpre esse papel; favorito continua sendo "guardar para depois" |
| Escolha de entrega, endereço, taxa, data, horário ou pagamento no app; Pix ou pagamento no site | Fora do escopo: tudo é combinado no WhatsApp; a chave Pix não vai no site |
| Situação do pedido no app, confirmação automática, reserva ou baixa automática de estoque | O app não sabe o que foi combinado na conversa |
| Campo de recado, telefone, e-mail ou endereço de quem compra; cadastro de quem compra | Menos dados guardados; o recado vai no próprio WhatsApp |
| "Esvaziar sacola", "Trocar sabor" na sacola, folha "Você enviou?" | A lixeira com Desfazer basta; editar se faz na sacola |
| Recibo com "(atualizado)", data e hora, preço unitário ou emoji | Recibo curto, que soma certo e se busca por "Pedido nº" |
| WhatsApp Business API, envio automático, robô ou qualquer serviço pago | Custo e complexidade; respostas prontas resolvem |
