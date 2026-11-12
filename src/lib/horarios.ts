// Horário de atendimento da loja e o "agora" no horário de Brasília (America/Sao_Paulo).
// Funções puras: dão o mesmo resultado no servidor e no navegador.

export interface Horario {
  // "09:00"
  abre: string;
  // "18:00" (sempre depois de abre)
  fecha: string;
}

// Um por dia da semana, de domingo (0) a sábado (6). null = fechado.
export type Horarios = (Horario | null)[];

export const SEM_HORARIO: Horarios = [null, null, null, null, null, null, null];

export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DIAS_CURTOS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
// A semana aparece de segunda a domingo.
export const ORDEM_DA_SEMANA = [1, 2, 3, 4, 5, 6, 0];

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function horaValida(hora: string): boolean {
  return HORA.test(hora);
}

// "09:00-18:00" (como fica no banco) → { abre, fecha }. Vazio ou inválido = fechado.
export function lerHorario(texto: unknown): Horario | null {
  const partes = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(String(texto ?? "").trim());
  if (!partes || !HORA.test(partes[1]) || !HORA.test(partes[2]) || partes[1] >= partes[2]) return null;
  return { abre: partes[1], fecha: partes[2] };
}

export function escreverHorario(horario: Horario | null): string {
  return horario ? `${horario.abre}-${horario.fecha}` : "";
}

// Sem nenhum dia com horário, a vitrine não mostra horário nem "Aberto agora".
export function temHorario(horarios: Horarios): boolean {
  return horarios.some(Boolean);
}

// "09:00" → "9h"; "09:30" → "9h30"
export function formatarHora(hora: string): string {
  const [h, m] = hora.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
}

function emMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export interface Agora {
  // AAAA-MM-DD
  data: string;
  // 0 = domingo
  diaDaSemana: number;
  // Minutos desde a meia-noite.
  minutos: number;
}

const FORMATO = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});
const SEMANA_EM_INGLES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function agoraNaLoja(momento: Date | number): Agora {
  const p = Object.fromEntries(FORMATO.formatToParts(momento).map((parte) => [parte.type, parte.value]));
  return {
    data: `${p.year}-${p.month}-${p.day}`,
    diaDaSemana: SEMANA_EM_INGLES.indexOf(p.weekday),
    minutos: (Number(p.hour) % 24) * 60 + Number(p.minute),
  };
}

// Data de hoje (AAAA-MM-DD) no horário de Brasília, a mesma do HOJE_SQL do banco.
export function hojeNaLoja(momento: Date | number = Date.now()): string {
  return agoraNaLoja(momento).data;
}

// O "agora" que o servidor passa para as telas: arredondado no minuto, para o
// navegador conferir o mesmo valor ao montar a página.
export function minutoAtual(momento: number = Date.now()): number {
  return Math.floor(momento / 60_000) * 60_000;
}

// "2026-11-15" → 0 (domingo)
export function diaDaSemana(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

// Sem horário cadastrado, todo dia conta como dia de atendimento.
export function abreNoDia(horarios: Horarios, iso: string): boolean {
  return !temHorario(horarios) || horarios[diaDaSemana(iso)] !== null;
}

export type SituacaoLoja =
  | { aberta: true; fecha: string; texto: string }
  | { aberta: false; emDias: number; diaDaSemana: number; abre: string; texto: string };

// "Aberto agora · até 18h" ou "Fechado · abre amanhã às 9h". null = sem horário cadastrado.
export function situacaoDaLoja(horarios: Horarios, momento: Date | number): SituacaoLoja | null {
  if (!temHorario(horarios)) return null;
  const agora = agoraNaLoja(momento);
  const deHoje = horarios[agora.diaDaSemana];
  if (deHoje && agora.minutos >= emMinutos(deHoje.abre) && agora.minutos < emMinutos(deHoje.fecha)) {
    return { aberta: true, fecha: deHoje.fecha, texto: `Aberto agora · até ${formatarHora(deHoje.fecha)}` };
  }
  // Próxima abertura: ainda hoje, nos próximos dias ou no mesmo dia da semana que vem.
  for (let dias = 0; dias <= 7; dias++) {
    const dia = (agora.diaDaSemana + dias) % 7;
    const horario = horarios[dia];
    if (!horario || (dias === 0 && agora.minutos >= emMinutos(horario.abre))) continue;
    const quando = dias === 0 ? "hoje" : dias === 1 ? "amanhã" : DIAS_CURTOS[dia];
    return {
      aberta: false,
      emDias: dias,
      diaDaSemana: dia,
      abre: horario.abre,
      texto: `Fechado · abre ${quando} às ${formatarHora(horario.abre)}`,
    };
  }
  return null;
}

// Rodapé da sacola com a loja fechada: "Fechado no momento · Abrimos terça às 9h" (ou
// "hoje às 14h", "amanhã às 9h"). O pedido pode ser enviado mesmo assim.
export function textoFechadoNaSacola(situacao: SituacaoLoja): string | null {
  if (situacao.aberta) return null;
  const quando = situacao.emDias === 0 ? "hoje" : situacao.emDias === 1 ? "amanhã" : DIAS[situacao.diaDaSemana].toLowerCase();
  return `Fechado no momento · Abrimos ${quando} às ${formatarHora(situacao.abre)}`;
}

// [1, 2, 3, 4, 5] → "seg. a sex."; [6, 0] → "sáb. e dom."; [1, 3, 5] → "seg., qua. e sex."
function nomesDosDias(dias: number[]): string {
  if (dias.length === 7) return "todos os dias";
  const posicoes = dias.map((d) => ORDEM_DA_SEMANA.indexOf(d));
  const itens: string[] = [];
  for (let i = 0; i < dias.length; ) {
    let j = i;
    while (j + 1 < dias.length && posicoes[j + 1] === posicoes[j] + 1) j++;
    if (j - i >= 2) itens.push(`${DIAS_CURTOS[dias[i]]} a ${DIAS_CURTOS[dias[j]]}`);
    else for (let k = i; k <= j; k++) itens.push(DIAS_CURTOS[dias[k]]);
    i = j + 1;
  }
  return itens.length === 1 ? itens[0] : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;
}

// "seg. a sex., 9h às 18h; sáb., 9h às 13h". null = sem horário cadastrado.
export function textoAtendimento(horarios: Horarios): string | null {
  if (!temHorario(horarios)) return null;
  const grupos = new Map<string, number[]>();
  for (const dia of ORDEM_DA_SEMANA) {
    const horario = horarios[dia];
    if (!horario) continue;
    const chave = escreverHorario(horario);
    grupos.set(chave, [...(grupos.get(chave) ?? []), dia]);
  }
  return [...grupos.entries()]
    .map(([chave, dias]) => {
      const { abre, fecha } = lerHorario(chave)!;
      return `${nomesDosDias(dias)}, ${formatarHora(abre)} às ${formatarHora(fecha)}`;
    })
    .join("; ");
}
