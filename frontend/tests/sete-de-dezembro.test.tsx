import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SeteDeDezembro } from "../src/cinematics/sete-de-dezembro/SeteDeDezembro";
import { chat, CONTACT_NAME } from "../src/cinematics/sete-de-dezembro/conversation";
import type { ChatEvent } from "../src/cinematics/sete-de-dezembro/conversation";
import {
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
  });
});
