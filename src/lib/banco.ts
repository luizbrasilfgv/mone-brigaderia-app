import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

// Conexão com o MySQL. Sem MYSQL_DATABASE configurado, o app usa os dados de
// exemplo e o painel fica em modo demonstração.

export function bancoConfigurado(): boolean {
  return Boolean(process.env.MYSQL_DATABASE);
}

type Global = typeof globalThis & { __monePool?: mysql.Pool; __monePronto?: Promise<void> };
const g = globalThis as Global;

export function configuracaoDoBanco(): mysql.PoolOptions {
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: "utf8mb4",
    // Datas (DATE) chegam como texto AAAA-MM-DD, sem conversão de fuso.
    dateStrings: true,
    connectionLimit: 5,
  };
}

// Ao iniciar: cria as tabelas que faltam (schema.sql só usa CREATE TABLE IF NOT
// EXISTS), carrega os dados iniciais se o banco estiver vazio e aplica, uma vez
// só, os ajustes de banco/migracoes (em ordem de nome).
async function prepararBanco(): Promise<void> {
  const conexao = await mysql.createConnection({ ...configuracaoDoBanco(), multipleStatements: true });
  try {
    const pasta = path.join(process.cwd(), "banco");
    await conexao.query(await readFile(path.join(pasta, "schema.sql"), "utf8"));
    const [linhas] = await conexao.query("SELECT COUNT(*) AS total FROM categorias");
    if ((linhas as { total: number }[])[0].total === 0) {
      await conexao.query(await readFile(path.join(pasta, "dados-iniciais.sql"), "utf8"));
      console.log("[banco] dados iniciais carregados");
    }
    const migracoes = (await readdir(path.join(pasta, "migracoes"))).filter((nome) => nome.endsWith(".sql")).sort();
    for (const nome of migracoes) {
      const [feita] = await conexao.query("SELECT 1 FROM migracoes WHERE nome = ?", [nome]);
      if ((feita as unknown[]).length > 0) continue;
      await conexao.query(await readFile(path.join(pasta, "migracoes", nome), "utf8"));
      await conexao.query("INSERT IGNORE INTO migracoes (nome) VALUES (?)", [nome]);
      console.log(`[banco] ajuste aplicado: ${nome}`);
    }
  } finally {
    await conexao.end();
  }
}

export async function banco(): Promise<mysql.Pool> {
  if (!g.__monePronto) {
    g.__monePronto = prepararBanco().catch((erro) => {
      g.__monePronto = undefined;
      throw erro;
    });
  }
  await g.__monePronto;
  g.__monePool ??= mysql.createPool(configuracaoDoBanco());
  return g.__monePool;
}

// "Hoje" no horário de Brasília, calculado pelo MySQL (o Brasil não tem mais horário de verão).
export const HOJE_SQL = "DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00'))";
