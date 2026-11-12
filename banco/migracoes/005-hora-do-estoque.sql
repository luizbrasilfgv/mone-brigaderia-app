-- Quando e por quem as quantidades do dia foram salvas, para o painel mostrar
-- "Salvo hoje às 9:12 por Ana". atualizado_em fica em UTC; atualizado_por é o nome
-- de quem salvou (vazio nas linhas antigas).
ALTER TABLE estoque_dia
  ADD COLUMN atualizado_em DATETIME NULL AFTER quantidade,
  ADD COLUMN atualizado_por VARCHAR(120) NOT NULL DEFAULT '' AFTER atualizado_em;
