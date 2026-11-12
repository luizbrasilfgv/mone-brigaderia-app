# Próximos passos

## Já feito

- Todas as telas do mockup em código.
- Banco MySQL: o app cria as tabelas e carrega os exemplos sozinho num banco vazio (`banco/`).
- Login com e-mail e senha individual (senha provisória pelo WhatsApp, troca no primeiro acesso, Minha conta); só entra quem está em Acessos. Papéis: Administração, Equipe e Estoque.
- Guia "Como usar" no primeiro acesso.
- Dados da loja no painel (WhatsApp, horário de cada dia, retirada, entrega, pagamento, ingredientes da cozinha), "Aberto agora" e "Como funciona" na vitrine.
- Vitrine honesta: faixas "Tem hoje / Últimas unidades / Esgotado", aviso quando a quantidade não é de hoje e lembrete no painel; esgotado e doce fora de época com saída; campanhas com prazo de encomenda de verdade.
- Painel grava de verdade: quantidades do dia, destaque, fichas dos doces (com foto reduzida no celular antes de enviar), doces fora da vitrine, campanhas e pausa de campanha.
- Publicação automática pelo GitHub a cada push no `main` (docs/publicar.md).

## Para colocar no ar

1. Criar o app Node.js no cPanel e cadastrar os Secrets no GitHub, com um valor novo para a `PAINEL_SENHA` (a chave de emergência): [docs/publicar.md](publicar.md).
2. Em **Painel › Dados da loja**, conferir o WhatsApp (já vem (21) 98063-1673) e preencher o horário de cada dia, retirada, entrega, pagamento e os ingredientes da cozinha (a palha leva biscoito: marcar trigo).
3. Ativar o HTTPS (AutoSSL no cPanel).

## Antes de divulgar

- A dona revisa no painel os preços, sabores e textos de exemplo, e tira da vitrine o que não vende.
- Fotos reais de todos os doces (hoje só a palha italiana tem foto; os outros usam desenho provisório).
- Testar a instalação no celular (Android e iPhone): o app tem manifesto e ícone.
- Testar a tela do balcão na TV da loja.
- Trocar as senhas que circularam por mensagem (cPanel e MySQL) por senhas novas e diferentes, e atualizar os Secrets.
- Ter 2 pessoas na Administração (por exemplo, o Luiz e a dona), para uma gerar senha nova para a outra.

## Ideias para depois

- Várias fotos por doce, com escolha da principal.
- Reordenar os doces da vitrine arrastando no painel.
- Backup automático do banco (o cPanel costuma ter em **Backup**).
- "Esqueci a senha" por e-mail, com link de uso único, quando o SMTP da hospedagem estiver configurado com SPF/DKIM.
- Fase 2: encomenda pelo app, com sacola, retirada ou entrega, data e Pix (tela pronta no mockup).
