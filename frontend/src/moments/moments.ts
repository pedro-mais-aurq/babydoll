import { AsEstrelasColidem } from "../cinematics/as-estrelas-colidem/AsEstrelasColidem";
import starsCover from "../cinematics/as-estrelas-colidem/assets/patio.webp";
import { TodayCinematic } from "../cinematics/today/TodayCinematic";
import dayFiveCover from "../cinematics/today/assets/day-five-01.png";
import type { Moment } from "./types";

/**
 * Ordem narrativa, não ordem de implementação: "As estrelas colidem" (a amizade)
 * acontece antes de "Quando nos entrelaçamos" (o relacionamento).
 * Os ids permanecem estáveis para não quebrar deep links e testes existentes.
 */
export const moments: Moment[] = [
  {
    id: "stars-collide",
    title: "As estrelas colidem",
    cover: starsCover,
    coverAlt: "O pátio da escola onde nós dois nos falamos pela primeira vez",
    cinematic: AsEstrelasColidem,
  },
  {
    id: "first-day-five",
    title: "Quando nos entrelaçamos",
    cover: dayFiveCover,
    coverAlt: "Nós dois sorrindo em uma escadaria",
    cinematic: TodayCinematic,
  },
];

export function findMoment(momentId: string): Moment | undefined {
  return moments.find((moment) => moment.id === momentId);
}
