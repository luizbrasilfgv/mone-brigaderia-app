// Gera banco/dados-iniciais.sql: o que um banco novo recebe na primeira vez.
// Vão as categorias e só os doces reais da loja (por enquanto, a palha italiana
// com a foto de verdade). Os outros doces de src/lib/dados-exemplo.ts servem só
// para o modo demonstração, sem banco.
// Uso: npm run banco:iniciais

import { writeFileSync } from "node:fs";
import { categorias, doces as todosOsDoces } from "../src/lib/dados-exemplo.ts";

const DOCES_REAIS = ["palha-italiana"];
const doces = todosOsDoces.filter((d) => DOCES_REAIS.includes(d.id));

const texto = (v: string | null | undefined) => (v == null ? "NULL" : `'${v.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`);
const numero = (v: number | null | undefined) => (v == null ? "NULL" : String(Math.trunc(v)));
const bool = (v: boolean) => (v ? "1" : "0");

const linhas: string[] = [
  "-- Dados iniciais (gerado por scripts/gerar-dados-iniciais-sql.ts; não edite à mão).",
  "-- O app carrega estes dados sozinho num banco vazio: as categorias e a palha italiana.",
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

writeFileSync(new URL("../banco/dados-iniciais.sql", import.meta.url), linhas.join("\n") + "\n");
console.log(`banco/dados-iniciais.sql: ${linhas.length - 3} comandos`);
