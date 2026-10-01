import type { Speaker } from "./content";

/**
 * Áudio local da cinemática: Web Audio API crua, sem biblioteca e sem asset.
 * O AudioContext é compartilhado entre os blips e a ambiência do pátio, nasce
 * suspenso e só é retomado dentro de um gesto do usuário (política de autoplay).
 * Qualquer falha é silenciosa — áudio é aprimoramento, nunca pré-requisito.
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let resuming = false;

function resolveContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

  return candidate ?? null;
}

function getContext(): AudioContext | null {
  const Ctor = resolveContextCtor();

  if (!Ctor) {
    return null;
  }

  context ??= new Ctor();

  return context;
}

/** Só retoma o contexto existente; não recria ambiência nem nós de áudio. */
export function resumeCinematicAudio(): void {
  if (!context || context.state !== "suspended" || resuming) {
    return;
  }

  try {
    resuming = true;
    void context.resume().catch(() => {
      // Outra interação pode tentar novamente; a narrativa permanece independente.
    }).finally(() => {
      resuming = false;
    });
  } catch {
    resuming = false;
  }
}

/* ---------------------------------- blips --------------------------------- */

const TONE: Record<Speaker, number> = {
  // Diferença pequena e nada estridente: Pedro mais grave, Mabel mais aguda.
  pedro: 300,
  mabel: 420,
};

/** "enter" abre a fala; "tick" acompanha o ritmo da digitação (mais discreto). */
export type BlipKind = "enter" | "tick";

export function playBlip(speaker: Speaker, kind: BlipKind = "enter"): void {
  try {
    const ctx = getContext();

    if (!ctx) {
      return;
    }

    const base = TONE[speaker];
    const now = ctx.currentTime;
    const isTick = kind === "tick";
    const peak = isTick ? 0.022 : 0.05;
    const offsets = isTick ? [0] : [0, 0.055];

    offsets.forEach((offset, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(base * (index === 0 ? 1 : 1.18), now + offset);

      // Envelope rápido, volume baixo e sem clipping.
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + (isTick ? 0.03 : 0.05));

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + (isTick ? 0.04 : 0.06));
    });
  } catch {
    // Sem áudio a cena continua exatamente igual.
  }
}

/* -------------------------------- ambiência -------------------------------- */

export interface Ambience {
  /** Silencia com fade e libera os nós. */
  stop: () => void;
}

/**
 * Ruído rosa filtrado com uma respiração lenta: o pátio ao fundo, bem baixinho.
 * Sem loop de trilha, sem melodia — só ar. Entra em fade e sai em fade.
 */
export function startPatioAmbience(): Ambience {
  let stopped = false;
  let cleanup: (() => void) | null = null;

  try {
    const ctx = getContext();

    if (!ctx) {
      return { stop: () => undefined };
    }

    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < data.length; i += 1) {
      // Ruído branco integrado = ruído avermelhado, parecido com vento distante.
      last = (last + (Math.random() * 2 - 1) * 0.04) * 0.985;
      data[i] = last;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 820;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 110;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 2.6);

    // Respiração lenta, pra não soar como um chiado estático.
    const breath = ctx.createOscillator();
    const breathDepth = ctx.createGain();
    breath.frequency.value = 0.07;
    breathDepth.gain.value = 0.018;
    breath.connect(breathDepth);
    breathDepth.connect(gain.gain);

    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    breath.start();

    cleanup = () => {
      const end = ctx.currentTime;
      gain.gain.cancelScheduledValues(end);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), end);
      gain.gain.exponentialRampToValueAtTime(0.0001, end + 1.4);
      source.stop(end + 1.5);
      breath.stop(end + 1.5);
    };
  } catch {
    // Sem ambiência a cinemática segue igual.
  }

  return {
    stop: () => {
      if (stopped) {
        return;
      }

      stopped = true;

      try {
        cleanup?.();
      } catch {
        // Nada a fazer: o contexto já pode ter sido descartado.
      }
    },
  };
}
