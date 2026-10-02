import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SeteDeDezembro } from "../src/cinematics/sete-de-dezembro/SeteDeDezembro";
import { chat, CONTACT_NAME, FINAL_LINE } from "../src/cinematics/sete-de-dezembro/conversation";
import type { ChatEvent } from "../src/cinematics/sete-de-dezembro/conversation";
import {
  isTyping,
  mabelBurstStarts,
  clockSeconds,
  dayProgress,
  revealedCount,
  thresholds,
} from "../src/cinematics/sete-de-dezembro/pacing";

function indexOfText(text: string): number {
  return chat.findIndex((event) => event.kind === "text" && event.text === text);
}

const photoIndex = chat.findIndex((event) => event.kind === "photo");

describe("C3 — fonte canônica de 07/12/2025", () => {
  it("abre e fecha exatamente com as mensagens canônicas", () => {
    expect(chat[0]).toEqual({
      kind: "text",
      author: "pedro",
      time: "06:47:31",
      text: "Bom dia meu amooorrr",
    });
    expect(chat[chat.length - 1]).toEqual({
      kind: "text",
      author: "mabel",
      time: "22:52:55",
      text: "Você tbm é o amor da minha vida",
    });
  });

  it("mantém os horários em ordem crescente e sem texto inventado", () => {
    const times = chat
      .filter((event): event is Extract<ChatEvent, { kind: "text" }> => event.kind === "text")
      .map((event) => event.time);

    expect(times).toEqual([...times].sort());
    expect(chat.filter((event) => event.kind === "text")).toHaveLength(200);
  });

  it("posiciona a única fotografia entre 'Já cheguei' e 'Oiii meu amoorr'", () => {
    expect(chat.filter((event) => event.kind === "photo")).toHaveLength(1);
    expect(photoIndex).toBe(indexOfText("Já cheguei") + 1);
    expect(photoIndex + 1).toBe(indexOfText("Oiii meu amoorr"));
  });

  it("não inventa horário para a fotografia", () => {
    const photo = chat[photoIndex];

    expect(photo.kind).toBe("photo");
    expect(photo).not.toHaveProperty("time");
    expect(photo).not.toHaveProperty("text");
  });

  it("preserva a sequência 11:18 → 11:22 → foto → 21:10 → 21:10", () => {
    const window = chat.slice(indexOfText("Tá chegando???"), indexOfText("Cheguei vius") + 1);

    expect(window).toEqual([
      { kind: "text", author: "mabel", time: "11:18:37", text: "Tá chegando???" },
      { kind: "text", author: "pedro", time: "11:22:48", text: "Já cheguei" },
      { kind: "photo", author: "pedro" },
      { kind: "text", author: "pedro", time: "21:10:10", text: "Oiii meu amoorr" },
      { kind: "text", author: "pedro", time: "21:10:12", text: "Cheguei vius" },
    ]);
  });
});

describe("C3 — ritmo do scroll", () => {
  it("revela um evento por vez, em ordem, sem valores inválidos", () => {
    expect(revealedCount(0)).toBe(1);
    expect(revealedCount(-5)).toBe(1);

    let previous = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const count = revealedCount(p);
      expect(count).toBeGreaterThanOrEqual(previous);
      expect(count).toBeLessThanOrEqual(chat.length);
      previous = count;
    }

    expect(revealedCount(1)).toBe(chat.length);
  });

  it("gasta bem mais scroll no intervalo presencial que numa rajada de mensagens", () => {
    const beforePhoto = thresholds[photoIndex] - thresholds[photoIndex - 1];
    const afterPhoto = thresholds[photoIndex + 1] - thresholds[photoIndex];

    // Rajada típica: mensagens separadas por poucos segundos.
    const burst = thresholds[5] - thresholds[4];

    expect(beforePhoto).toBeGreaterThan(burst * 15);
    expect(afterPhoto).toBeGreaterThan(burst * 15);
    // O intervalo todo pesa uma fatia significativa do percurso.
    expect(beforePhoto + afterPhoto).toBeGreaterThan(0.1);
  });

  it("faz a luz do dia avançar da manhã até a noite, atravessando o intervalo", () => {
    expect(dayProgress(0)).toBe(0);
    expect(dayProgress(1)).toBeCloseTo(1, 5);

    const atPhoto = thresholds[photoIndex] + (thresholds[photoIndex + 1] - thresholds[photoIndex]) / 2;
    const noon = clockSeconds(thresholds[photoIndex - 1]);
    const duringPresence = clockSeconds(atPhoto);

    expect(noon).toBeLessThan(duringPresence);
    expect(duringPresence).toBeLessThan(clockSeconds(thresholds[photoIndex + 1]));
  });
});

describe("C3 — interface do WhatsApp", () => {
  it("monta o header padrão com o nome do contato e começa pelo início do dia", () => {
    render(<SeteDeDezembro onComplete={vi.fn()} />);

    expect(screen.getByTestId("sete-de-dezembro-contact").textContent).toBe(CONTACT_NAME);
    expect(screen.getByTestId("sete-de-dezembro-date").textContent).toBe("7 de dezembro de 2025");

    const messages = screen.getAllByTestId("sete-de-dezembro-message");
    expect(messages).toHaveLength(1);
    expect(messages[0].textContent).toContain("Bom dia meu amooorrr");
    // WhatsApp mostra hora e minuto, não os segundos da fonte canônica.
    expect(messages[0].textContent).toContain("06:47");
    expect(messages[0].dataset.author).toBe("pedro");
  });

  it("não mostra a fotografia antes do intervalo presencial", () => {
    render(<SeteDeDezembro onComplete={vi.fn()} />);

    expect(screen.queryByTestId("sete-de-dezembro-photo")).toBeNull();
    expect(screen.queryByTestId("sete-de-dezembro-typing")).toBeNull();
    expect(screen.queryByTestId("sete-de-dezembro-finale")).toBeNull();
  });
});

describe("C3 — 'digitando...'", () => {
  const burstIndex = mabelBurstStarts.findIndex(Boolean);

  it("anuncia só rajadas de 2+ mensagens da Mabel", () => {
    expect(burstIndex).toBeGreaterThan(0);

    const burst = chat[burstIndex];
    const next = chat[burstIndex + 1];

    expect(burst.kind === "text" && burst.author).toBe("mabel");
    expect(next.kind === "text" && next.author).toBe("mabel");
    expect(chat[burstIndex - 1].author).not.toBe("mabel");
  });

  it("aparece no fim do silêncio anterior e some quando a rajada entra", () => {
    const from = thresholds[burstIndex - 1];
    const to = thresholds[burstIndex];

    expect(isTyping(from + (to - from) * 0.1)).toBe(false);
    expect(isTyping(from + (to - from) * 0.85)).toBe(true);
    // Já revelada: quem falou não está mais digitando.
    expect(isTyping(to)).toBe(false);
  });

  it("nunca anuncia uma mensagem do Pedro", () => {
    chat.forEach((event, index) => {
      if (mabelBurstStarts[index]) {
        expect(event.kind === "text" && event.author).toBe("mabel");
      }
    });

    const photoIndexLocal = chat.findIndex((event) => event.kind === "photo");
    expect(mabelBurstStarts[photoIndexLocal]).toBe(false);
    expect(mabelBurstStarts[photoIndexLocal + 1]).toBe(false);
  });
});

// Geometria local explícita: jsdom não calcula altura nem posição de scroll.
function scrollToPosition(position: number) {
  const root = screen.getByTestId("sete-de-dezembro-cinematic");
  Object.defineProperty(root, "offsetHeight", { value: 10800, configurable: true });
  vi.spyOn(root, "getBoundingClientRect").mockImplementation(() => ({ top: -window.scrollY }) as DOMRect);
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("scrollY", position);
  fireEvent.scroll(window);
  act(() => vi.advanceTimersToNextFrame());
}

const scrollKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "];
function expectKeyboardBlocked(blocked: boolean) {
  for (const key of scrollKeys) {
    expect(fireEvent.keyDown(window, { key })).toBe(!blocked);
  }
}

describe("C3 — fotografia e encerramento", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("scrollY", 0);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/");
  });

  it("bloqueia scroll na fotografia e libera ao fechar pela barra ou Escape", () => {
    render(<SeteDeDezembro onComplete={vi.fn()} />);
    scrollToPosition(Math.ceil(thresholds[photoIndex] * 10000));
    const trigger = screen.getByTestId("sete-de-dezembro-photo");
    expectKeyboardBlocked(false);
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog").textContent).toContain(CONTACT_NAME);
    expectKeyboardBlocked(true);
    expect(fireEvent.wheel(window)).toBe(false);
    expect(fireEvent.touchMove(window)).toBe(false);
    fireEvent.click(screen.getByTestId("sete-de-dezembro-lightbox-close"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expectKeyboardBlocked(false);
    fireEvent.click(trigger);
    expect(fireEvent.keyDown(window, { key: "Escape" })).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("sete-de-dezembro-photo")).toBe(trigger);
    expectKeyboardBlocked(false);
  });

  it("tolera 8 px restantes, mantém a frase, faz fade e completa uma única vez", () => {
    const onComplete = vi.fn();
    render(<SeteDeDezembro onComplete={onComplete} />);
    scrollToPosition(9980);
    expect(screen.queryByTestId("sete-de-dezembro-finale")).toBeNull();
    scrollToPosition(9992);
    const finale = screen.getByTestId("sete-de-dezembro-finale");
    expect(finale.textContent).toBe(FINAL_LINE);
    expect(finale.dataset.state).toBe("in");
    expectKeyboardBlocked(true);
    act(() => vi.advanceTimersByTime(3399));
    expect(finale.dataset.state).toBe("in");
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(finale.dataset.state).toBe("out");
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1299));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onComplete).toHaveBeenCalledTimes(1);
    fireEvent.scroll(window);
    fireEvent.resize(window);
    act(() => vi.advanceTimersByTime(10000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("retorna ao coração em /moments pelo roteamento real, sob StrictMode", () => {
    window.history.replaceState({}, "", "/moments/sete-de-dezembro");
    render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
    scrollToPosition(9994);
    expect(screen.getByTestId("sete-de-dezembro-finale").dataset.state).toBe("in");
    act(() => vi.advanceTimersByTime(3400));
    expect(screen.getByTestId("sete-de-dezembro-finale").dataset.state).toBe("out");
    expect(window.location.pathname).toBe("/moments/sete-de-dezembro");
    act(() => vi.advanceTimersByTime(1300));
    expect(window.location.pathname).toBe("/moments");
    expect(screen.getByText("nossos momentos")).toBeTruthy();
    expect(screen.queryByTestId("sete-de-dezembro-cinematic")).toBeNull();
    expectKeyboardBlocked(false);
  });

  it.each(["in", "out"])("cancela o retorno se desmontar durante %s", (phase) => {
    const onComplete = vi.fn();
    const { unmount } = render(<SeteDeDezembro onComplete={onComplete} />);
    scrollToPosition(10000);
    if (phase === "out") act(() => vi.advanceTimersByTime(3400));
    unmount();
    act(() => vi.advanceTimersByTime(10000));
    expect(onComplete).not.toHaveBeenCalled();
    expectKeyboardBlocked(false);
  });
});
