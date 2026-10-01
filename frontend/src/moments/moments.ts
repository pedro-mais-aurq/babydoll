import { AsEstrelasColidem } from "../cinematics/as-estrelas-colidem/AsEstrelasColidem";
import starsCover from "../cinematics/as-estrelas-colidem/assets/patio.webp";
import { TodayCinematic } from "../cinematics/today/TodayCinematic";
import dayFiveCover from "../cinematics/today/assets/day-five-01.png";
import { SeteDeDezembro } from "../cinematics/sete-de-dezembro/SeteDeDezembro";
import deDezembroCover from "../cinematics/sete-de-dezembro/assets/imagem-enviada.jpg";
import type { Moment } from "./types";

export { isMomentReady } from "./types";

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
  {
    id: "sete-de-dezembro",
    title: "Pela primeira vez",
    cover: deDezembroCover,
    coverAlt: "Nós dois abraçados junto ao muro de tijolos",
    cinematic: SeteDeDezembro,
  },
];

export function findMoment(momentId: string): Moment | undefined {
  return moments.find((moment) => moment.id === momentId);
}
