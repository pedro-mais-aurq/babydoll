import type { ComponentType } from "react";

export interface CinematicProps {
  onComplete: () => void;
}

export interface Moment {
  id: string;
  title: string;
  cover: string;
  coverAlt: string;
  cinematic: ComponentType<CinematicProps>;
}
