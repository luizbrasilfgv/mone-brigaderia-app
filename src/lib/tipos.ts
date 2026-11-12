// Tipos do domínio. Espelham as tabelas de docs/modelo-de-dados.md (em camelCase).

export type TipoIlustracao = "pote" | "brigadeiro" | "caixa";
export type SaborIlustracao =
  | "morango"
  | "prestigio"
  | "maracuja"
  | "natal"
  | "chocolate"
  | "ninho"
  | "sortido";

// Desenho provisório usado enquanto o doce não tem foto.
export interface Ilustracao {
  tipo: TipoIlustracao;
  sabor: SaborIlustracao;
}

export type Selo = "nenhum" | "novo" | "mais_vendido";
export type OndeAparece = "ano_todo" | "so_campanhas";

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
}

export interface Sabor {
  id: string;
  nome: string;
  // Vazio = mesmo preço do doce.
  precoCentavos?: number;
}

export interface Doce {
  id: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  precoCentavos: number;
  // Texto que acompanha o preço: "por unidade", "por caixa"...
  unidade: string;
  contemGluten: boolean;
  contemLactose: boolean;
  composicao: string;
  conservacao: string;
  selo: Selo;
  sobEncomenda: boolean;
  // Só para doce sob encomenda.
  prazoDias: number | null;
  ondeAparece: OndeAparece;
  destaque: boolean;
  ativo: boolean;
  // Última quantidade salva em estoque_dia (pode ser de outro dia). Ignorado quando sobEncomenda.
  quantidadeHoje: number;
  // Dia dessa quantidade (AAAA-MM-DD). null nos dados de exemplo ou sem nenhuma
  // contagem: vale como contagem de hoje.
  dataQuantidade: string | null;
  sabores: Sabor[];
  // A primeira foto é a principal.
  fotos: string[];
  ilustracao: Ilustracao | null;
  campanhaIds: string[];
}

export type TipoCampanha =
  | "natal"
  | "pascoa"
  | "dia_das_maes"
  | "dia_dos_namorados"
  | "dia_do_chocolate"
  | "dia_dos_pais"
  | "outra";

export interface Campanha {
  id: string;
  tipo: TipoCampanha;
  nome: string;
  // Datas no formato AAAA-MM-DD.
  inicio: string;
  fim: string;
  limiteEncomenda: string | null;
  fraseBanner: string;
  cor: string;
  pausada: boolean;
  rascunho: boolean;
}
