import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import patio from "./assets/patio.webp";
import pedroImage from "./assets/pedro.png";
import mabelImage from "./assets/mabel.png";
import { beats, FADE_FRAGMENTS, FINAL_LINE, OUTRO_INDEX, SPEAKER_NAMES } from "./content";
import type { Speaker } from "./content";
import { playBlip } from "./retroBlip";
import styles from "./styles.module.css";

/**
 * "As estrelas colidem".
 *
 * Dois mecanismos, nada global: o scroll alimenta a aproximação de Pedro
 * (`--p`) e, depois do encontro, só clique/toque movimenta `step`.
 */

type Phase = "approach" | "dialogue" | "outro";

interface AsEstrelasColidemProps {
  onComplete: () => void;
  /** Injetável só para teste: o padrão é o blip retrô local. */
  playSound?: (speaker: Speaker) => void;
}

const ARRIVAL_THRESHOLD = 0.995;
const CLICK_GUARD_MS = 320;
const SETTLE_MS = 900;
const PAUSE_SILENCE_MS = 1150;
const TRANSITION_MS = 260;
const FRAGMENTS_MS = 4200;
const FINALE_HOLD_MS = 3400;
const FINALE_FADE_MS = 1600;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

export function AsEstrelasColidem({
  onComplete,
  playSound = playBlip,
}: AsEstrelasColidemProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("approach");
  const [step, setStep] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [finaleVisible, setFinaleVisible] = useState(false);
  const guardRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  // Abertura: o cenário existe praticamente sozinho antes dos personagens.
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => setRevealed(true), 1100);

    return () => window.clearTimeout(timer);
  }, []);

  // Fase A — a posição de Pedro é o progresso do scroll, escrito direto em CSS vars.
  useEffect(() => {
    const root = rootRef.current;

    if (!root || phase !== "approach") {
      return undefined;
    }

    let frame = 0;

    const apply = (raw: number) => {
      const progress = clamp01(raw);
      const eased = smoothstep(progress);

      root.style.setProperty("--p", eased.toFixed(4));
      root.style.setProperty(
        "--bob",
        (Math.sin(eased * Math.PI * 8) * 5 * (progress < 1 ? 1 : 0)).toFixed(2),
      );
      root.style.setProperty(
        "--tilt",
        (Math.sin(eased * Math.PI * 8) * 1.2 * (progress < 1 ? 1 : 0)).toFixed(2),
      );
      root.dataset.progress = progress.toFixed(3);

      if (progress >= ARRIVAL_THRESHOLD) {
        root.style.setProperty("--p", "1");
        root.style.setProperty("--bob", "0");
        root.style.setProperty("--tilt", "0");
        setPhase("dialogue");
      }
    };

    const update = () => {
      frame = 0;
      const top = window.scrollY + root.getBoundingClientRect().top;
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);

      apply((window.scrollY - top) / travel);
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Sem movimento: a aproximação já está feita e o diálogo assume.
      apply(1);
      return undefined;
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [phase]);

  // Fase B — scroll não avança fala nenhuma: a página fica travada no encontro.
  useEffect(() => {
    if (phase === "approach") {
      return undefined;
    }

    const block = (event: Event) => event.preventDefault();
    const blockKeys = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);

    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };
  }, [phase]);

  const advance = useCallback(() => {
    if (busyRef.current || step >= OUTRO_INDEX) {
      return;
    }

    const next = step + 1;
    const beat = beats[next];

    busyRef.current = true;
    guardRef.current = window.setTimeout(() => {
      busyRef.current = false;
    }, CLICK_GUARD_MS);

    // O som nasce do próprio gesto do usuário (política de autoplay) e nunca na pausa.
    if (beat.kind === "line") {
      try {
        playSound(beat.speaker);
      } catch {
        // Áudio é aprimoramento: falhar não pode travar a narrativa.
      }
    }

    setStep(next);

    if (beat.kind === "outro") {
      setPhase("outro");
    }
  }, [playSound, step]);

  useEffect(() => {
    return () => {
      if (guardRef.current !== null) {
        window.clearTimeout(guardRef.current);
      }
    };
  }, []);

  // Teclado como alternativa acessível ao clique/toque.
  useEffect(() => {
    if (phase !== "dialogue") {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (target && /^(input|textarea|button|a|select)$/i.test(target.tagName)) {
        return;
      }

      advance();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, phase]);

  // O indicador se esconde durante transições e durante o silêncio da pausa.
  useEffect(() => {
    if (phase !== "dialogue") {
      setIndicatorReady(false);
      return undefined;
    }

    const beat = step >= 0 ? beats[step] : undefined;
    const delay =
      step < 0 ? SETTLE_MS : beat?.kind === "pause" ? PAUSE_SILENCE_MS : TRANSITION_MS;

    setIndicatorReady(false);
    const timer = window.setTimeout(() => setIndicatorReady(true), delay);

    return () => window.clearTimeout(timer);
  }, [phase, step]);

  // Encerramento: sem mais cliques, a cena termina sozinha.
  useEffect(() => {
    if (phase !== "outro") {
      return undefined;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reduced ? 0.35 : 1;
    const timers = [
      window.setTimeout(() => setFading(true), 140),
      window.setTimeout(() => setFinaleVisible(true), FRAGMENTS_MS * scale),
      window.setTimeout(
        () => setFinaleVisible(false),
        (FRAGMENTS_MS + FINALE_HOLD_MS + FINALE_FADE_MS) * scale,
      ),
      window.setTimeout(
        onComplete,
        (FRAGMENTS_MS + FINALE_HOLD_MS + FINALE_FADE_MS * 2) * scale,
      ),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onComplete, phase]);

  const currentBeat = step >= 0 ? beats[step] : undefined;
  const line = currentBeat?.kind === "line" ? currentBeat : undefined;
  const isInteractive = phase === "dialogue";

  return (
    <article
      ref={rootRef}
      className={styles.cinematic}
      data-phase={phase}
      data-progress="0"
      data-testid="stars-collide-cinematic"
      aria-label="As estrelas colidem"
    >
      <h1 className={styles.srOnly}>As estrelas colidem</h1>

      <div
        className={styles.scene}
        data-revealed={revealed}
        data-fading={fading}
        data-interactive={isInteractive}
        data-testid="stars-collide-scene"
        onClick={isInteractive ? advance : undefined}
      >
        <img
          className={styles.backdrop}
          src={patio}
          alt="O pátio da escola numa tarde quente, vazio"
          draggable="false"
        />

        <img
          className={`${styles.character} ${styles.mabel}`}
          src={mabelImage}
          alt="Mabel parada perto do corredor, olhando para baixo"
          data-testid="stars-collide-mabel"
          draggable="false"
        />

        <img
          className={`${styles.character} ${styles.pedro}`}
          src={pedroImage}
          alt="Pedro atravessando o pátio"
          data-testid="stars-collide-pedro"
          draggable="false"
        />

        {/* Primeiro plano feito da própria fotografia: esconde os recortes dos PNGs. */}
        <div className={styles.foreground} aria-hidden="true">
          <div className={styles.foregroundClip}>
            <div className={styles.foregroundPhoto} />
          </div>
          <div className={styles.foregroundRim} />
          <div className={styles.foregroundCanopy} />
        </div>

        <div className={styles.vignette} aria-hidden="true" />

        <div aria-live="polite" className={styles.srOnly}>
          {line ? `${SPEAKER_NAMES[line.speaker]}: ${line.text}` : ""}
        </div>

        {line ? (
          <div
            key={step}
            className={`${styles.bubble} ${
              line.speaker === "pedro" ? styles.pedroBubble : styles.mabelBubble
            }`}
            data-speaker={line.speaker}
            data-testid="stars-collide-bubble"
          >
            <span className={styles.speaker}>{SPEAKER_NAMES[line.speaker]}</span>
            <p className={styles.line} data-testid="stars-collide-line">
              {line.text}
            </p>
          </div>
        ) : null}

        {phase === "approach" ? (
          <p className={styles.hint} data-testid="stars-collide-scroll-hint">
            role para baixo
          </p>
        ) : null}

        {isInteractive && indicatorReady && step < OUTRO_INDEX ? (
          <p className={styles.indicator} data-testid="stars-collide-continue-hint">
            clique para continuar
          </p>
        ) : null}

        {phase === "outro" ? (
          <div className={styles.fragments} aria-hidden="true">
            {FADE_FRAGMENTS.map((fragment) => (
              <span
                key={fragment.text}
                className={styles.fragment}
                style={
                  {
                    "--x": `${fragment.x}%`,
                    "--y": `${fragment.y}%`,
                    "--delay": `${fragment.delay}ms`,
                  } as CSSProperties
                }
              >
                {fragment.text}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {phase === "outro" ? (
        <div
          className={styles.finale}
          data-visible={finaleVisible}
          data-testid="stars-collide-finale"
        >
          <p className={styles.finaleLine}>{FINAL_LINE}</p>
        </div>
      ) : null}
    </article>
  );
}
