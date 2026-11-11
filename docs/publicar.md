# Publicar o app em monebrigaderia.com.br

Cada push no `main` faz o GitHub verificar o código, compilar o app e enviar por FTPS para a hospedagem (arquivo `.github/workflows/publicar.yml`). Na primeira vez que o app conecta no banco vazio, ele cria as tabelas e carrega os doces de exemplo sozinho.

O FTP de hospedagem compartilhada derruba envios longos, então a publicação manda um pacote só (`pacote.tar.gz`), mais `pacote.id`, `app.js`, `.env` e `tmp/restart.txt`. Quando o app reinicia, o `app.js` desempacota a versão nova em `mone-app/versoes/<id>` e guarda só a anterior, para voltar se precisar.

Nenhuma senha fica no código: os acessos ficam nos **Secrets** do repositório e, no servidor, num arquivo `.env` que a publicação escreve dentro da pasta do app (fora da pasta pública do site).

## 1. Criar o app Node.js no cPanel (uma vez)

No cPanel da hospedagem, abra **Setup Node.js App** › **Create Application**:

| Campo | Valor |
| --- | --- |
| Node.js version | 20 ou mais nova (22 se tiver) |
| Application mode | Production |
| Application root | `mone-app` |
| Application URL | `monebrigaderia.com.br` |
| Application startup file | `app.js` |

Salve. Não precisa rodar "npm install": o app já vai pronto, com tudo o que precisa.

> Se o cPanel não tiver **Setup Node.js App**, a hospedagem não roda Node.js. Opções: pedir à hospedagem um plano com Node.js, contratar uma VPS, ou publicar o app na Vercel usando este mesmo MySQL (liberando acesso externo em **Remote MySQL**).

## 2. Login com Google (opcional)

O painel entra com **e-mail + senha da loja** (`PAINEL_SENHA`). Se quiserem também o botão "Entrar com Google", crie um "cliente OAuth" no Google Cloud (é grátis, sem faturamento; se a conta atingir o limite de projetos, use outra conta Google, de preferência da loja):

1. Entre em https://console.cloud.google.com com uma conta Google da loja e crie um projeto (ex.: "Mone Brigaderia").
2. No menu, abra **APIs e serviços › Tela de permissão OAuth** (pode aparecer como **Google Auth Platform**) e clique em **Começar**: nome do app "Mone Brigaderia", e-mail de suporte, público **Externo**.
3. Em **Público**, clique em **Publicar app**. Sem isso, só entram os "usuários de teste". Com os dados básicos que o app pede (nome e e-mail), o Google não exige verificação.
4. Em **Clientes › Criar cliente**: tipo **Aplicativo da Web**, e em **URIs de redirecionamento autorizados** coloque `https://monebrigaderia.com.br/auth/google/retorno` (para testar no computador, adicione também `http://localhost:3000/auth/google/retorno`).
5. Copie o **ID do cliente** e a **Chave secreta do cliente** para os Secrets do passo 3.

## 3. Cadastrar os acessos no GitHub (uma vez)

Só o dono do repositório consegue. Em **Settings › Secrets and variables › Actions**:

**Aba Secrets** (ninguém consegue ler depois de salvar):

| Nome | Valor |
| --- | --- |
| `FTP_SERVIDOR` | IP ou endereço FTP da hospedagem |
| `FTP_USUARIO` | usuário do cPanel |
| `FTP_SENHA` | senha do cPanel |
| `MYSQL_USER` | usuário do banco (ex.: `monebrigaderia_appuser`) |
| `MYSQL_PASSWORD` | senha do usuário do banco |
| `MYSQL_DATABASE` | nome do banco (ex.: `monebrigaderia_appdb`) |
| `SESSAO_SEGREDO` | um texto aleatório longo (64 letras e números) |
| `PAINEL_SENHA` | senha da loja para entrar no painel com e-mail + senha |
| `GOOGLE_CLIENT_ID` | opcional: ID do cliente do passo 2 |
| `GOOGLE_CLIENT_SECRET` | opcional: chave secreta do cliente do passo 2 |

**Aba Variables** (opcionais):

| Nome | Para que serve | Padrão |
| --- | --- | --- |
| `ADMIN_EMAILS` | e-mails do Google que sempre entram como administrador, separados por vírgula | `luizbrasil.rj@gmail.com` |
| `WHATSAPP_NUMERO` | WhatsApp da loja com 55 + DDD, só números | abre o WhatsApp sem contato |
| `SITE_URL` | endereço do site | `https://monebrigaderia.com.br` |
| `PASTA_DO_APP` | pasta do app no servidor | `mone-app` |
| `UPLOAD_DIR` | pasta das fotos enviadas pelo painel | `/home/<usuário>/mone-fotos` |
| `MYSQL_HOST` (como secret) | servidor do banco | `localhost` |

## 4. Publicar

Em **Actions › Publicar › Run workflow** (ou qualquer push no `main`). A primeira publicação demora alguns minutos porque envia tudo; as seguintes enviam só o que mudou.

Depois da primeira publicação, no cPanel, em **Setup Node.js App**, clique em **Restart** no app. Nas próximas, o app reinicia sozinho.

## 5. Conferir

- `https://monebrigaderia.com.br`: vitrine.
- `https://monebrigaderia.com.br/entrar`: entre com um e-mail de `ADMIN_EMAILS` e a `PAINEL_SENHA` (ou com o Google, se configurado). Depois, em **Acessos**, libere as outras pessoas e passe a senha da loja para elas.
- HTTPS: se o navegador reclamar, rode **SSL/TLS Status › Run AutoSSL** no cPanel.

## Se algo der errado

| Sintoma | O que olhar |
| --- | --- |
| A publicação falha no passo "Enviar para o servidor" | Usuário, senha e servidor do FTP. Se o erro falar de TLS, troque `protocol: ftps` por `ftp` no workflow (menos seguro) |
| Sobraram muitos arquivos soltos em `mone-app` (de uma publicação antiga, arquivo por arquivo) | Pode apagar tudo em `mone-app`, menos `app.js`, `.env`, `pacote.tar.gz`, `pacote.id`, `versoes` e `tmp` |
| O site mostra erro 503 ou a página da hospedagem | No cPanel, **Setup Node.js App**: o app está rodando? Veja o arquivo `stderr.log` na pasta `mone-app` |
| Erro de banco no log | Usuário e senha do MySQL, e se o usuário tem acesso ao banco (cPanel › **MySQL Databases** › adicionar usuário ao banco com todos os privilégios) |
| O Google mostra "redirect_uri_mismatch" | O endereço do passo 2.4 tem que ser exatamente `https://monebrigaderia.com.br/auth/google/retorno` |
| "Esse e-mail do Google não tem acesso" | A pessoa precisa estar em **Acessos** com o mesmo e-mail do Google (ou em `ADMIN_EMAILS`) |
| O Google diz que o app não foi verificado ou só aceita testadores | Faltou o passo 2.3 (**Publicar app**) |

## Trocar uma senha

1. Troque no cPanel (do FTP ou do MySQL).
2. Atualize o secret correspondente no GitHub.
3. Rode **Actions › Publicar › Run workflow**.

Trocar o `SESSAO_SEGREDO` desconecta todo mundo do painel (cada um entra de novo com o Google).
