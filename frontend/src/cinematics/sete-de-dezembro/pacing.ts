import { chat } from "./conversation";
import type { ChatEvent } from "./conversation";

/**
 * Ritmo da C3: o scroll não troca cenas, ele atravessa o tempo real da conversa.
 * Cada evento recebe um "peso" derivado do intervalo até o evento anterior, então
 * rajadas de mensagens passam rápido e silêncios longos custam scroll.
 */

function seconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);

  return h * 3600 + m * 60 + s;
}

/** Primeira e última mensagem com horário conhecido, para a passagem de luz do dia. */
const firstSeconds = seconds("06:47:31");
const lastSeconds = seconds("22:52:55");

/** Limites do intervalo presencial: entre essas duas mensagens eles estão juntos. */
export const PRESENCE_START = seconds("11:22:48");
export const PRESENCE_END = seconds("21:10:10");

/**
 * O intervalo presencial são quase dez horas. Ele recebe um peso deliberadamente
 * grande (antes e depois da fotografia) para não parecer só mais uma pausinha.
 */
const PRESENCE_WEIGHT = 58;
const BASE_WEIGHT = 1.15;
const MAX_GAP_WEIGHT = 13;

function gapWeight(delta: number): number {
  const soft = 5 * Math.min(1, Math.log1p(Math.max(delta, 0)) / Math.log1p(3600));
  const long = delta > 1800 ? 8 * Math.min(1, delta / 14400) : 0;

  return Math.min(soft + long, MAX_GAP_WEIGHT);
}

const weights: number[] = chat.map((event, index) => {
  if (index === 0) {
    return 0;
  }

  const previous = chat[index - 1];

  // A fotografia e o retorno às 21:10 são os dois trechos lentos do dia.
  if (event.kind === "photo" || previous.kind === "photo") {
    return PRESENCE_WEIGHT;
  }

  if (event.kind !== "text" || previous.kind !== "text") {
    return BASE_WEIGHT;
  }

  return BASE_WEIGHT + gapWeight(seconds(event.time) - seconds(previous.time));
});

const total = weights.reduce((sum, weight) => sum + weight, 0);

/** Fração do scroll que falta para o encerramento depois da última mensagem. */
const TAIL_SHARE = 0.055;

/** Progresso (0..1) em que cada evento entra na conversa. */
export const thresholds: number[] = (() => {
  let running = 0;

  return weights.map((weight) => {
    running += weight;

    return (running / total) * (1 - TAIL_SHARE);
  });
})();

export const REVEAL_END = 1 - TAIL_SHARE;

/** Quantos eventos já foram revelados para um dado progresso de scroll. */
export function revealedCount(progress: number): number {
  let count = 0;

  for (const threshold of thresholds) {
    if (progress >= threshold) {
      count += 1;
    } else {
      break;
    }
  }

  return Math.max(count, 1);
}

/**
 * Segundo do dia representado pelo último evento revelado. Durante o intervalo
 * presencial o valor é interpolado, então a luz do céu atravessa a tarde inteira
 * mesmo sem nenhuma mensagem acontecendo.
 */
export function clockSeconds(progress: number): number {
  const count = revealedCount(progress);
  const index = count - 1;
  const event: ChatEvent = chat[index];

  if (event.kind === "text") {
    return seconds(event.time);
  }

  // Fotografia: sem horário canônico, a luz avança proporcionalmente ao scroll.
  const from = thresholds[index - 1] ?? 0;
  const to = thresholds[index + 1] ?? REVEAL_END;
  const local = to > from ? Math.min(Math.max((progress - from) / (to - from), 0), 1) : 0;

  return PRESENCE_START + (PRESENCE_END - PRESENCE_START) * (0.25 + local * 0.5);
}

/** 0 = primeira mensagem do dia, 1 = última. */
export function dayProgress(progress: number): number {
  const value = (clockSeconds(progress) - firstSeconds) / (lastSeconds - firstSeconds);

  return Math.min(Math.max(value, 0), 1);
}
