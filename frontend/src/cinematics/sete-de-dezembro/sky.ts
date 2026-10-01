/** Luz do dia 07/12 traduzida em cor: só o plano de fundo da C3 muda, nunca o chat. */

interface SkyStop {
  at: number;
  top: string;
  bottom: string;
  dim: number;
}

/** Paradas em fração do dia conversado (06:47 → 22:52). */
const STOPS: SkyStop[] = [
  { at: 0, top: "43, 42, 74", bottom: "107, 74, 90", dim: 0.5 },
  { at: 0.18, top: "58, 90, 122", bottom: "159, 192, 216", dim: 0.3 },
  { at: 0.33, top: "90, 132, 168", bottom: "207, 227, 239", dim: 0.18 },
  { at: 0.64, top: "166, 100, 60", bottom: "240, 178, 122", dim: 0.26 },
  { at: 0.79, top: "70, 50, 92", bottom: "138, 90, 114", dim: 0.42 },
  { at: 1, top: "11, 22, 32", bottom: "27, 42, 56", dim: 0.68 },
];

function mix(a: string, b: string, t: number): string {
  const left = a.split(",").map(Number);
  const right = b.split(",").map(Number);

  return left.map((value, i) => Math.round(value + (right[i] - value) * t)).join(", ");
}

export interface Sky {
  top: string;
  bottom: string;
  dim: number;
}

export function skyAt(dayProgress: number): Sky {
  const clamped = Math.min(Math.max(dayProgress, 0), 1);

  for (let i = 1; i < STOPS.length; i += 1) {
    const previous = STOPS[i - 1];
    const next = STOPS[i];

    if (clamped <= next.at) {
      const span = next.at - previous.at;
      const t = span > 0 ? (clamped - previous.at) / span : 0;

      return {
        top: mix(previous.top, next.top, t),
        bottom: mix(previous.bottom, next.bottom, t),
        dim: previous.dim + (next.dim - previous.dim) * t,
      };
    }
  }

  const last = STOPS[STOPS.length - 1];

  return { top: last.top, bottom: last.bottom, dim: last.dim };
}
