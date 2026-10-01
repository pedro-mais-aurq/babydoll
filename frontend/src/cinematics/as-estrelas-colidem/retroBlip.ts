import type { Speaker } from "./content";

/**
 * Blip retrô local: Web Audio API crua, sem biblioteca. O AudioContext só nasce
 * dentro de um clique/toque (política de autoplay) e qualquer falha é silenciosa
 * — áudio é aprimoramento, nunca pré-requisito para a cinemática avançar.
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function resolveContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

  return candidate ?? null;
}

const TONE: Record<Speaker, number> = {
  // Diferença pequena e nada estridente: Pedro um pouco mais grave, Mabel mais aguda.
  pedro: 300,
  mabel: 420,
};

/** Toca um blip muito curto. Deve ser chamado de dentro de um gesto do usuário. */
export function playBlip(speaker: Speaker): void {
  try {
    const Ctor = resolveContextCtor();

    if (!Ctor) {
      return;
    }

    context ??= new Ctor();

    if (context.state === "suspended") {
      void context.resume();
    }

    const base = TONE[speaker];
    const now = context.currentTime;

    // Duas notinhas em sequência ("bli-p"), 70ms no total.
    [0, 0.055].forEach((offset, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(base * (index === 0 ? 1 : 1.18), now + offset);

      // Envelope rápido, volume baixo e sem clipping.
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.05, now + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.05);

      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.06);
    });
  } catch {
    // Sem áudio a cena continua exatamente igual.
  }
}
