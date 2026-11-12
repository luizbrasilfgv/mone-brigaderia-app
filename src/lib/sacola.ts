import type { Campanha, Doce, Sabor } from "./tipos";
import type { Horarios } from "./horarios";
import { LOJA } from "./loja";
import {
  LIMITE_ENCOMENDA,
  LIMITE_SEM_CONTAGEM,
  campanhaDoDoce,
  campanhasNoAr,
  contagemDeHoje,
  doceApareceNaVitrine,
  encomendaAberta,
  formatarPreco,
  precoDoSabor,
  prontoAPartirDe,
  rotuloData,
} from "./regras";

// Sacola de quem compra. Fica só no celular (localStorage, chaves em src/lib/hooks.ts):
// nada vai para o servidor nem para o banco. Enviar a mensagem no WhatsApp é fazer o
// pedido, e ele só vale quando a Mone responder confirmando.
//
// Funções puras: conferem a sacola com o cardápio do dia e montam o recibo.

// No máximo 20 linhas diferentes (também mantém o link do WhatsApp num tamanho seguro).
export const LIMITE_LINHAS = 20;
// A sacola some 7 dias depois da última mudança; o último pedido, 7 dias depois do envio.
export const DIAS_DE_GUARDA = 7;
const GUARDA_MS = DIAS_DE_GUARDA * 86_400_000;

// Uma linha = doce (o id, que não muda) + opção guardada pelo NOME (o id do sabor muda a
// cada "Salvar ficha"). null para doce com 0 ou 1 opção.
export interface LinhaGuardada {
  doceId: string;
  opcao: string | null;
  quantidade: number;
  // Preço de uma unidade quando a pessoa mexeu na linha (só para o aviso "Preço atualizado").
  precoVisto: number;
  // Só para mostrar um doce que saiu do cardápio.
  nomeDoce: string;
  adicionadaEm: number;
}

export interface SacolaGuardada {
  v: 1;
  atualizadaEm: number;
  // Número do pedido (1000-9999): nasce com o primeiro doce e vai junto no recibo.
  numero: number | null;
  linhas: LinhaGuardada[];
}

export const SACOLA_VAZIA: SacolaGuardada = { v: 1, atualizadaEm: 0, numero: null, linhas: [] };

export interface UltimoPedido {
  numero: number;
  enviadoEm: number;
  nome: string;
  linhas: { doceId: string; nomeDoce: string; opcao: string | null; quantidade: number; subtotalCentavos: number }[];
  totalCentavos: number;
  itens: number;
  mensagem: string;
}

// --- Leitura do que está guardado ---

function inteiro(valor: unknown, min: number, max: number): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= min && valor <= max ? valor : null;
}

function texto(valor: unknown, max: number): string | null {
  return typeof valor === "string" ? valor.trim().slice(0, max) : null;
}

// Lê a sacola guardada. Texto estragado vira sacola vazia; sacola parada há mais de 7
// dias também, com a data dela em vencidaEm (para "Sua sacola de 03/11 foi esvaziada").
// agora = 0: ainda sem relógio (primeira pintura), não confere o prazo.
export function lerSacola(bruto: string, agora: number): { sacola: SacolaGuardada; vencidaEm: number | null } {
  let dados: Partial<SacolaGuardada> | null = null;
  try {
    dados = bruto ? (JSON.parse(bruto) as Partial<SacolaGuardada>) : null;
  } catch {
    dados = null;
  }
  if (!dados || dados.v !== 1 || !Array.isArray(dados.linhas)) return { sacola: SACOLA_VAZIA, vencidaEm: null };
  const linhas: LinhaGuardada[] = [];
  for (const l of dados.linhas as unknown[]) {
    const x = (l ?? {}) as Record<string, unknown>;
    const doceId = texto(x.doceId, 80);
    const quantidade = inteiro(x.quantidade, 1, 9999);
    if (!doceId || !quantidade) continue;
    linhas.push({
      doceId,
      opcao: texto(x.opcao, 80) || null,
      quantidade,
      precoVisto: inteiro(x.precoVisto, 0, 100_000_000) ?? 0,
      nomeDoce: texto(x.nomeDoce, 120) ?? doceId,
      adicionadaEm: inteiro(x.adicionadaEm, 0, Number.MAX_SAFE_INTEGER) ?? 0,
    });
  }
  const atualizadaEm = inteiro(dados.atualizadaEm, 0, Number.MAX_SAFE_INTEGER) ?? 0;
  if (linhas.length === 0) return { sacola: SACOLA_VAZIA, vencidaEm: null };
  if (agora > 0 && agora - atualizadaEm > GUARDA_MS) return { sacola: SACOLA_VAZIA, vencidaEm: atualizadaEm };
  return { sacola: { v: 1, atualizadaEm, numero: inteiro(dados.numero, 1000, 9999), linhas }, vencidaEm: null };
}

// Último pedido enviado, por até 7 dias. null = nenhum (ou vencido).
export function lerUltimoPedido(bruto: string, agora: number): UltimoPedido | null {
  try {
    const p = JSON.parse(bruto) as UltimoPedido;
    if (!inteiro(p?.numero, 1000, 9999) || !Array.isArray(p.linhas) || typeof p.mensagem !== "string") return null;
    if (agora > 0 && agora - p.enviadoEm > GUARDA_MS) return null;
    return p;
  } catch {
    return null;
  }
}

// --- Opções, unidades e limites ---

// Nome da opção sem espaços nas pontas, comparado sem diferença de maiúsculas.
function chaveDaOpcao(opcao: string | null): string {
  return (opcao ?? "").trim().toLocaleLowerCase("pt-BR");
}

export function mesmaOpcao(a: string | null, b: string | null): boolean {
  return chaveDaOpcao(a) === chaveDaOpcao(b);
}

export function chaveDaLinha(doceId: string, opcao: string | null): string {
  return `${doceId}|${chaveDaOpcao(opcao)}`;
}

// Doce com 2 ou mais opções: a linha guarda qual. Com 0 ou 1, não.
export function temOpcoes(doce: Doce): boolean {
  return doce.sabores.length > 1;
}

export function saborDaOpcao(doce: Doce, opcao: string | null): Sabor | undefined {
  return doce.sabores.find((s) => mesmaOpcao(s.nome, opcao));
}

// Preço de uma unidade: o do sabor, o da única opção ou o do doce.
export function precoDaOpcao(doce: Doce, opcao: string | null): number {
  return precoDoSabor(doce, temOpcoes(doce) ? saborDaOpcao(doce, opcao) : doce.sabores[0]);
}

export function unidadesNaSacola(sacola: SacolaGuardada): number {
  return sacola.linhas.reduce((total, l) => total + l.quantidade, 0);
}

export function unidadesDoDoce(sacola: SacolaGuardada, doceId: string): number {
  return sacola.linhas.filter((l) => l.doceId === doceId).reduce((total, l) => total + l.quantidade, 0);
}

// Quantas unidades de um doce podem ir num pedido (todas as opções somadas): a
// quantidade de hoje, 20 com contagem de outro dia ou 99 sob encomenda. O número nunca
// aparece para quem compra.
export function limiteDoDoce(doce: Doce, hoje: string): number {
  if (doce.sobEncomenda) return LIMITE_ENCOMENDA;
  if (!contagemDeHoje(doce, hoje)) return LIMITE_SEM_CONTAGEM;
  return Math.max(doce.quantidadeHoje, 0);
}

export type Motivo = "esgotou" | "saiu_da_vitrine" | "opcao_saiu" | "encomenda_encerrada" | "sem_tempo_campanha";

export interface SituacaoDoDoce {
  // Por que não dá para adicionar agora (null = dá).
  bloqueio: Exclude<Motivo, "opcao_saiu"> | null;
  // Campanha que manda no doce "só em campanhas" que está no ar.
  campanha: Campanha | null;
  // Sob encomenda: primeiro dia em que fica pronto.
  prontoEm: string | null;
}

// Regras para um doce entrar (ou continuar) na sacola: vitrine, estoque e prazo da campanha.
export function situacaoDoDoce(doce: Doce, campanhas: Campanha[], hoje: string, horarios: Horarios): SituacaoDoDoce {
  const noAr = campanhasNoAr(campanhas, hoje);
  const campanha = campanhaDoDoce(doce, noAr);
  const prontoEm = doce.sobEncomenda ? prontoAPartirDe(doce.prazoDias ?? 1, hoje, horarios) : null;
  let bloqueio: SituacaoDoDoce["bloqueio"] = null;
  if (!doceApareceNaVitrine(doce, new Set(noAr.map((c) => c.id)))) bloqueio = "saiu_da_vitrine";
  else if (doce.sobEncomenda && campanha && !encomendaAberta(campanha, hoje).aberta) bloqueio = "encomenda_encerrada";
  else if (doce.sobEncomenda && campanha && prontoEm && prontoEm > campanha.fim) bloqueio = "sem_tempo_campanha";
  else if (!doce.sobEncomenda && limiteDoDoce(doce, hoje) <= 0) bloqueio = "esgotou";
  return { bloqueio, campanha, prontoEm };
}

// --- Adicionar (ficha do doce) ---

export function sortearNumero(): number {
  const sorteio = new Uint32Array(1);
  crypto.getRandomValues(sorteio);
  return 1000 + (sorteio[0] % 9000);
}

// Soma as escolhas da ficha às linhas que já existem (mesmo doce e mesma opção). O
// número do pedido nasce aqui, quando o primeiro doce entra numa sacola vazia.
// null = passaria de 20 linhas diferentes (nada entra).
export function adicionarLinhas(
  sacola: SacolaGuardada,
  doce: Doce,
  escolhas: { opcao: string | null; quantidade: number }[],
  agora: number,
  numeroNovo: number,
): SacolaGuardada | null {
  const linhas = sacola.linhas.map((l) => ({ ...l }));
  for (const { opcao, quantidade } of escolhas) {
    if (quantidade <= 0) continue;
    const nome = temOpcoes(doce) ? (saborDaOpcao(doce, opcao)?.nome ?? opcao) : null;
    const existente = linhas.find((l) => l.doceId === doce.id && mesmaOpcao(l.opcao, nome));
    const preco = precoDaOpcao(doce, nome);
    if (existente) {
      Object.assign(existente, { quantidade: existente.quantidade + quantidade, precoVisto: preco, nomeDoce: doce.nome, opcao: nome, adicionadaEm: agora });
    } else {
      linhas.push({ doceId: doce.id, opcao: nome, quantidade, precoVisto: preco, nomeDoce: doce.nome, adicionadaEm: agora });
    }
  }
  if (linhas.length > LIMITE_LINHAS) return null;
  return { v: 1, atualizadaEm: agora, numero: sacola.linhas.length > 0 && sacola.numero ? sacola.numero : numeroNovo, linhas };
}

// --- Conferência com o cardápio do dia ---

export type Bloco = "pronta" | "encomenda";

export interface LinhaConferida {
  chave: string;
  doceId: string;
  doce: Doce | null;
  // Nome atual do doce (ou o guardado, se ele saiu do cardápio).
  nomeDoce: string;
  // Opção como está no cardápio (ou a guardada, se saiu).
  opcao: string | null;
  situacao: "vai" | "nao_vai" | "escolher";
  motivo: Motivo | null;
  // Quantidade que vai no pedido (já com o corte pelo estoque de hoje).
  quantidade: number;
  precoCentavos: number;
  subtotalCentavos: number;
  // Preço que a pessoa viu, quando mudou ("Preço atualizado (antes R$ 9,00)").
  precoAntes: number | null;
  // A quantidade foi cortada pelo estoque de hoje ("Tem menos hoje...").
  cortada: boolean;
  bloco: Bloco;
  // Sob encomenda de campanha num pedido em que a data única passa do fim dela.
  ateFimDaCampanha: string | null;
  // O que gravar desta linha quando a pessoa mexer em qualquer coisa na sacola.
  guardar: LinhaGuardada;
}

export interface SacolaConferida {
  linhas: LinhaConferida[];
  // Só as linhas que vão no pedido.
  vao: LinhaConferida[];
  itens: number;
  totalCentavos: number;
  // Mistura pronta entrega e sob encomenda.
  mista: boolean;
  // Sob encomenda: a data mais tardia entre as linhas que vão.
  prontoEm: string | null;
  // Alguma linha mudou desde que a pessoa escolheu (faixa do topo).
  mudou: boolean;
  // Alguma linha de pronta entrega com quantidade que não é de hoje.
  estoqueNaoConfirmado: boolean;
}

function linhaQueNaoVai(l: LinhaGuardada, doce: Doce | null, motivo: Motivo | null, situacao: "nao_vai" | "escolher" = "nao_vai"): LinhaConferida {
  return {
    chave: chaveDaLinha(l.doceId, l.opcao),
    doceId: l.doceId,
    doce,
    nomeDoce: doce?.nome ?? l.nomeDoce,
    opcao: l.opcao,
    situacao,
    motivo,
    quantidade: l.quantidade,
    precoCentavos: doce ? precoDaOpcao(doce, l.opcao) : l.precoVisto,
    subtotalCentavos: 0,
    precoAntes: null,
    cortada: false,
    bloco: doce?.sobEncomenda ? "encomenda" : "pronta",
    ateFimDaCampanha: null,
    guardar: l,
  };
}

// Confere cada linha com o cardápio atual (preço, nome, opções, estoque, prazo e vitrine).
// Cada linha "vai" (entra no pedido), "nao_vai" (com o motivo) ou "escolher" (o doce
// ganhou opções e a linha não tem nenhuma). Nada aqui grava: a tela grava os valores
// conferidos (guardar) quando a pessoa mexe na sacola.
export function conferirSacola(
  sacola: SacolaGuardada,
  doces: Doce[],
  campanhas: Campanha[],
  hoje: string,
  horarios: Horarios,
): SacolaConferida {
  const ordem = new Map(doces.map((d, i) => [d.id, i]));
  const porDoce = new Map<string, LinhaGuardada[]>();
  for (const l of sacola.linhas) porDoce.set(l.doceId, [...(porDoce.get(l.doceId) ?? []), l]);

  const linhas: LinhaConferida[] = [];
  const fimDaCampanha = new Map<string, string>();
  for (const [doceId, guardadas] of porDoce) {
    const doce = doces.find((d) => d.id === doceId) ?? null;
    const situacao = doce ? situacaoDoDoce(doce, campanhas, hoje, horarios) : null;
    if (!doce || !situacao || situacao.bloqueio === "saiu_da_vitrine") {
      linhas.push(...guardadas.map((l) => linhaQueNaoVai(l, null, "saiu_da_vitrine")));
      continue;
    }

    // Junta as linhas que caem na mesma opção do cardápio. Doce que passou a ter 0 ou 1
    // opção junta tudo numa linha só; doce que passou a ter opções pede para escolher.
    const candidatas: LinhaGuardada[] = [];
    for (const l of guardadas) {
      let opcao: string | null = null;
      if (temOpcoes(doce)) {
        if (l.opcao === null) {
          linhas.push(linhaQueNaoVai(l, doce, null, "escolher"));
          continue;
        }
        const sabor = saborDaOpcao(doce, l.opcao);
        if (!sabor) {
          linhas.push(linhaQueNaoVai(l, doce, "opcao_saiu"));
          continue;
        }
        opcao = sabor.nome;
      }
      const junto = candidatas.find((c) => mesmaOpcao(c.opcao, opcao));
      if (junto) {
        junto.quantidade += l.quantidade;
        junto.adicionadaEm = Math.max(junto.adicionadaEm, l.adicionadaEm);
        if (junto.precoVisto === precoDaOpcao(doce, opcao)) junto.precoVisto = l.precoVisto;
      } else {
        candidatas.push({ ...l, opcao, nomeDoce: doce.nome });
      }
    }

    if (situacao.bloqueio) {
      linhas.push(...candidatas.map((l) => linhaQueNaoVai(l, doce, situacao.bloqueio)));
      continue;
    }

    // Corte pelo limite: tira unidades das linhas adicionadas por último (no empate, da
    // última da lista).
    const quantidades = new Map(candidatas.map((c) => [c, c.quantidade]));
    let sobra = candidatas.reduce((t, c) => t + c.quantidade, 0) - limiteDoDoce(doce, hoje);
    const porUltima = candidatas.map((c, i) => ({ c, i })).sort((a, b) => b.c.adicionadaEm - a.c.adicionadaEm || b.i - a.i);
    for (const { c } of porUltima) {
      if (sobra <= 0) break;
      const tirar = Math.min(c.quantidade, sobra);
      quantidades.set(c, c.quantidade - tirar);
      sobra -= tirar;
    }

    if (situacao.campanha && doce.sobEncomenda) fimDaCampanha.set(doce.id, situacao.campanha.fim);
    for (const c of candidatas) {
      const quantidade = quantidades.get(c)!;
      const cortada = quantidade < c.quantidade;
      if (quantidade === 0) {
        linhas.push({ ...linhaQueNaoVai(c, doce, "esgotou"), cortada });
        continue;
      }
      const preco = precoDaOpcao(doce, c.opcao);
      linhas.push({
        chave: chaveDaLinha(doce.id, c.opcao),
        doceId: doce.id,
        doce,
        nomeDoce: doce.nome,
        opcao: c.opcao,
        situacao: "vai",
        motivo: null,
        quantidade,
        precoCentavos: preco,
        subtotalCentavos: preco * quantidade,
        precoAntes: c.precoVisto !== preco ? c.precoVisto : null,
        cortada,
        bloco: doce.sobEncomenda ? "encomenda" : "pronta",
        ateFimDaCampanha: null,
        guardar: { ...c, quantidade },
      });
    }
  }

  // Ordem do cardápio (doce e depois a ordem das opções); doces que saíram, no fim.
  const posicao = (l: LinhaConferida) => {
    const i = ordem.get(l.doceId);
    const opcao = l.doce ? l.doce.sabores.findIndex((s) => mesmaOpcao(s.nome, l.opcao)) : -1;
    return [i ?? doces.length, opcao < 0 ? 999 : opcao, l.guardar.adicionadaEm];
  };
  linhas.sort((a, b) => {
    const [pa, pb] = [posicao(a), posicao(b)];
    return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
  });

  const vao = linhas.filter((l) => l.situacao === "vai");
  const datas = vao
    .filter((l) => l.bloco === "encomenda" && l.doce)
    .map((l) => prontoAPartirDe(l.doce!.prazoDias ?? 1, hoje, horarios))
    .sort();
  const prontoEm = datas.at(-1) ?? null;
  for (const l of vao) {
    const fim = fimDaCampanha.get(l.doceId);
    if (fim && prontoEm && prontoEm > fim) l.ateFimDaCampanha = fim;
  }
  return {
    linhas,
    vao,
    itens: vao.reduce((t, l) => t + l.quantidade, 0),
    totalCentavos: vao.reduce((t, l) => t + l.subtotalCentavos, 0),
    mista: vao.some((l) => l.bloco === "pronta") && vao.some((l) => l.bloco === "encomenda"),
    prontoEm,
    mudou: linhas.some((l) => l.situacao !== "vai" || l.precoAntes !== null || l.cortada),
    estoqueNaoConfirmado: vao.some((l) => l.bloco === "pronta" && l.doce && !contagemDeHoje(l.doce, hoje)),
  };
}

// Sacola a gravar depois de uma ação na tela: parte dos valores conferidos. mudar troca a
// linha tocada (null tira); a linha tocada passa a guardar o preço atual.
export function sacolaDepoisDe(
  sacola: SacolaGuardada,
  conferida: SacolaConferida,
  agora: number,
  chave?: string,
  quantidade?: number | null,
): SacolaGuardada {
  const linhas: LinhaGuardada[] = [];
  for (const l of conferida.linhas) {
    if (l.chave !== chave) {
      linhas.push(l.guardar);
    } else if (quantidade) {
      linhas.push({ ...l.guardar, quantidade, precoVisto: l.precoCentavos, nomeDoce: l.nomeDoce });
    }
  }
  return { v: 1, atualizadaEm: agora, numero: linhas.length > 0 ? sacola.numero : null, linhas };
}

// --- Recibo ---

// Tira * _ ~ ` (negrito e outros estilos do WhatsApp) e quebras de linha dos nomes, para
// não estragar o recibo nem simular uma linha de "Total".
export function escaparWhatsApp(nome: string): string {
  return nome.replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
}

// Nome de quem compra: sem estilos do WhatsApp, espaços juntados e até 40 letras.
export function limparNome(nome: string): string {
  return escaparWhatsApp(nome).slice(0, 40).trim();
}

export function textoItens(n: number): string {
  return `${n} ${n === 1 ? "item" : "itens"}`;
}

// Linhas de um bloco do recibo, agrupadas por doce.
function itensDoRecibo(linhas: LinhaConferida[]): string[] {
  const saida: string[] = [];
  const grupos = new Map<string, LinhaConferida[]>();
  for (const l of linhas) grupos.set(l.doceId, [...(grupos.get(l.doceId) ?? []), l]);
  for (const grupo of grupos.values()) {
    const doce = escaparWhatsApp(grupo[0].nomeDoce);
    if (grupo.length > 1) {
      saida.push(`• ${grupo.reduce((t, l) => t + l.quantidade, 0)}x ${doce}`);
      for (const l of grupo) saida.push(`  – ${l.quantidade}x ${escaparWhatsApp(l.opcao ?? "")}: ${formatarPreco(l.subtotalCentavos)}`);
    } else {
      const l = grupo[0];
      const opcao = l.opcao && l.doce && temOpcoes(l.doce) ? ` (${escaparWhatsApp(l.opcao)})` : "";
      saida.push(`• ${l.quantidade}x ${doce}${opcao}: ${formatarPreco(l.subtotalCentavos)}`);
    }
  }
  return saida;
}

// O recibo que vai no WhatsApp, montado exatamente como a sacola mostra. Só as linhas que
// vão; sem emoji, sem link, sem data de envio e sem preço unitário.
export function mensagemDoPedido(conferida: SacolaConferida, numero: number, nome: string): string {
  const quem = limparNome(nome);
  const linhas = [`Olá, ${LOJA.nome}! Quero fazer este pedido:`, "", `*Pedido nº ${numero}*`];
  if (quem) linhas.push(`Nome: ${quem}`);
  linhas.push("");
  const pronta = conferida.vao.filter((l) => l.bloco === "pronta");
  const encomenda = conferida.vao.filter((l) => l.bloco === "encomenda");
  if (conferida.mista && conferida.prontoEm) {
    linhas.push("*Pronta entrega*", ...itensDoRecibo(pronta), "");
    linhas.push(`*Sob encomenda* · pronto a partir de ${rotuloData(conferida.prontoEm)}`, ...itensDoRecibo(encomenda));
  } else {
    linhas.push(...itensDoRecibo(conferida.vao));
  }
  linhas.push("", `*Total dos doces: ${formatarPreco(conferida.totalCentavos)}* (${textoItens(conferida.itens)})`);
  if (encomenda.length > 0 && pronta.length === 0 && conferida.prontoEm) {
    linhas.push(`Sob encomenda: pronto a partir de ${rotuloData(conferida.prontoEm)}.`);
  }
  linhas.push("", "Aguardo a confirmação para combinar retirada ou entrega, dia, horário e pagamento.");
  return linhas.join("\n");
}

function emNomeDe(nome: string): string {
  const quem = limparNome(nome);
  return quem ? `, em nome de ${quem}` : "";
}

// Botões da tela de enviado: abrem a conversa com a mensagem pronta e o número.
export function mensagemMudar(numero: number, nome: string): string {
  return `Olá, ${LOJA.nome}! Quero mudar o pedido nº ${numero}${emNomeDe(nome)}: `;
}

export function mensagemCancelar(numero: number, nome: string): string {
  return `Olá, ${LOJA.nome}! Quero cancelar o pedido nº ${numero}${emNomeDe(nome)}.`;
}

// O que fica guardado no celular depois do toque em Enviar.
export function ultimoPedido(conferida: SacolaConferida, numero: number, nome: string, agora: number): UltimoPedido {
  return {
    numero,
    enviadoEm: agora,
    nome: limparNome(nome),
    linhas: conferida.vao.map((l) => ({
      doceId: l.doceId,
      nomeDoce: l.nomeDoce,
      opcao: l.doce && temOpcoes(l.doce) ? l.opcao : null,
      quantidade: l.quantidade,
      subtotalCentavos: l.subtotalCentavos,
    })),
    totalCentavos: conferida.totalCentavos,
    itens: conferida.itens,
    mensagem: mensagemDoPedido(conferida, numero, nome),
  };
}

// "Não enviou? Colocar os doces de volta na sacola": mesmas linhas e mesmo número.
export function sacolaDoPedido(pedido: UltimoPedido, agora: number): SacolaGuardada {
  return {
    v: 1,
    atualizadaEm: agora,
    numero: pedido.numero,
    linhas: pedido.linhas.map((l, i) => ({
      doceId: l.doceId,
      opcao: l.opcao,
      quantidade: l.quantidade,
      precoVisto: Math.round(l.subtotalCentavos / l.quantidade),
      nomeDoce: l.nomeDoce,
      adicionadaEm: agora + i,
    })),
  };
}

// "hoje às 14:32", "ontem às 9:05" ou "em 10/11 às 18:40" (relógio do celular).
export function quandoFoiEnviado(enviadoEm: number, agora: number): string {
  const envio = new Date(enviadoEm);
  const hora = `${envio.getHours()}:${String(envio.getMinutes()).padStart(2, "0")}`;
  const dia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const ontem = new Date(agora);
  ontem.setDate(ontem.getDate() - 1);
  if (dia(envio) === dia(new Date(agora))) return `hoje às ${hora}`;
  if (dia(envio) === dia(ontem)) return `ontem às ${hora}`;
  return `em ${String(envio.getDate()).padStart(2, "0")}/${String(envio.getMonth() + 1).padStart(2, "0")} às ${hora}`;
}

// "Sua sacola de 03/11 foi esvaziada."
export function diaDoMes(momento: number): string {
  const d = new Date(momento);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
