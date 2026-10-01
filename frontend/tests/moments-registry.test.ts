import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { moments } from "../src/moments/moments";
import { beats, FINAL_LINE, OUTRO_INDEX } from "../src/cinematics/as-estrelas-colidem/content";

describe("registro de momentos", () => {
  it("coloca 'As estrelas colidem' antes de 'Quando nos entrelaçamos'", () => {
    const titles = moments.map((moment) => moment.title);

    expect(titles.indexOf("As estrelas colidem")).toBe(0);
    expect(titles.indexOf("Quando nos entrelaçamos")).toBe(1);
    expect(titles.indexOf("As estrelas colidem")).toBeLessThan(
      titles.indexOf("Quando nos entrelaçamos"),
    );
  });

  it("não expõe mais o título antigo em lugar nenhum visível", () => {
    expect(moments.some((moment) => moment.title === "Nosso primeiro dia 5")).toBe(false);
    expect(readFileSync("src/moments/moments.ts", "utf8")).not.toMatch(/Nosso primeiro dia 5/);
    // O card de título da própria cinemática 02 também foi renomeado.
    expect(readFileSync("src/cinematics/today/TodayCinematic.tsx", "utf8")).not.toMatch(
      /Nosso primeiro dia 5/,
    );
  });

  it("preserva os ids internos existentes", () => {
    expect(moments.map((moment) => moment.id)).toEqual(["stars-collide", "first-day-five"]);
  });
});

describe("conteúdo narrativo de 'As estrelas colidem'", () => {
  it("mantém as falas obrigatórias, literais e na ordem", () => {
    expect(beats).toEqual([
      { kind: "line", speaker: "pedro", text: "Oi" },
      { kind: "line", speaker: "mabel", text: "Oi" },
      { kind: "pause" },
      { kind: "line", speaker: "pedro", text: "Você gosta do Drummond?" },
      { kind: "line", speaker: "mabel", text: "Nem um pouco" },
      { kind: "line", speaker: "pedro", text: "Eu também não, aquele assediador filho da puta" },
      { kind: "line", speaker: "mabel", text: "jurooo" },
      { kind: "outro" },
    ]);
  });

  it("tem a pausa como estado próprio entre os dois 'Oi' e a pergunta", () => {
    expect(beats[2].kind).toBe("pause");
    expect(beats[1]).toMatchObject({ text: "Oi" });
    expect(beats[3]).toMatchObject({ text: "Você gosta do Drummond?" });
  });

  it("termina com a frase final e um beat de encerramento", () => {
    expect(FINAL_LINE).toBe("Assim nós viramos amigos");
    expect(beats[OUTRO_INDEX].kind).toBe("outro");
  });
});
