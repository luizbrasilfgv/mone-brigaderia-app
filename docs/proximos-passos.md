# Próximos passos

O app já tem todas as telas funcionando com dados de exemplo. Abaixo, o que falta para ele ir ao ar, em ordem.

## 1. Banco de dados (sugestão: Supabase)

1. Criar um projeto no [Supabase](https://supabase.com) e rodar `supabase/schema.sql` no SQL Editor.
2. Popular as tabelas com os doces de `src/lib/dados-exemplo.ts` (ou cadastrar pelo painel depois do passo 3).
3. Trocar o corpo das funções de `src/lib/dados.ts` por consultas ao banco. As telas não mudam.
4. Criar o bucket público `fotos-doces` no Storage para as fotos.

Qualquer Postgres com login e armazenamento de imagens resolve; o Supabase junta os três.

## 2. Login no painel

1. Criar as contas da dona e da equipe no Supabase Auth e desligar o cadastro público.
2. Proteger tudo em `/painel` (no Next.js 16, o antigo `middleware.ts` virou `proxy.ts`).
3. Ver o guia `authentication-with-cache-components.md` em `node_modules/next/dist/docs/01-app/02-guides/`.

## 3. Salvar as alterações do painel

Hoje os botões de salvar mostram um aviso de demonstração. Para gravar de verdade:

1. Criar Server Actions para: quantidades do dia, ficha do doce (com upload de fotos), campanhas, destaque e pausa de campanha.
2. Depois de gravar, atualizar o cache das páginas com `updateTag()` (marcar os dados com `cacheTag()` em `src/lib/dados.ts`).
3. A vitrine e a ficha passam a buscar o estoque do dia no servidor a cada visita.

## 4. WhatsApp

Confirmar o DDD da loja e preencher `NEXT_PUBLIC_WHATSAPP_NUMERO` (ex.: `55` + DDD + `980631673`).

## 5. Servidor

Sugestão: [Vercel](https://vercel.com), que é de quem faz o Next.js.

1. Importar o repositório do GitHub.
2. Cadastrar as variáveis de `.env.example`.
3. Cada push no `main` publica sozinho; cada pull request ganha um endereço de teste.

Vercel e Supabase costumam ter plano gratuito para começar; conferir as condições atuais antes de decidir.

## 6. Domínio

1. Escolher o nome e verificar se está livre no [Registro.br](https://registro.br) (para `.com.br`).
2. Registrar (taxa anual).
3. Apontar o DNS para a Vercel; o HTTPS é automático.

## 7. Antes de lançar

- Fotos reais de todos os doces (hoje só a palha italiana tem foto; os outros usam desenho provisório).
- Preços, sabores e textos das fichas revisados pela dona.
- Testar a instalação no celular (Android e iPhone): o app já tem manifesto e ícone.
- Testar a tela do balcão na TV da loja.
