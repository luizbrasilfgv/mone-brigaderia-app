// Gera banco/dados-exemplo.sql a partir de src/lib/dados-exemplo.ts.
// Uso: npm run banco:exemplo

import { writeFileSync } from "node:fs";
import { campanhas, categorias, doces } from "../src/lib/dados-exemplo.ts";

const texto = (v: string | null | undefined) => (v == null ? "NULL" : `'${v.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`);
const numero = (v: number | null | undefined) => (v == null ? "NULL" : String(Math.trunc(v)));
const bool = (v: boolean) => (v ? "1" : "0");

const linhas: string[] = [
  "-- Dados de exemplo do mockup (gerado por scripts/gerar-dados-exemplo-sql.ts; não edite à mão).",
  "-- O app carrega estes dados sozinho num banco vazio. Preços e textos são exemplos para a dona revisar.",
  "",
];

for (const c of categorias) {
  linhas.push(`INSERT INTO categorias (id, nome, ordem) VALUES (${texto(c.id)}, ${texto(c.nome)}, ${c.ordem});`);
}

doces.forEach((d, i) => {
  const ilustracao = d.ilustracao ? `${d.ilustracao.tipo}:${d.ilustracao.sabor}` : null;
  linhas.push(
    `INSERT INTO doces (id, categoria_id, nome, descricao, preco_centavos, unidade, contem_gluten, contem_lactose, composicao, conservacao, selo, sob_encomenda, prazo_dias, onde_aparece, destaque, ativo, ordem, ilustracao) VALUES (${[
      texto(d.id),
      texto(d.categoriaId),
      texto(d.nome),
      texto(d.descricao),
      numero(d.precoCentavos),
      texto(d.unidade),
      bool(d.contemGluten),
      bool(d.contemLactose),
      texto(d.composicao),
      texto(d.conservacao),
      texto(d.selo),
      bool(d.sobEncomenda),
      numero(d.prazoDias),
      texto(d.ondeAparece),
      bool(d.destaque),
      bool(d.ativo),
      String(i + 1),
      texto(ilustracao),
    ].join(", ")});`,
  );
  d.sabores.forEach((s, j) => {
    linhas.push(
      `INSERT INTO sabores (doce_id, nome, preco_centavos, ordem) VALUES (${texto(d.id)}, ${texto(s.nome)}, ${numero(s.precoCentavos)}, ${j});`,
    );
  });
  d.fotos.forEach((f, j) => {
    linhas.push(`INSERT INTO fotos (doce_id, caminho, ordem) VALUES (${texto(d.id)}, ${texto(f)}, ${j});`);
  });
  if (!d.sobEncomenda) {
    // Data de hoje no horário de Brasília (sem horário de verão desde 2019).
    linhas.push(
      `INSERT INTO estoque_dia (doce_id, data, quantidade) VALUES (${texto(d.id)}, DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00')), ${d.quantidadeHoje});`,
    );
  }
});

for (const c of campanhas) {
  linhas.push(
    `INSERT INTO campanhas (id, tipo, nome, inicio, fim, limite_encomenda, frase_banner, cor, pausada, rascunho) VALUES (${[
      texto(c.id),
      texto(c.tipo),
      texto(c.nome),
      texto(c.inicio),
      texto(c.fim),
      texto(c.limiteEncomenda),
      texto(c.fraseBanner),
      texto(c.cor),
      bool(c.pausada),
      bool(c.rascunho),
    ].join(", ")});`,
  );
}

for (const d of doces) {
  for (const id of d.campanhaIds) {
    linhas.push(`INSERT INTO campanha_doces (campanha_id, doce_id) VALUES (${texto(id)}, ${texto(d.id)});`);
  }
}

writeFileSync(new URL("../banco/dados-exemplo.sql", import.meta.url), linhas.join("\n") + "\n");
console.log(`banco/dados-exemplo.sql: ${linhas.length - 3} comandos`);
