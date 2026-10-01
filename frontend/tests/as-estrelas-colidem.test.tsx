import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsEstrelasColidem } from "../src/cinematics/as-estrelas-colidem/AsEstrelasColidem";
import { FINAL_LINE } from "../src/cinematics/as-estrelas-colidem/content";
import { motionPreference } from "./setup";

const CLICK_GUARD_MS = 340;

function wait(ms: number) {
  return act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
}

/** Avança um beat respeitando a trava anti-clique-duplo. */
async function click(scene: HTMLElement) {
  fireEvent.click(scene);
  await wait(CLICK_GUARD_MS);
}

function renderArrived(playSound = vi.fn()) {
  // reduced-motion entrega a cena já estabilizada no encontro.
  motionPreference.reduceMotion = true;
  render(<AsEstrelasColidem onComplete={vi.fn()} playSound={playSound} />);

  return { scene: screen.getByTestId("stars-collide-scene"), playSound };
}

describe("As estrelas colidem — aproximação por scroll", () => {
  it("o scroll controla a aproximação até o encontro, sem valores inválidos", async () => {
    render(<AsEstrelasColidem onComplete={vi.fn()} playSound={vi.fn()} />);

    const root = screen.getByTestId("stars-collide-cinematic");
    Object.defineProperty(root, "offsetHeight", { value: 3400, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    // Meio do caminho: Pedro está atravessando o cenário.
    root.getBoundingClientRect = () => ({ top: -1300 }) as DOMRect;
    Object.defineProperty(window, "scrollY", { value: 1300, configurable: true });
    fireEvent.scroll(window);

    await waitFor(() => {
      const progress = Number(root.dataset.progress);
      expect(progress).toBeGreaterThan(0.4);
      expect(progress).toBeLessThan(0.6);
    });
    expect(root.dataset.phase).toBe("approach");
    expect(screen.getByTestId("stars-collide-scroll-hint")).toBeTruthy();

    // Fim do curso: Pedro chega até Mabel e a interação muda.
    root.getBoundingClientRect = () => ({ top: -2600 }) as DOMRect;
    Object.defineProperty(window, "scrollY", { value: 2600, configurable: true });
    fireEvent.scroll(window);

    await waitFor(() => expect(root.dataset.phase).toBe("dialogue"));
    expect(Number(root.dataset.progress)).toBeLessThanOrEqual(1);
    expect(Number(root.dataset.progress)).toBeGreaterThanOrEqual(0);
    expect(screen.queryByTestId("stars-collide-scroll-hint")).toBeNull();
  });

  it("nenhuma fala aparece antes do encontro", () => {
    render(<AsEstrelasColidem onComplete={vi.fn()} playSound={vi.fn()} />);

    expect(screen.queryByTestId("stars-collide-line")).toBeNull();
  });
});

describe("As estrelas colidem — diálogo por clique", () => {
  it("o primeiro clique revela apenas a primeira fala", async () => {
    const { scene } = renderArrived();

    expect(screen.queryByTestId("stars-collide-line")).toBeNull();
    await click(scene);

    const lines = screen.getAllByTestId("stars-collide-line");
    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toBe("Oi");
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("pedro");
  });

  it("cada clique avança exatamente um estado, com pausa própria e encerramento", async () => {
    const playSound = vi.fn();
    const { scene } = renderArrived(playSound);

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("pedro");

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("mabel");

    // Pausa: nenhuma fala na tela e nenhum texto "*Pausa*".
    await click(scene);
    expect(screen.queryByTestId("stars-collide-line")).toBeNull();
    expect(screen.queryByText(/pausa/i)).toBeNull();
    const soundsBeforePause = playSound.mock.calls.length;

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe(
      "Você gosta do Drummond?",
    );
    // A pausa não pediu som; a fala seguinte pediu.
    expect(playSound.mock.calls.length).toBe(soundsBeforePause + 1);

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Nem um pouco");

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe(
      "Eu também não, aquele assediador filho da puta",
    );

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe("jurooo");
    expect(screen.queryByTestId("stars-collide-finale")).toBeNull();

    // O clique posterior a "jurooo" inicia o encerramento.
    await click(scene);
    expect(screen.getByTestId("stars-collide-finale")).toBeTruthy();
    expect(screen.getByText(FINAL_LINE)).toBeTruthy();
    expect(screen.queryByTestId("stars-collide-continue-hint")).toBeNull();

    // Cada fala emitiu um único blip, com variação por personagem.
    expect(playSound.mock.calls.map(([speaker]) => speaker)).toEqual([
      "pedro",
      "mabel",
      "pedro",
      "mabel",
      "pedro",
      "mabel",
    ]);
  });

  it("scroll não avança o diálogo", async () => {
    const { scene } = renderArrived();

    await click(scene);
    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");

    Object.defineProperty(window, "scrollY", { value: 9999, configurable: true });
    fireEvent.scroll(window);
    fireEvent.wheel(window, { deltaY: 600 });
    await wait(80);

    expect(screen.getAllByTestId("stars-collide-line")).toHaveLength(1);
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("pedro");
  });

  it("cliques rápidos não pulam falas", async () => {
    const { scene } = renderArrived();

    fireEvent.click(scene);
    fireEvent.click(scene);
    fireEvent.click(scene);
    await wait(40);

    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("pedro");
  });

  it("o teclado é alternativa equivalente ao clique", async () => {
    renderArrived();

    fireEvent.keyDown(window, { key: "Enter" });
    await wait(40);

    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");
  });

  it("falha do áudio não interrompe a progressão", async () => {
    const playSound = vi.fn(() => {
      throw new Error("sem AudioContext");
    });
    motionPreference.reduceMotion = true;
    render(<AsEstrelasColidem onComplete={vi.fn()} playSound={playSound} />);
    const scene = screen.getByTestId("stars-collide-scene");

    await click(scene);
    await click(scene);

    expect(screen.getByTestId("stars-collide-line").textContent).toBe("Oi");
    expect(screen.getByTestId("stars-collide-bubble").dataset.speaker).toBe("mabel");
  });
});
