// "Bolo de pote Ninho & morango" → "bolo-de-pote-ninho-morango"
export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

// Domínios de e-mail mais usados. Um domínio parecido com um destes (uma ou duas
// letras trocadas) costuma ser erro de digitação.
const DOMINIOS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "yahoo.com.br",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
];
// Domínios que não existem e a distância entre as palavras não pega.
const TROCAS: Record<string, string> = {
  "gmail.com.br": "gmail.com",
  "icloud.com.br": "icloud.com",
};

// Quantas letras trocadas, faltando, sobrando ou invertidas separam duas palavras.
function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// "ana@gmial.com" → "ana@gmail.com". Devolve null se o domínio parecer certo.
export function sugestaoDeEmail(email: string): string | null {
  const [usuario, dominio, ...resto] = email.trim().toLowerCase().split("@");
  if (!usuario || !dominio || resto.length > 0 || DOMINIOS.includes(dominio)) return null;
  const certo = TROCAS[dominio] ?? DOMINIOS.find((d) => distancia(d, dominio) <= (d.length > 9 ? 2 : 1));
  return certo ? `${usuario}@${certo}` : null;
}
