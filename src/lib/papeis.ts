// Papéis de quem usa o painel. Fica separado de auth.ts para as telas (no
// navegador) também poderem usar.

export type Papel = "admin" | "equipe" | "estoque";

const NIVEL: Record<Papel, number> = { estoque: 1, equipe: 2, admin: 3 };

export function pode(pessoa: { papel: Papel }, minimo: Papel): boolean {
  return NIVEL[pessoa.papel] >= NIVEL[minimo];
}

export const PAPEIS: { valor: Papel; nome: string; descricao: string }[] = [
  { valor: "admin", nome: "Administração", descricao: "Tudo, inclusive liberar e tirar acessos" },
  { valor: "equipe", nome: "Equipe", descricao: "Doces, fotos, campanhas e quantidades do dia" },
  { valor: "estoque", nome: "Estoque", descricao: "Só as quantidades do dia" },
];

export function nomeDoPapel(papel: Papel): string {
  return PAPEIS.find((p) => p.valor === papel)?.nome ?? papel;
}
