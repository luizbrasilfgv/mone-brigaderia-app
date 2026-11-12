# Publicar o app em monebrigaderia.com.br

Cada push no `main` faz o GitHub verificar o código, compilar o app e enviar por FTPS para a hospedagem (arquivo `.github/workflows/publicar.yml`). Na primeira vez que o app conecta no banco vazio, ele cria as tabelas e carrega os doces de exemplo sozinho.

O FTP de hospedagem compartilhada derruba envios longos, então a publicação manda um pacote só (`pacote.tar.gz`), mais `pacote.id`, `app.js`, `.env` e `tmp/restart.txt`. Quando o app reinicia, o `app.js` desempacota a versão nova em `app/versoes/<id>` e guarda só a anterior, para voltar se precisar.

Nenhuma senha fica no código: os acessos ficam nos **Secrets** do repositório e, no servidor, num arquivo `.env` que a publicação escreve dentro da pasta do app (fora da pasta pública do site).

## 1. Criar o app Node.js no cPanel (uma vez)

No cPanel da hospedagem, abra **Setup Node.js App** › **Create Application**:

| Campo | Valor |
| --- | --- |
| Node.js version | 20 ou mais nova (22 se tiver) |
| Application mode | Production |
| Application root | `app` |
| Application URL | `monebrigaderia.com.br` |
| Application startup file | `app.js` |

O **Application URL** tem que ser o domínio puro, sem nada depois (nada de `/app`): a vitrine abre na raiz do site.

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
| `SESSAO_SEGREDO` | um texto aleatório longo (64 letras e números) |
| `PAINEL_SENHA` | chave de emergência do painel, só para os e-mails de `ADMIN_EMAILS` (guarde só com quem cuida do site) |

**Aba Variables** (opcionais):

| Nome | Para que serve | Padrão |
| --- | --- | --- |
| `ADMIN_EMAILS` | e-mails da Administração fixa (qualquer e-mail), separados por vírgula: podem usar a chave de emergência e não dá para removê-los em Acessos | `luizbrasil.rj@gmail.com` |
| `WHATSAPP_NUMERO` | WhatsApp da loja com 55 + DDD, só números | abre o WhatsApp sem contato |
| `SITE_URL` | endereço do site | `https://monebrigaderia.com.br` |
| `PASTA_DO_APP` | pasta do app no servidor | `app` |
| `UPLOAD_DIR` | pasta das fotos enviadas pelo painel | `/home/<usuário>/mone-fotos` |
| `MYSQL_HOST` (como secret) | servidor do banco | `localhost` |

## 3. Publicar

Em **Actions › Publicar › Run workflow** (ou qualquer push no `main`). A primeira publicação demora alguns minutos porque envia tudo; as seguintes enviam só o que mudou.

Depois da primeira publicação, no cPanel, em **Setup Node.js App**, clique em **Restart** no app. Nas próximas, o app reinicia sozinho.

## 4. Conferir

- `https://monebrigaderia.com.br`: vitrine.
- `https://monebrigaderia.com.br/entrar`: entre com um e-mail de `ADMIN_EMAILS` e a `PAINEL_SENHA` (a chave de emergência). O painel pede para você criar a sua senha; daí em diante, use a sua senha. Depois, em **Acessos**, adicione as outras pessoas: o app cria uma senha provisória para cada uma (vale 7 dias), que você manda pelo botão "Mandar convite pelo WhatsApp". No primeiro acesso, cada pessoa cria a própria senha. Ninguém precisa saber a `PAINEL_SENHA`.
- Na primeira publicação com senha individual, todo mundo sai do painel uma vez (a sessão mudou de formato) e quem já estava em Acessos só entra depois de receber uma senha provisória.
- HTTPS: se o navegador reclamar, rode **SSL/TLS Status › Run AutoSSL** no cPanel.

## Se algo der errado

| Sintoma | O que olhar |
| --- | --- |
| A publicação falha no passo "Enviar para o servidor" | Usuário, senha e servidor do FTP. Se o erro falar de TLS, troque `protocol: ftps` por `ftp` no workflow (menos seguro) |
| Sobraram muitos arquivos soltos em `app` (de uma publicação antiga, arquivo por arquivo) | Pode apagar tudo em `app`, menos `app.js`, `.env`, `pacote.tar.gz`, `pacote.id`, `versoes` e `tmp` |
| O site mostra erro 503 ou a página da hospedagem | No cPanel, **Setup Node.js App**: o app está rodando? Veja o arquivo `stderr.log` na pasta `app` |
| Erro de banco no log | Usuário e senha do MySQL, e se o usuário tem acesso ao banco (cPanel › **MySQL Databases** › adicionar usuário ao banco com todos os privilégios) |
| A tela de entrar diz "O painel está em manutenção" | Falta o `SESSAO_SEGREDO` (o motivo aparece no `stderr.log`) |
| "E-mail ou senha errados" para quem tem certeza da senha | Em **Acessos**, confira o e-mail da pessoa e toque em "Gerar senha nova". Se a pessoa estiver em `ADMIN_EMAILS`, ela pode entrar com a `PAINEL_SENHA` |
| "Muitas tentativas" para todo mundo ao mesmo tempo | Abra `https://monebrigaderia.com.br/saude`: se a linha do IP disser "não identificado", a hospedagem não está repassando o IP de quem visita e o limite conta todas as visitas juntas. Espere 15 minutos |

## Trocar uma senha

- **Senha de cada pessoa no painel:** a própria pessoa troca em **Minha conta** (tocando no nome dela, no alto do painel). Se esquecer, quem administra toca em "Gerar senha nova" no cartão dela em **Acessos** e manda a provisória pelo WhatsApp. Por isso é bom ter 2 pessoas na Administração.
- **Chave de emergência (`PAINEL_SENHA`):** atualize o secret no GitHub e rode **Actions › Publicar › Run workflow**. Ela só vale para os e-mails de `ADMIN_EMAILS` e sempre leva a "Crie sua senha".
- **cPanel ou MySQL:**
  1. Troque no cPanel (do FTP ou do MySQL).
  2. Atualize o secret correspondente no GitHub.
  3. Rode **Actions › Publicar › Run workflow**.

Trocar o `SESSAO_SEGREDO` desconecta todo mundo do painel (cada pessoa entra de novo com o e-mail e a senha dela).
