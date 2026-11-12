-- Dados iniciais (gerado por scripts/gerar-dados-iniciais-sql.ts; não edite à mão).
-- O app carrega estes dados sozinho num banco vazio: as categorias e a palha italiana.

INSERT INTO categorias (id, nome, ordem) VALUES ('brigadeiros', 'Brigadeiros', 1);
INSERT INTO categorias (id, nome, ordem) VALUES ('palhas', 'Palhas', 2);
INSERT INTO categorias (id, nome, ordem) VALUES ('potes', 'Bolos de pote', 3);
INSERT INTO categorias (id, nome, ordem) VALUES ('kits', 'Caixas e kits', 4);
INSERT INTO doces (id, categoria_id, nome, descricao, preco_centavos, unidade, contem_gluten, contem_lactose, composicao, conservacao, selo, sob_encomenda, prazo_dias, onde_aparece, destaque, ativo, ordem, ilustracao) VALUES ('palha-italiana', 'palhas', 'Palha italiana', 'Brigadeiro cremoso com pedaços de biscoito, cortado em quadrado e finalizado no açúcar de confeiteiro. Embalado um a um.', 900, 'por unidade', 1, 1, 'Leite condensado, chocolate, manteiga, biscoito de maisena e açúcar de confeiteiro.', 'Em temperatura ambiente, longe do calor. Consumir em até 5 dias.', 'mais_vendido', 0, NULL, 'ano_todo', 1, 1, 1, NULL);
INSERT INTO sabores (doce_id, nome, preco_centavos, ordem) VALUES ('palha-italiana', 'Tradicional', NULL, 0);
INSERT INTO sabores (doce_id, nome, preco_centavos, ordem) VALUES ('palha-italiana', 'Ninho', 1000, 1);
INSERT INTO sabores (doce_id, nome, preco_centavos, ordem) VALUES ('palha-italiana', 'Ninho com Nutella', 1100, 2);
INSERT INTO fotos (doce_id, caminho, ordem) VALUES ('palha-italiana', '/imagens/palha-italiana.jpg', 0);
INSERT INTO estoque_dia (doce_id, data, quantidade) VALUES ('palha-italiana', DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00')), 12);
