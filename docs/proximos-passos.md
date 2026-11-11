# Próximos passos

Caminho sugerido do mockup até o app no ar. A escolha da stack é do time; abaixo está uma sugestão para começar rápido e barato.

## 1. Escolher a stack

Sugestão:

- **App:** Next.js (React) publicado como PWA, para a cliente instalar no celular sem loja de aplicativos.
- **Banco, login e fotos:** Supabase (Postgres, autenticação para o painel da dona, storage para as fotos).
- **Hospedagem:** Vercel para o app.

Vercel e Supabase costumam ter plano gratuito para começar; conferir as condições atuais antes de decidir. Qualquer stack que tenha Postgres, login e storage de imagens resolve.

## 2. Banco de dados

1. Criar as tabelas de [modelo-de-dados.md](modelo-de-dados.md).
2. Popular com os doces do mockup para testar.
3. Proteger as tabelas: a vitrine só lê; só a dona e a equipe escrevem.

## 3. Telas, nesta ordem

1. Vitrine e ficha do doce, lendo do banco.
2. Botão do WhatsApp: link `https://wa.me/55<DDD><número>?text=<mensagem>` (confirmar o DDD).
3. Painel com login: o que tem hoje (quantidades) e ficha do doce com upload de fotos.
4. Campanhas.
5. Modo balcão (opcional).

O visual está nos arquivos de `mockup/telas`: cores, fontes (Fraunces e Manrope), espaçamentos e textos.

## 4. Domínio

1. Escolher o nome e verificar se está livre no [Registro.br](https://registro.br) (para `.com.br`).
2. Registrar (taxa anual).
3. Apontar o DNS para a hospedagem e ativar HTTPS.

## 5. Antes de lançar

- Fotos reais de todos os doces.
- Preços, sabores e textos das fichas revisados pela dona.
- Ícone do app (logo) e nome que aparece no celular.
- Testar em celulares Android e iPhone.
