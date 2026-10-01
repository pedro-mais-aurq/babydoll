import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CinematicStage } from "../src/app/interface/CinematicStage/CinematicStage";
import { findMoment, moments } from "../src/moments/moments";

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

describe("fronteiras arquiteturais", () => {
  it("interface global não importa internals de cinemáticas", () => {
    for (const file of filesIn("src/app/interface")) {
      if (!/\.(ts|tsx|css)$/.test(file)) continue;
      expect(readFileSync(file, "utf8"), file).not.toMatch(/cinematics\//);
    }
  });

  it("registro tem IDs únicos e cinemáticas válidas", () => {
    const ids = moments.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of moments) {
      expect(typeof m.cinematic).toBe("function");
      expect(m.cover).toBeTruthy();
    }
    expect(findMoment("desconhecido")).toBeUndefined();
  });

  it("CinematicStage renderiza a cinemática sem estilo inline", () => {
    render(
      <CinematicStage>
        <p>cena</p>
      </CinematicStage>,
    );
    const stage = screen.getByRole("main");
    expect(stage.contains(screen.getByText("cena"))).toBe(true);
    expect(stage.getAttribute("style")).toBeNull();
  });

  it("CSS global não impõe aparência ou overflow às cinemáticas", () => {
    const css = readFileSync("src/index.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selector, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(?:^|[\s,>+~])(?:html|body|#root|:root|\*)(?=$|[\s,.:#>+~[])/.test(selector)) {
        continue;
      }
      expect(declarations, selector).not.toMatch(
        /(?:^|;)\s*(?:background(?:-[\w-]+)?|color|overflow(?:-[\w-]+)?)\s*:/,
      );
      expect(declarations, selector).not.toMatch(/@apply[^;]*(?:bg-|text-|overflow-)/);
    }
  });

  it("CSS do Stage é apenas estrutural", () => {
    const css = readFileSync("src/app/interface/CinematicStage/CinematicStage.module.css", "utf8");
    expect(css).not.toMatch(/background|color|overflow|padding/);
  });

  it("a nova cinemática não criou abstrações globais", () => {
    const names = ["CinematicEngine", "SceneManager", "TimelineManager"];
    for (const file of filesIn("src")) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const source = readFileSync(file, "utf8");
      for (const name of names) {
        expect(source, `${file} menciona ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`));
      }
    }
  });
});
