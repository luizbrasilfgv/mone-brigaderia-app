-- Senha individual para cada pessoa do painel (a senha única da loja deixa de valer;
-- a PAINEL_SENHA vira só a chave de emergência de quem está em ADMIN_EMAILS).
--
-- usuarios.senha_hash: resumo scrypt da senha (nunca a senha). Vazio = ainda não tem
--   senha: só entra depois que a administração gerar uma provisória em Acessos.
-- usuarios.trocar_senha: 1 = entrou com senha provisória ou com a chave de emergência
--   e precisa criar a própria senha antes de usar o painel.
-- usuarios.senha_provisoria_expira: validade da senha provisória (UTC), 7 dias.
-- usuarios.sessao_versao: vai junto no cookie da sessão. Aumentar derruba as sessões
--   antigas dessa pessoa (trocar senha, gerar senha nova, sair de todos os aparelhos).
-- tentativas_login: erros de senha, para o limite de tentativas (apagados depois de 1 dia).

CREATE TABLE IF NOT EXISTS tentativas_login (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  momento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY tentativas_ip (ip, momento),
  KEY tentativas_momento (momento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Um ALTER só: se falhar, nada muda e a migração roda de novo no próximo início.
ALTER TABLE usuarios
  ADD COLUMN senha_hash VARCHAR(255) NULL AFTER foto,
  ADD COLUMN trocar_senha TINYINT(1) NOT NULL DEFAULT 0 AFTER senha_hash,
  ADD COLUMN senha_provisoria_expira DATETIME NULL AFTER trocar_senha,
  ADD COLUMN sessao_versao INT NOT NULL DEFAULT 1 AFTER senha_provisoria_expira;
