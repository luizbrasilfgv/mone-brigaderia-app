# Próximos passos

## Já feito

- Todas as telas do mockup em código.
- Banco MySQL: o app cria as tabelas e carrega os exemplos sozinho num banco vazio (`banco/`).
- Login com Google; só entra quem está em Acessos. Papéis: Administração, Equipe e Estoque.
- Guia "Como usar" no primeiro acesso.
- Painel grava de verdade: quantidades do dia, destaque, fichas dos doces (com foto reduzida no celular antes de enviar), doces fora da vitrine, campanhas e pausa de campanha.
- Publicação automática pelo GitHub a cada push no `main` (docs/publicar.md).

## Para colocar no ar

1. Criar o app Node.js no cPanel, o login com Google no Google Cloud e cadastrar os Secrets no GitHub: [docs/publicar.md](publicar.md).
2. Confirmar o DDD do WhatsApp da loja e cadastrar a variável `WHATSAPP_NUMERO`.
3. Ativar o HTTPS (AutoSSL no cPanel).

## Antes de divulgar

- A dona revisa no painel os preços, sabores e textos de exemplo, e tira da vitrine o que não vende.
- Fotos reais de todos os doces (hoje só a palha italiana tem foto; os outros usam desenho provisório).
- Testar a instalação no celular (Android e iPhone): o app tem manifesto e ícone.
- Testar a tela do balcão na TV da loja.
- Trocar as senhas que circularam por mensagem (cPanel e MySQL) por senhas novas e diferentes, e atualizar os Secrets.

## Ideias para depois

- Várias fotos por doce, com escolha da principal.
- Reordenar os doces da vitrine arrastando no painel.
- Backup automático do banco (o cPanel costuma ter em **Backup**).
- Fase 2: encomenda pelo app, com sacola, retirada ou entrega, data e Pix (tela pronta no mockup).
