import { describe, expect, it } from "vitest";

import {
  findFocusCell,
  heartColumns,
  heartLayout,
  heartRows,
} from "../src/app/interface/MomentsHub/heartLayout";
import { findMoment, moments } from "../src/moments/moments";

describe("heartLayout", () => {
  it("mantém uma grade retangular", () => {
    expect(heartRows).toBe(6);
    expect(heartLayout.every((row) => row.length === heartColumns)).toBe(true);
  });

  it("usa a célula do momento como foco inicial do zoom-out", () => {
    const focus = findFocusCell();
    const cell = heartLayout[focus.row][focus.column];

    expect(cell.type).toBe("moment");
  });

  it("referencia apenas momentos cadastrados", () => {
    const momentIds = heartLayout
      .flat()
      .filter((cell) => cell.type === "moment")
      .map((cell) => (cell.type === "moment" ? cell.momentId : ""));

    expect(momentIds.length).toBe(3);
    momentIds.forEach((id) => expect(findMoment(id)).toBeDefined());
  });

  it("devolve undefined para um id inexistente", () => {
    expect(findMoment("invalid-id")).toBeUndefined();
    expect(moments.length).toBeGreaterThan(0);
  });
});
