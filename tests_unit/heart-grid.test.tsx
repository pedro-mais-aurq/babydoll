import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeartGrid } from "../src/app/interface/MomentsHub/HeartGrid";

afterEach(cleanup);

describe("HeartGrid", () => {
  it("não permite abrir cinemáticas durante a revelação", async () => {
    const onSelect = vi.fn();

    render(<HeartGrid isInteractive={false} selectedMomentId={null} onSelect={onSelect} />);

    const tile = screen.getByRole("button", { name: /Nosso primeiro dia 5/i });
    expect((tile as HTMLButtonElement).disabled).toBe(true);

    await userEvent.click(tile, { pointerEventsCheck: 0 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("abre o momento correspondente quando a exploração começa", async () => {
    const onSelect = vi.fn();

    render(<HeartGrid isInteractive selectedMomentId={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /Nosso primeiro dia 5/i }));

    expect(onSelect).toHaveBeenCalledWith("first-day-five");
  });

  it("não transforma células decorativas em botões", () => {
    render(<HeartGrid isInteractive selectedMomentId={null} onSelect={vi.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
