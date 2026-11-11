import type { Campanha, Categoria, Doce } from "./tipos";
import * as exemplo from "./dados-exemplo";

// Ponto único de acesso aos dados. Hoje lê os dados de exemplo; para ligar o
// banco, troque o corpo destas funções por consultas (ex.: Supabase) e mantenha
// as assinaturas. As telas não precisam mudar.
//
// "use cache" guarda o resultado entre requisições. Quando o painel passar a
// gravar no banco, marque os dados com cacheTag() e chame updateTag() depois de
// salvar (veja a documentação em node_modules/next/dist/docs).

export async function listarCategorias(): Promise<Categoria[]> {
  "use cache";
  return [...exemplo.categorias].sort((a, b) => a.ordem - b.ordem);
}

export async function listarDoces(): Promise<Doce[]> {
  "use cache";
  return exemplo.doces.filter((d) => d.ativo);
}

export async function obterDoce(id: string): Promise<Doce | null> {
  "use cache";
  return exemplo.doces.find((d) => d.id === id) ?? null;
}

export async function listarCampanhas(): Promise<Campanha[]> {
  "use cache";
  return [...exemplo.campanhas].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export async function obterCampanha(id: string): Promise<Campanha | null> {
  "use cache";
  return exemplo.campanhas.find((c) => c.id === id) ?? null;
}
