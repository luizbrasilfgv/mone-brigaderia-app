import mysql from "mysql2/promise";
import { connection } from "next/server";
import { ipDaVisita } from "@/lib/auth";
import { banco, bancoConfigurado, configuracaoDoBanco } from "@/lib/banco";
import { listarDoces } from "@/lib/dados";

// Diagnóstico do servidor (endereço /saude): mostra se o app achou as
// configurações e conseguiu falar com o banco. Não mostra senhas nem nomes.

const CONFIGURACOES = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "SESSAO_SEGREDO",
  "PAINEL_SENHA",
  "ADMIN_EMAILS",
  "SITE_URL",
  "UPLOAD_DIR",
];

function explicar(erro: unknown): string {
  const { code, message } = erro as { code?: string; message?: string };
  // Tira da mensagem o que vier entre aspas (usuário, banco, servidor).
  const mensagem = String(message ?? erro)
    .replace(/'[^']*'/g, "'…'")
    .slice(0, 300);
  return `ERRO ${code ?? ""} ${mensagem}`.replace(/\s+/g, " ");
}

async function etapa(nome: string, fazer: () => Promise<string>): Promise<string> {
  try {
    return `✓ ${nome}: ${await fazer()}`;
  } catch (erro) {
    return `✗ ${nome}: ${explicar(erro)}`;
  }
}

export async function GET() {
  await connection();
  const linhas = [
    "Mone Brigaderia: diagnóstico do servidor",
    `Versão publicada: ${process.env.MONE_VERSAO ?? "?"} · Node ${process.version}`,
    "Configurações:",
    ...CONFIGURACOES.map((nome) => `  ${process.env[nome] ? "✓" : "✗ FALTANDO"} ${nome}`),
  ];
  // O limite de tentativas de senha conta por IP. Se o servidor da hospedagem não
  // repassar o IP de quem visita, todas as visitas contam juntas.
  const ip = await ipDaVisita();
  const ipConhecido = !["sem-ip", "127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip);
  linhas.push(`${ipConhecido ? "✓" : "✗"} IP de quem visita: ${ipConhecido ? "identificado" : "não identificado (o limite de tentativas vale para todos juntos)"}`);
  if (!bancoConfigurado()) {
    linhas.push("✗ Banco: sem MYSQL_DATABASE (o arquivo .env foi enviado?)");
  } else {
    linhas.push(
      await etapa("Conexão com o MySQL", async () => {
        const conexao = await mysql.createConnection(configuracaoDoBanco());
        try {
          const [versao] = await conexao.query("SELECT VERSION() AS versao");
          const [tabelas] = await conexao.query("SHOW TABLES");
          return `ok (versão ${(versao as { versao: string }[])[0].versao}, ${(tabelas as unknown[]).length} tabelas)`;
        } finally {
          await conexao.end();
        }
      }),
    );
    linhas.push(
      await etapa("Preparação das tabelas", async () => {
        await banco();
        return "ok";
      }),
    );
    linhas.push(await etapa("Doces na vitrine", async () => String((await listarDoces()).length)));
  }
  return new Response(`${linhas.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
