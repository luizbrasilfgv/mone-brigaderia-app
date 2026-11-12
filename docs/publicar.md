# Publicar o app em monebrigaderia.com.br

O app está no ar em **https://monebrigaderia.com.br**, numa hospedagem compartilhada com cPanel, Node.js e MySQL. Este documento conta como está montado **de verdade** (o que foi aprendido na prática) e o que fazer quando algo dá errado.

Resumo: cada push no `main` faz o GitHub verificar o código, compilar o app e enviar um pacote único por FTPS para a pasta `app` do servidor. O app reinicia sozinho, desempacota a versão nova e, na primeira visita, cria ou atualiza as tabelas do banco.

## 1. Como está montado

```text
GitHub (push no main)
  └─ Actions › Publicar (.github/workflows/publicar.yml)
       1. npm ci, npm run lint, npm run build (Node 22)
       2. monta pacote.tar.gz (servidor do Next.js + .next/static + public)
       3. escreve o .env com os Secrets
       4. envia por FTPS para a pasta app: pacote.tar.gz, pacote.id, app.js, .env, tmp/restart.txt
Hospedagem (cPanel › Setup Node.js App, Passenger)
  └─ app/app.js (arquivo de entrada)
       1. lê o .env
       2. desempacota a versão nova em app/versoes/<id> (guarda só a anterior)
       3. inicia o servidor do Next.js dessa versão
       4. copia tudo o que o app escreve para app/registro.log
MySQL (na mesma hospedagem)
  └─ na primeira visita: schema.sql, dados iniciais (banco vazio) e migrações
```

Na pasta `app` do servidor ficam só: `app.js`, `.env`, `pacote.tar.gz`, `pacote.id`, `versoes/`, `tmp/`, `registro.log` (e o `registro.log.1`, quando passa de 5 MB). As fotos enviadas pelo painel ficam **fora** dessa pasta (`UPLOAD_DIR`, padrão `/home/<usuário>/mone-fotos`), para não sumirem a cada publicação.

## 2. O app Node.js no cPanel (feito uma vez)

Em **cPanel › Setup Node.js App › Create Application**:

| Campo | Valor |
| --- | --- |
| Node.js version | 22 |
| Application mode | Production |
| Application root | `app` |
| Application URL | `monebrigaderia.com.br` (o domínio puro, **sem** `/app`) |
| Application startup file | `app.js` |

- O **Application URL** tem que ser o domínio puro. Com `/app` no fim, a vitrine só abre em `monebrigaderia.com.br/app` (aconteceu na primeira tentativa).
- O **Application root** tem que ser a mesma pasta para onde o GitHub envia (variável `PASTA_DO_APP`, padrão `app`). Publicar numa pasta e o app olhar para outra faz parecer que "a publicação não mudou nada" (também aconteceu).
- Não precisa rodar "npm install" nem "Run JS script": o pacote já vai com tudo.
- Configurações escritas direto no cPanel (Environment variables) têm prioridade sobre o `.env`. Hoje não há nenhuma: tudo vem do `.env`.

## 3. O banco MySQL (feito uma vez)

Em **cPanel › MySQL Databases**:

1. Crie o banco e o usuário.
2. Em **Add User To Database**, junte o usuário ao banco marcando **ALL PRIVILEGES** (todos os privilégios).

A hospedagem usa **MySQL 8.4**, que exige o privilégio `REFERENCES` para criar tabelas com chave estrangeira. Na primeira publicação o usuário estava sem ele: o app conectava, mas as tabelas não eram criadas, e o `/saude` mostrava um erro de permissão na preparação das tabelas. Com todos os privilégios, resolveu. Depois de mudar privilégios, reinicie o app.

Não precisa importar nada: o app cria as tabelas, carrega os dados iniciais e aplica as migrações sozinho ([modelo-de-dados.md](modelo-de-dados.md#como-o-banco-é-criado-e-atualizado)).

## 4. Domínio e HTTPS

- O domínio é registrado no **registro.br**. Lá, em **DNS**, os servidores de DNS do domínio são os **servidores de DNS da hospedagem** (os nomes que a hospedagem informa no e-mail de boas-vindas ou no cPanel). Antes disso, o domínio não abria ("não foi possível encontrar o endereço"). A mudança pode levar algumas horas para valer.
- HTTPS: certificado automático da hospedagem (**cPanel › SSL/TLS Status › Run AutoSSL** se o navegador reclamar).

## 5. Os acessos no GitHub (Secrets e Variables)

Só o dono do repositório consegue mexer. Em **Settings › Secrets and variables › Actions**. Ninguém consegue ler um secret depois de salvo; os valores **não** ficam neste repositório.

**Secrets** (cadastrados hoje):

| Nome | Para que serve |
| --- | --- |
| `FTP_SERVIDOR` | endereço do FTP da hospedagem |
| `FTP_USUARIO` | usuário do cPanel (também monta o caminho padrão das fotos) |
| `FTP_SENHA` | senha do FTP/cPanel. Sem ele, o workflow só verifica e compila, sem publicar |
| `MYSQL_USER` | usuário do banco |
| `MYSQL_PASSWORD` | senha do usuário do banco |
| `MYSQL_DATABASE` | nome do banco |
| `SESSAO_SEGREDO` | texto aleatório longo que assina a sessão do painel. Trocar desconecta todo mundo |
| `PAINEL_SENHA` | **chave de emergência** do painel (veja abaixo) |
| `MYSQL_HOST` (opcional) | servidor do banco; padrão `localhost` |

**Variables** (opcionais; o workflow tem padrões):

| Nome | Para que serve | Padrão |
| --- | --- | --- |
| `ADMIN_EMAILS` | e-mails da Administração fixa, separados por vírgula: podem usar a chave de emergência e não dá para removê-los em Acessos | o e-mail do Luiz (no workflow) |
| `SITE_URL` | endereço público (vai no convite de acesso, no QR do balcão e nos links compartilhados) | `https://monebrigaderia.com.br` |
| `PASTA_DO_APP` | pasta do app no servidor | `app` |
| `UPLOAD_DIR` | pasta das fotos enviadas pelo painel | `/home/<FTP_USUARIO>/mone-fotos` |

O WhatsApp da loja, o horário e os textos de retirada, entrega e pagamento **não** ficam aqui: a Administração edita em **Painel › Dados da loja**, e muda na hora.

### Chave de emergência (`PAINEL_SENHA`)

Cada pessoa entra no painel com a própria senha. A `PAINEL_SENHA` só serve para quem está em `ADMIN_EMAILS` entrar quando esquecer a própria senha e não houver outra pessoa na Administração para gerar uma nova. Entrar com ela leva sempre a "Crie sua senha" e derruba as outras sessões dessa pessoa. Guarde só com quem cuida do site; ninguém mais precisa dela.

## 6. Publicar

- **Automático:** qualquer push no `main` (inclusive juntar um pull request). Em pull request, o workflow só verifica e compila.
- **Na mão:** **Actions › Publicar › Run workflow**.
- Uma publicação por vez: no `main`, a próxima espera a anterior terminar (cancelar no meio deixaria o servidor pela metade).

**Por que um pacote só:** a primeira versão enviava os ~1.600 arquivos do app um por um, e o FTP da hospedagem derrubava a conexão depois de uns 20 minutos. Agora vai um `pacote.tar.gz`, e o `app.js` desempacota no servidor (com um leitor de tar próprio, sem depender de nada instalado).

**O `.env`:** é escrito pela publicação (com permissão só do dono) e enviado junto. O `app.js` lê esse arquivo ao iniciar.

**Reiniciar:** a publicação envia `tmp/restart.txt`, e a hospedagem (Passenger) reinicia o app sozinha. Se não reiniciar, clique em **Restart** em **cPanel › Setup Node.js App**. Reinicie também depois de mudar algo no banco por fora do app (o app guarda leituras em cache).

**Migrações:** rodam na primeira visita depois de reiniciar. Não precisa fazer nada.

**Servidor:** o `app.js` força o endereço de escuta `0.0.0.0` (a hospedagem define `HOSTNAME` com o nome da máquina, e o Next.js tentaria escutar nele).

## 7. Conferir e diagnosticar

- `https://monebrigaderia.com.br`: vitrine.
- `https://monebrigaderia.com.br/saude`: **diagnóstico** em texto, sem senhas: versão publicada e Node, quais configurações o app achou (✓ ou "✗ FALTANDO"), se o IP de quem visita chega, conexão com o MySQL (versão e número de tabelas), preparação das tabelas e quantos doces há na vitrine.
- `app/registro.log` (pelo Gerenciador de Arquivos do cPanel): tudo o que o app escreve, inclusive os erros, com a hora em que iniciou. É o primeiro lugar para olhar quando algo não funciona.
- `https://monebrigaderia.com.br/entrar`: entre com o seu e-mail e a sua senha.

## 8. Problemas e soluções

| Sintoma | Causa e solução |
| --- | --- |
| O domínio não abre ("não foi possível encontrar o endereço") | DNS: no registro.br, os servidores de DNS do domínio precisam ser os da hospedagem. Depois de mudar, espere algumas horas |
| A vitrine só abre em `monebrigaderia.com.br/app` | **Application URL** com `/app` no cPanel. Edite o app e deixe só o domínio |
| A publicação deu certo, mas o site não mudou (ou mostra a página da hospedagem) | Pasta errada: o **Application root** do cPanel e a variável `PASTA_DO_APP` têm que ser a mesma pasta (`app`). Depois, Restart |
| `/saude` mostra erro na preparação das tabelas, com permissão negada (`REFERENCES`) | No MySQL 8.4, o usuário precisa de **ALL PRIVILEGES** no banco (seção 3). Depois, Restart |
| A lista de categorias (menu do formulário) abria branca, com letra clara | Corrigido no app: menus e calendários do sistema abrem no tema escuro (`color-scheme: dark` em `globals.css`) |
| O envio por FTP cai no meio | Resolvido com o pacote único. Se o erro falar de TLS, troque `protocol: ftps` por `ftp` no workflow (menos seguro) |
| A publicação falha em "Enviar para o servidor" | Confira `FTP_SERVIDOR`, `FTP_USUARIO` e `FTP_SENHA` |
| Erro 503 ou a página da hospedagem | No cPanel, o app está rodando? Olhe o `registro.log` (e o `stderr.log`, se houver). "pacote.tar.gz ou pacote.id não encontrado" = rode a publicação de novo |
| Sobraram arquivos soltos em `app` (de publicações antigas, arquivo por arquivo) | Pode apagar tudo em `app`, menos `app.js`, `.env`, `pacote.tar.gz`, `pacote.id`, `versoes`, `tmp` e `registro.log` |
| `/saude` mostra "✗ FALTANDO" em alguma configuração | Cadastre o secret ou a variável no GitHub e publique de novo (o `.env` é escrito a cada publicação) |
| A tela de entrar diz "O painel está em manutenção" | Falta o `SESSAO_SEGREDO` (o motivo aparece no `registro.log`) |
| "E-mail ou senha errados" para quem tem certeza da senha | Em **Acessos**, confira o e-mail da pessoa e toque em "Gerar senha nova". Se a pessoa estiver em `ADMIN_EMAILS`, ela pode entrar com a `PAINEL_SENHA` |
| "Muitas tentativas" para todo mundo ao mesmo tempo | Em `/saude`, se o IP disser "não identificado", a hospedagem não repassa o IP de quem visita e o limite conta todas as visitas juntas. Espere 15 minutos |
| Mudei algo no banco pelo phpMyAdmin e a vitrine não mudou | O app guarda as leituras em cache: Restart no cPanel |

## 9. Trocar uma senha

- **Senha de cada pessoa no painel:** a própria pessoa troca em **Minha conta** (tocando no nome dela, no alto do painel). Se esquecer, quem administra toca em "Gerar senha nova" no cartão dela em **Acessos** e manda a provisória pelo WhatsApp. Por isso é bom ter 2 pessoas na Administração.
- **Chave de emergência (`PAINEL_SENHA`):** atualize o secret no GitHub e rode **Actions › Publicar › Run workflow**.
- **cPanel/FTP ou MySQL:**
  1. Troque no cPanel (senha da conta ou do usuário do MySQL).
  2. Atualize o secret correspondente no GitHub (`FTP_SENHA` ou `MYSQL_PASSWORD`).
  3. Rode **Actions › Publicar › Run workflow**.
- **`SESSAO_SEGREDO`:** trocar desconecta todo mundo do painel (cada pessoa entra de novo com o e-mail e a senha dela).

Senhas que já circularam por mensagem devem ser trocadas ([proximos-passos.md](proximos-passos.md#pendências)).

## Se um dia mudar de hospedagem

O app precisa de Node.js 20 ou mais novo e de MySQL. Opções: outro plano com **Setup Node.js App**, uma VPS (rodar `node app.js` com o mesmo pacote), ou a Vercel usando um MySQL com acesso externo liberado.
