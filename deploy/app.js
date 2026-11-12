// Arquivo de entrada do app no servidor (no cPanel: "Application startup file").
//
// A publicação envia um pacote só (pacote.tar.gz) em vez de milhares de arquivos,
// porque o FTP da hospedagem derruba envios longos. Ao iniciar, este arquivo:
// 1. lê as configurações do .env ao lado;
// 2. desempacota a versão nova em versoes/<id>, se ainda não estiver lá;
// 3. inicia o servidor do Next.js dessa versão.

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const raiz = __dirname;

function carregarEnv() {
  const arquivo = path.join(raiz, ".env");
  if (!fs.existsSync(arquivo)) return;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const igual = linha.indexOf("=");
    if (!linha.trim() || linha.trimStart().startsWith("#") || igual === -1) continue;
    const nome = linha.slice(0, igual).trim();
    // Configurações feitas direto no painel da hospedagem têm prioridade.
    if (process.env[nome] === undefined) process.env[nome] = linha.slice(igual + 1);
  }
}

// Leitor mínimo de .tar (formatos ustar e GNU, com nomes longos), sem dependências.
function extrairTar(buffer, destino) {
  const texto = (inicio, fim) => buffer.toString("utf8", inicio, fim).replace(/\0.*$/s, "");
  let posicao = 0;
  let nomeLongo = null;
  while (posicao + 512 <= buffer.length) {
    const inicio = posicao;
    const cabecalho = buffer.subarray(inicio, inicio + 512);
    if (cabecalho.every((b) => b === 0)) break;
    const tamanho = parseInt(texto(inicio + 124, inicio + 136).trim() || "0", 8);
    const tipo = String.fromCharCode(cabecalho[156] || 48);
    const prefixo = texto(inicio + 345, inicio + 500);
    const nomeCurto = texto(inicio, inicio + 100);
    let nome = nomeLongo ?? (prefixo ? `${prefixo}/${nomeCurto}` : nomeCurto);
    nomeLongo = null;
    const inicioDados = inicio + 512;
    posicao = inicioDados + Math.ceil(tamanho / 512) * 512;

    if (tipo === "L") {
      nomeLongo = buffer.toString("utf8", inicioDados, inicioDados + tamanho).replace(/\0.*$/s, "");
      continue;
    }
    if (tipo === "x" || tipo === "g") {
      const pax = buffer.toString("utf8", inicioDados, inicioDados + tamanho);
      const caminho = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(pax);
      if (caminho && tipo === "x") nomeLongo = caminho[1];
      continue;
    }

    nome = nome.replace(/^\.\//, "");
    if (!nome || nome === ".") continue;
    const alvo = path.join(destino, nome);
    // Não deixa o pacote escrever fora da pasta de destino.
    if (!alvo.startsWith(destino + path.sep)) throw new Error(`caminho inválido no pacote: ${nome}`);

    if (tipo === "5") {
      fs.mkdirSync(alvo, { recursive: true });
    } else if (tipo === "2") {
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      fs.symlinkSync(texto(inicio + 157, inicio + 257), alvo);
    } else if (tipo === "0" || tipo === "\0" || tipo === "7") {
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      fs.writeFileSync(alvo, buffer.subarray(inicioDados, inicioDados + tamanho));
    }
  }
}

function prepararVersao() {
  const pacote = path.join(raiz, "pacote.tar.gz");
  const arquivoId = path.join(raiz, "pacote.id");
  if (!fs.existsSync(pacote) || !fs.existsSync(arquivoId)) {
    throw new Error("pacote.tar.gz ou pacote.id não encontrado: rode a publicação de novo");
  }
  const id = fs.readFileSync(arquivoId, "utf8").trim().replace(/[^a-zA-Z0-9_-]/g, "");
  const versoes = path.join(raiz, "versoes");
  const destino = path.join(versoes, id);
  if (fs.existsSync(path.join(destino, "server.js"))) return destino;

  // Desempacota numa pasta temporária e só depois troca o nome, para nunca ficar
  // uma versão pela metade (o servidor pode iniciar mais de um processo ao mesmo tempo).
  const temporaria = `${destino}.tmp-${process.pid}`;
  fs.rmSync(temporaria, { recursive: true, force: true });
  fs.mkdirSync(temporaria, { recursive: true });
  extrairTar(zlib.gunzipSync(fs.readFileSync(pacote)), temporaria);
  try {
    fs.renameSync(temporaria, destino);
  } catch (erro) {
    fs.rmSync(temporaria, { recursive: true, force: true });
    if (!fs.existsSync(path.join(destino, "server.js"))) throw erro;
  }
  console.log(`[app] versão ${id} pronta`);

  // Guarda só a versão atual e a anterior.
  const antigas = fs
    .readdirSync(versoes)
    .filter((nome) => nome !== id && !nome.includes(".tmp-"))
    .map((nome) => ({ nome, data: fs.statSync(path.join(versoes, nome)).mtimeMs }))
    .sort((a, b) => b.data - a.data)
    .slice(1);
  for (const { nome } of antigas) fs.rmSync(path.join(versoes, nome), { recursive: true, force: true });
  return destino;
}

// Copia tudo o que o app escreve (inclusive os erros) para registro.log, ao lado
// deste arquivo: a hospedagem não guarda esses registros num lugar fácil de ver.
function gravarRegistro() {
  const arquivo = path.join(raiz, "registro.log");
  try {
    if (fs.statSync(arquivo).size > 5 * 1024 * 1024) fs.renameSync(arquivo, `${arquivo}.1`);
  } catch {}
  const saida = fs.createWriteStream(arquivo, { flags: "a" });
  saida.on("error", () => {});
  for (const fluxo of [process.stdout, process.stderr]) {
    const original = fluxo.write.bind(fluxo);
    fluxo.write = (pedaco, ...resto) => {
      saida.write(pedaco);
      return original(pedaco, ...resto);
    };
  }
  console.log(`\n[app] iniciando em ${new Date().toISOString()}`);
}

gravarRegistro();
carregarEnv();
process.env.NODE_ENV = "production";
// Hospedagens costumam definir HOSTNAME com o nome da máquina; o Next.js usaria
// isso como endereço de escuta. A hospedagem (Passenger) cuida do resto.
process.env.HOSTNAME = "0.0.0.0";

try {
  const versao = prepararVersao();
  process.env.MONE_VERSAO = path.basename(versao);
  process.chdir(versao);
  require(path.join(versao, "server.js"));
} catch (erro) {
  console.error("[app] não conseguiu iniciar:", erro);
  throw erro;
}
