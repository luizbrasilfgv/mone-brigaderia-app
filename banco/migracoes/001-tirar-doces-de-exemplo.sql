-- Tira os doces e as campanhas de exemplo do mockup, que entraram no banco na
-- primeira publicação. Fica só a palha italiana (a da foto de verdade).
-- Fotos, sabores, quantidades e vínculos com campanhas saem junto (ON DELETE CASCADE).

DELETE FROM campanhas WHERE id IN ('natal-2026', 'pascoa-2027', 'dia-das-maes-2027', 'dia-das-criancas-2026');

DELETE FROM doces WHERE id IN (
  'brigadeiro-tradicional',
  'bolo-de-pote-ninho-morango',
  'brigadeiro-ninho',
  'bolo-de-pote-prestigio',
  'bolo-de-pote-maracuja',
  'caixa-presente-4',
  'cento-de-brigadeiros',
  'caixa-9-doces',
  'caixa-de-natal',
  'bolo-de-pote-natal'
);
