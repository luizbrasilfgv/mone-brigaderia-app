// Arquivo de entrada do app no servidor (no cPanel: "Application startup file").
// Lê as configurações do arquivo .env ao lado (escrito pela publicação automática)
// e inicia o servidor do Next.js.

const fs = require("node:fs");
const path = require("node:path");

const arquivoEnv = path.join(__dirname, ".env");
if (fs.existsSync(arquivoEnv)) {
  for (const linha of fs.readFileSync(arquivoEnv, "utf8").split(/\r?\n/)) {
    const igual = linha.indexOf("=");
    if (!linha.trim() || linha.trimStart().startsWith("#") || igual === -1) continue;
    const nome = linha.slice(0, igual).trim();
    // Configurações feitas direto no painel da hospedagem têm prioridade.
    if (process.env[nome] === undefined) process.env[nome] = linha.slice(igual + 1);
  }
}

process.env.NODE_ENV = "production";
process.chdir(__dirname);
require("./server.js");
