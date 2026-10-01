/** Conteúdo narrativo de "As estrelas colidem". O texto é literal e não deve ser reescrito. */

export type Speaker = "pedro" | "mabel";

export type Beat =
  | { kind: "line"; speaker: Speaker; text: string }
  | { kind: "pause" }
  | { kind: "outro" };

export const SPEAKER_NAMES: Record<Speaker, string> = {
  pedro: "Pedro",
  mabel: "Mabel",
};

/**
 * Um clique = um beat. A pausa é um estado próprio (não é texto na tela) e o
 * último beat ("outro") é disparado pelo clique seguinte a "jurooo".
 */
export const beats: Beat[] = [
  { kind: "line", speaker: "pedro", text: "Oi" },
  { kind: "line", speaker: "mabel", text: "Oi" },
  { kind: "pause" },
  { kind: "line", speaker: "pedro", text: "Você gosta do Drummond?" },
  { kind: "line", speaker: "mabel", text: "Nem um pouco" },
  { kind: "line", speaker: "pedro", text: "Eu também não, aquele assediador filho da puta" },
  { kind: "line", speaker: "mabel", text: "jurooo" },
  { kind: "outro" },
];

export const OUTRO_INDEX = beats.length - 1;

export const FINAL_LINE = "Assim nós viramos amigos";

/**
 * Ecos de uma conversa que continuou: fragmentos coloquiais, sem fatos novos.
 */
export const FADE_FRAGMENTS = [
  { text: "jurooo", x: 18, y: 26, delay: 0 },
  { text: "pois é", x: 66, y: 38, delay: 700 },
  { text: "KKKKKK", x: 32, y: 58, delay: 1300 },
  { text: "exatamente", x: 61, y: 70, delay: 1900 },
  { text: "eu pensei a mesma coisa", x: 24, y: 80, delay: 2500 },
] as const;
