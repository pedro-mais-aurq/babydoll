import type { ComponentType } from "react";

export interface CinematicProps {
  onComplete: () => void;
}

export interface Moment {
  id: string;
  title: string;
  cover: string;
  coverAlt: string;
  /** `null` = lembrança reservada na linha do tempo, ainda não gravada. */
  cinematic: ComponentType<CinematicProps> | null;
}

/** Um momento só é abrível quando a cinemática dele existe. */
export function isMomentReady(moment: Moment): boolean {
  return moment.cinematic !== null;
}
