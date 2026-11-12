-- Alergênicos completos: a coluna alergenicos guarda o que o doce contém (leite, trigo,
-- ovo, castanhas, amendoim, soja). Vazio = não leva nenhum destes; NULL = não informado
-- (a ficha pede para perguntar no WhatsApp antes de pedir).
-- contem_gluten e contem_lactose ficam no banco e o app continua gravando nelas (trigo e
-- leite), mas quem lê passa a ler alergenicos. Glúten vira trigo e lactose vira leite;
-- doce marcado sem os dois fica "não informado", porque nada se sabia dos outros.
ALTER TABLE doces
  ADD COLUMN alergenicos SET('leite', 'trigo', 'ovo', 'castanhas', 'amendoim', 'soja') NULL AFTER contem_lactose;

UPDATE doces SET alergenicos = NULLIF(CONCAT_WS(',', IF(contem_lactose = 1, 'leite', NULL), IF(contem_gluten = 1, 'trigo', NULL)), '');
