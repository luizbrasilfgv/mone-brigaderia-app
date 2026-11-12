import "server-only";
import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Senhas de quem usa o painel: guardadas só como resumo scrypt, com um salt
// diferente para cada pessoa. Formato: scrypt$N$r$p$<salt>$<resumo> (base64).

const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 64;

function derivar(senha: string, salt: Buffer, opcoes: ScryptOptions, tamanho: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(senha.normalize("NFC"), salt, tamanho, opcoes, (erro, chave) => (erro ? reject(erro) : resolve(chave))),
  );
}

export async function resumirSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const resumo = await derivar(senha, salt, { N, r: R, p: P }, TAMANHO);
  return ["scrypt", N, R, P, salt.toString("base64"), resumo.toString("base64")].join("$");
}

// Resumo de uma senha qualquer, para quem não tem senha levar o mesmo tempo para
// receber a resposta (o tempo não revela quais e-mails têm acesso).
let resumoFalso: Promise<string> | null = null;

export async function senhaConfere(senha: string, guardado: string | null | undefined): Promise<boolean> {
  if (!guardado) {
    resumoFalso ??= resumirSenha(randomBytes(12).toString("hex"));
    await senhaConfere(senha, await resumoFalso);
    return false;
  }
  const [tipo, n, r, p, saltTexto, resumoTexto] = guardado.split("$");
  if (tipo !== "scrypt" || !saltTexto || !resumoTexto) return false;
  const esperado = Buffer.from(resumoTexto, "base64");
  const calculado = await derivar(senha, Buffer.from(saltTexto, "base64"), { N: Number(n), r: Number(r), p: Number(p) }, esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// Senha provisória fácil de ler e ditar: palavra + 4 números (ex.: cacau-4827).
// As palavras não têm i, l, o nem acento e os números vão de 2 a 9, para não
// confundir 1 com l nem 0 com o.
const PALAVRAS = [
  "cacau", "nata", "creme", "cereja", "menta", "trufa", "festa", "massa", "manga", "caju",
  "jaca", "pera", "uva", "maracuja", "guarana", "tamara", "mate", "rapadura", "garapa", "cafe",
  "merenda", "sagu", "pequena", "banana", "abacate", "batata", "quente", "fresca", "gema", "neve",
  "nuvem", "mesa", "chave", "verde", "taxa", "zebra", "tapete", "barca", "semana", "festeja",
];

export function gerarSenhaProvisoria(): string {
  const palavra = PALAVRAS[randomInt(PALAVRAS.length)];
  const numeros = Array.from({ length: 4 }, () => String(randomInt(2, 10))).join("");
  return `${palavra}-${numeros}`;
}

export const MINIMO_SENHA = 8;
const OBVIAS = new Set([
  "12345678", "123456789", "1234567890", "87654321", "12341234", "11223344", "senha123", "senha1234",
  "abcdefgh", "abcd1234", "qwertyui", "password", "mone1234", "monebrigaderia",
]);

// Regras da senha nova: pelo menos 8 letras ou números, sem exigir maiúscula ou
// símbolo. Recusa as óbvias, o próprio e-mail e a provisória (quem chama confere).
export function problemaNaSenhaNova(senha: string, email: string): string | null {
  if (senha.length < MINIMO_SENHA) return `A senha precisa ter pelo menos ${MINIMO_SENHA} letras ou números.`;
  if (senha.length > 200) return "A senha passou de 200 letras.";
  const simples = senha.trim().toLowerCase();
  if (OBVIAS.has(simples) || /^(.)\1+$/.test(simples)) return "Essa senha é fácil demais de adivinhar. Escolha outra.";
  const usuario = email.split("@")[0];
  if (simples === email || simples === usuario) return "A senha não pode ser o seu e-mail.";
  return null;
}
