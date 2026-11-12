-- Tabelas do banco (MySQL 5.7+ ou MariaDB 10.3+), a partir de docs/modelo-de-dados.md.
-- O app roda este arquivo toda vez que inicia (só cria o que ainda não existe).
-- Para criar na mão: phpMyAdmin › Importar este arquivo.

CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  ordem INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doces (
  id VARCHAR(80) NOT NULL PRIMARY KEY, -- também é o endereço da página: /doce/<id>
  categoria_id VARCHAR(40) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  preco_centavos INT NOT NULL,
  unidade VARCHAR(40) NOT NULL DEFAULT 'por unidade',
  contem_gluten TINYINT(1) NOT NULL DEFAULT 1,
  contem_lactose TINYINT(1) NOT NULL DEFAULT 1,
  composicao TEXT NOT NULL,
  conservacao TEXT NOT NULL,
  selo ENUM('nenhum', 'novo', 'mais_vendido') NOT NULL DEFAULT 'nenhum',
  sob_encomenda TINYINT(1) NOT NULL DEFAULT 0,
  prazo_dias INT NULL,
  onde_aparece ENUM('ano_todo', 'so_campanhas') NOT NULL DEFAULT 'ano_todo',
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  ordem INT NOT NULL DEFAULT 0,
  -- Desenho provisório (ex.: 'pote:morango') usado enquanto não há foto.
  ilustracao VARCHAR(40) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doces_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sabores (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  doce_id VARCHAR(80) NOT NULL,
  nome VARCHAR(80) NOT NULL,
  preco_centavos INT NULL, -- vazio = preço do doce
  ordem INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_sabores_doce FOREIGN KEY (doce_id) REFERENCES doces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fotos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  doce_id VARCHAR(80) NOT NULL,
  -- Nome do arquivo em UPLOAD_DIR (servido em /fotos/<nome>) ou caminho começando com /.
  caminho VARCHAR(255) NOT NULL,
  ordem INT NOT NULL DEFAULT 0, -- a de menor ordem é a principal
  CONSTRAINT fk_fotos_doce FOREIGN KEY (doce_id) REFERENCES doces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quantidade de cada doce por dia. Vale a linha mais recente: se a dona não
-- atualizar num dia, continua valendo a quantidade do último dia salvo.
CREATE TABLE IF NOT EXISTS estoque_dia (
  doce_id VARCHAR(80) NOT NULL,
  data DATE NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  PRIMARY KEY (doce_id, data),
  CONSTRAINT fk_estoque_doce FOREIGN KEY (doce_id) REFERENCES doces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campanhas (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  tipo ENUM('natal', 'pascoa', 'dia_das_maes', 'dia_dos_namorados', 'dia_do_chocolate', 'dia_dos_pais', 'outra') NOT NULL,
  nome VARCHAR(120) NOT NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  limite_encomenda DATE NULL,
  frase_banner VARCHAR(255) NOT NULL DEFAULT '',
  cor VARCHAR(9) NOT NULL DEFAULT '#3A1D13',
  pausada TINYINT(1) NOT NULL DEFAULT 0,
  rascunho TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Um doce pode estar em várias campanhas.
CREATE TABLE IF NOT EXISTS campanha_doces (
  campanha_id VARCHAR(80) NOT NULL,
  doce_id VARCHAR(80) NOT NULL,
  PRIMARY KEY (campanha_id, doce_id),
  CONSTRAINT fk_cd_campanha FOREIGN KEY (campanha_id) REFERENCES campanhas (id) ON DELETE CASCADE,
  CONSTRAINT fk_cd_doce FOREIGN KEY (doce_id) REFERENCES doces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quem pode entrar no painel (e-mail + senha da loja, ou Google se configurado). papel: admin (tudo, inclusive
-- acessos), equipe (doces, campanhas e quantidades) ou estoque (só quantidades).
CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  nome VARCHAR(120) NOT NULL DEFAULT '',
  foto VARCHAR(500) NULL,
  papel ENUM('admin', 'equipe', 'estoque') NOT NULL DEFAULT 'equipe',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  tutorial_visto TINYINT(1) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP NULL,
  UNIQUE KEY usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajustes de dados já aplicados (arquivos de banco/migracoes). Cada um roda uma vez só.
CREATE TABLE IF NOT EXISTS migracoes (
  nome VARCHAR(190) NOT NULL PRIMARY KEY,
  aplicada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
