# Publicar o app em monebrigaderia.com.br

Cada push no `main` faz o GitHub verificar o código, compilar o app e enviar por FTPS para a hospedagem (arquivo `.github/workflows/publicar.yml`). Na primeira vez que o app conecta no banco vazio, ele cria as tabelas e carrega os doces de exemplo sozinho.

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

## 2. Cadastrar os acessos no GitHub (uma vez)

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
| `PAINEL_SENHA` | senha que a dona vai usar para entrar no painel |
| `SESSAO_SEGREDO` | um texto aleatório longo (64 letras e números) |

**Aba Variables** (opcionais):

| Nome | Para que serve | Padrão |
| --- | --- | --- |
| `WHATSAPP_NUMERO` | WhatsApp da loja com 55 + DDD, só números | abre o WhatsApp sem contato |
| `PASTA_DO_APP` | pasta do app no servidor | `mone-app` |
| `UPLOAD_DIR` | pasta das fotos enviadas pelo painel | `/home/<usuário>/mone-fotos` |
| `MYSQL_HOST` (como secret) | servidor do banco | `localhost` |

## 3. Publicar

Em **Actions › Publicar › Run workflow** (ou qualquer push no `main`). A primeira publicação demora alguns minutos porque envia tudo; as seguintes enviam só o que mudou.

Depois da primeira publicação, no cPanel, em **Setup Node.js App**, clique em **Restart** no app. Nas próximas, o app reinicia sozinho.

## 4. Conferir

- `https://monebrigaderia.com.br`: vitrine.
- `https://monebrigaderia.com.br/entrar`: painel, com a `PAINEL_SENHA`.
- HTTPS: se o navegador reclamar, rode **SSL/TLS Status › Run AutoSSL** no cPanel.

## Se algo der errado

| Sintoma | O que olhar |
| --- | --- |
| A publicação falha no passo "Enviar para o servidor" | Usuário, senha e servidor do FTP. Se o erro falar de TLS, troque `protocol: ftps` por `ftp` no workflow (menos seguro) |
| O site mostra erro 503 ou a página da hospedagem | No cPanel, **Setup Node.js App**: o app está rodando? Veja o arquivo `stderr.log` na pasta `mone-app` |
| Erro de banco no log | Usuário e senha do MySQL, e se o usuário tem acesso ao banco (cPanel › **MySQL Databases** › adicionar usuário ao banco com todos os privilégios) |
| O painel não aceita a senha | Confira o secret `PAINEL_SENHA` e publique de novo |

## Trocar uma senha

1. Troque no cPanel (do FTP ou do MySQL) ou escolha a nova senha do painel.
2. Atualize o secret correspondente no GitHub.
3. Rode **Actions › Publicar › Run workflow**.

Trocar a `PAINEL_SENHA` desconecta quem estava logado no painel.
