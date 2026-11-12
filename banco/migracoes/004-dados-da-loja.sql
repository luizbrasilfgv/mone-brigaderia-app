-- Dados da loja que a Administração edita em Painel > Dados da loja (uma linha só, id = 1).
--
-- whatsapp: número que recebe os pedidos, com 55 + DDD, só dígitos.
-- horario_dom … horario_sab: horário de cada dia no formato '09:00-18:00'. Vazio = fechado.
--   Com todos vazios, a vitrine não mostra horário nem "Aberto agora".
-- retirada, entrega, pagamento: textos curtos que só informam (ex.: 'Retirada em Copacabana',
--   'Entrega a combinar', 'Pix ou dinheiro'). Vazio = não aparece.
-- tracos: ingredientes usados na cozinha, separados por vírgula (leite, trigo, ovo, castanhas,
--   amendoim, soja), para o "Pode conter traços de…". Com trigo, nenhum doce mostra "Sem glúten".

CREATE TABLE IF NOT EXISTS loja (
  id TINYINT NOT NULL PRIMARY KEY,
  whatsapp VARCHAR(13) NOT NULL DEFAULT '5521980631673',
  horario_dom VARCHAR(11) NOT NULL DEFAULT '',
  horario_seg VARCHAR(11) NOT NULL DEFAULT '',
  horario_ter VARCHAR(11) NOT NULL DEFAULT '',
  horario_qua VARCHAR(11) NOT NULL DEFAULT '',
  horario_qui VARCHAR(11) NOT NULL DEFAULT '',
  horario_sex VARCHAR(11) NOT NULL DEFAULT '',
  horario_sab VARCHAR(11) NOT NULL DEFAULT '',
  retirada VARCHAR(80) NOT NULL DEFAULT '',
  entrega VARCHAR(80) NOT NULL DEFAULT '',
  pagamento VARCHAR(80) NOT NULL DEFAULT '',
  tracos VARCHAR(100) NOT NULL DEFAULT '',
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO loja (id) VALUES (1);
