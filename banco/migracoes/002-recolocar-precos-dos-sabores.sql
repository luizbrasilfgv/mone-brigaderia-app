-- Salvar a ficha apagava o preço próprio dos sabores (corrigido no app). Recoloca o
-- preço dos sabores da palha italiana que ficaram sem preço por causa disso.
UPDATE sabores SET preco_centavos = 1000 WHERE doce_id = 'palha-italiana' AND nome = 'Ninho' AND preco_centavos IS NULL;
UPDATE sabores SET preco_centavos = 1100 WHERE doce_id = 'palha-italiana' AND nome = 'Ninho com Nutella' AND preco_centavos IS NULL;
