import { useEffect, useRef, useState } from "react";

import background from "./assets/plano-de-fundo.jpg";
import avatar from "./assets/mabel-perfil.jpg";
import sentPhoto from "./assets/imagem-enviada.jpg";
import { chat, CONTACT_NAME, CONVERSATION_DATE, FINAL_LINE } from "./conversation";
import type { ChatEvent } from "./conversation";
import { dayProgress, isTyping, REVEAL_END, revealedCount } from "./pacing";
import { skyAt } from "./sky";
import styles from "./styles.module.css";

/**
 * C3 — a conversa de 07/12/2025.
 *
 * Responsabilidades separadas de propósito: o scroll, o ritmo, os silêncios e o
 * plano de fundo são a linguagem cinematográfica do Babydoll; a interface onde as
 * mensagens aparecem é o WhatsApp padrão e não é redesenhada.
 */

interface SeteDeDezembroProps {
  onComplete: () => void;
}

/** Quantas mensagens ficam montadas: o resto já saiu pela borda de cima. */
const WINDOW_SIZE = 26;

const FINALE_HOLD_MS = 3400;
const FINALE_FADE_MS = 1300;
const SCROLL_END_TOLERANCE_PX = 8;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

/** WhatsApp mostra hora e minuto; os segundos continuam na fonte canônica. */
function shortTime(time: string): string {
  return time.slice(0, 5);
}

function Ticks() {
  return (
    <svg className={styles.ticks} viewBox="0 0 16 11" aria-hidden="true">
      <path
        d="M1 6.2 3.3 8.6 8.1 2.6M6.5 6.2 8.8 8.6 14.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SeteDeDezembro({ onComplete }: SeteDeDezembroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(1);
  const [ending, setEnding] = useState(0);
  const [typing, setTyping] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [finale, setFinale] = useState<"idle" | "in" | "out">("idle");
  const doneRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    window.scrollTo(0, 0);
    let frame = 0;

    const update = () => {
      frame = 0;
      const top = window.scrollY + root.getBoundingClientRect().top;
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const progress = clamp01((window.scrollY - top) / travel);

      const sky = skyAt(dayProgress(progress));
      root.style.setProperty("--sky-top", sky.top);
      root.style.setProperty("--sky-bottom", sky.bottom);
      root.style.setProperty("--sky-dim", sky.dim.toFixed(3));
      root.dataset.progress = progress.toFixed(4);

      setCount(revealedCount(progress));
      setTyping(isTyping(progress));

      // Rabo final: depois da última mensagem a cena se despede sozinha.
      const tail = clamp01((progress - REVEAL_END) / (1 - REVEAL_END));
      setEnding(tail);
      root.style.setProperty("--ending", tail.toFixed(3));

      // No fim do fade a frase final entra sozinha e a cena se encerra.
      const remaining = travel - (window.scrollY - top);
      if ((tail >= 0.995 || (progress >= REVEAL_END && remaining <= SCROLL_END_TOLERANCE_PX)) && !doneRef.current) {
        doneRef.current = true;
        setFinale("in");
      }
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

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
  }, []);

  // Nem a fotografia aberta nem o encerramento devem ser atravessados por scroll.
  useEffect(() => {
    if (!photoOpen && finale === "idle") {
      return undefined;
    }

    const block = (event: Event) => event.preventDefault();
    const blockKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", blockKey);
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });

    return () => {
      window.removeEventListener("keydown", blockKey);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, [finale, photoOpen]);

  useEffect(() => {
    if (finale === "idle") {
      return undefined;
    }

    // Cada fase mantém apenas o seu timer: o cleanup de "in" não cancela a saída.
    const timer = window.setTimeout(() => {
      if (finale === "in") {
        setFinale("out");
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, finale === "in" ? FINALE_HOLD_MS : FINALE_FADE_MS);

    return () => window.clearTimeout(timer);
  }, [finale, onComplete]);

  // Esc fecha a fotografia, como qualquer visualizador.
  useEffect(() => {
    if (!photoOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPhotoOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photoOpen]);

  const start = Math.max(count - WINDOW_SIZE, 0);
  const visible: { event: ChatEvent; index: number }[] = [];

  for (let index = start; index < count; index += 1) {
    visible.push({ event: chat[index], index });
  }

  return (
    <article
      ref={rootRef}
      className={styles.cinematic}
      data-progress="0"
      data-testid="sete-de-dezembro-cinematic"
      aria-label="Pela primeira vez"
    >
      <h1 className={styles.srOnly}>Pela primeira vez</h1>

      <div className={styles.viewport}>
        {/* Plano de fundo próprio da cinemática: a luz do dia atravessa a conversa. */}
        <div className={styles.backdrop} aria-hidden="true">
          <img className={styles.backdropImage} src={background} alt="" draggable="false" />
          <div className={styles.sky} />
          <div className={styles.scrim} />
        </div>

        {/* Daqui para dentro é WhatsApp padrão. */}
        <div className={styles.phone} data-testid="sete-de-dezembro-chat">
          <header className={styles.chatHeader}>
            <svg className={styles.backArrow} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <img className={styles.avatar} src={avatar} alt="" draggable="false" />
            <span className={styles.contactBlock}>
              <span className={styles.contactName} data-testid="sete-de-dezembro-contact">
                {CONTACT_NAME}
              </span>
              {typing ? (
                <span className={styles.typing} data-testid="sete-de-dezembro-typing">
                  digitando...
                </span>
              ) : null}
            </span>
            <div className={styles.headerIcons} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M3 7.5h11v9H3zM14.5 11l5.5-3v8l-5.5-3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
              <svg viewBox="0 0 24 24">
                <path
                  d="M5 4.5h3.2l1.6 4-2 1.4a10.5 10.5 0 0 0 5.8 5.8l1.4-2 4 1.6V19a1 1 0 0 1-1.1 1A15.5 15.5 0 0 1 4 5.6 1 1 0 0 1 5 4.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="19" r="1.6" fill="currentColor" />
              </svg>
            </div>
          </header>

          <div className={styles.conversation}>
            <div className={styles.messages}>
              {start === 0 ? (
                <div className={styles.dateChip} data-testid="sete-de-dezembro-date">
                  {CONVERSATION_DATE}
                </div>
              ) : null}

              {visible.map(({ event, index }) => {
                const previous = index > 0 ? chat[index - 1] : undefined;
                const grouped = previous?.author === event.author;
                const side = event.author === "pedro" ? styles.out : styles.in;

                if (event.kind === "photo") {
                  return (
                    <div
                      key={index}
                      className={`${styles.row} ${side} ${grouped ? styles.grouped : ""}`}
                    >
                      <button
                        type="button"
                        className={`${styles.bubble} ${styles.mediaBubble} ${
                          grouped ? "" : styles.withTail
                        }`}
                        data-testid="sete-de-dezembro-photo"
                        onClick={() => setPhotoOpen(true)}
                        aria-label="Abrir a fotografia enviada"
                      >
                        <img
                          className={styles.media}
                          src={sentPhoto}
                          alt="Fotografia enviada na conversa: Pedro e Mabel juntos"
                          width={1200}
                          height={1600}
                          draggable="false"
                        />
                        <span className={styles.mediaMeta} aria-hidden="true">
                          <Ticks />
                        </span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`${styles.row} ${side} ${grouped ? styles.grouped : ""}`}
                  >
                    <div
                      className={`${styles.bubble} ${grouped ? "" : styles.withTail}`}
                      data-testid="sete-de-dezembro-message"
                      data-author={event.author}
                    >
                      <span className={styles.text}>{event.text}</span>
                      <span className={styles.meta}>
                        <span className={styles.time}>{shortTime(event.time)}</span>
                        {event.author === "pedro" ? <Ticks /> : null}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className={styles.composer} aria-hidden="true">
            <div className={styles.inputPill}>
              <svg viewBox="0 0 24 24" className={styles.composerIcon}>
                <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="9.3" cy="10" r="1.1" fill="currentColor" />
                <circle cx="14.7" cy="10" r="1.1" fill="currentColor" />
                <path
                  d="M8.6 14.4a4.3 4.3 0 0 0 6.8 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className={styles.placeholder}>Mensagem</span>
              <svg viewBox="0 0 24 24" className={styles.composerIcon}>
                <path
                  d="M17 9.5v5a5 5 0 0 1-10 0V8a3 3 0 0 1 6 0v6.2a1 1 0 0 1-2 0V9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <svg viewBox="0 0 24 24" className={styles.composerIcon}>
                <path
                  d="M12 15.5a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3zM6.8 12.3A5.2 5.2 0 0 0 12 17.5a5.2 5.2 0 0 0 5.2-5.2M12 17.5V20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </footer>
        </div>

        {ending > 0.02 ? <div className={styles.endVeil} aria-hidden="true" /> : null}

        {photoOpen ? (
          <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Fotografia enviada na conversa"
            data-testid="sete-de-dezembro-lightbox"
            onClick={() => setPhotoOpen(false)}
          >
            <header className={styles.lightboxBar}>
              <button
                type="button"
                className={styles.lightboxBack}
                data-testid="sete-de-dezembro-lightbox-close"
                aria-label="Voltar para a conversa"
                onClick={(event) => {
                  event.stopPropagation();
                  setPhotoOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M15 5l-7 7 7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className={styles.lightboxName}>{CONTACT_NAME}</span>
            </header>
            <img
              className={styles.lightboxImage}
              src={sentPhoto}
              alt="Fotografia enviada na conversa: Pedro e Mabel juntos"
              draggable="false"
            />
          </div>
        ) : null}

        {finale !== "idle" ? (
          <div
            className={styles.finale}
            data-state={finale}
            data-testid="sete-de-dezembro-finale"
          >
            <p className={styles.finaleLine}>{FINAL_LINE}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
