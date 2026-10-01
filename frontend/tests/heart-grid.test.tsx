import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HeartGrid } from "../src/app/interface/MomentsHub/HeartGrid";

describe("HeartGrid", () => {
  it("não permite abrir cinemáticas durante a revelação", async () => {
    const onSelect = vi.fn();

    render(<HeartGrid isInteractive={false} selectedMomentId={null} onSelect={onSelect} />);

    const tile = screen.getByRole("button", { name: /As estrelas colidem/i });
    expect((tile as HTMLButtonElement).disabled).toBe(true);

    await userEvent.click(tile, { pointerEventsCheck: 0 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("abre o momento correspondente quando a exploração começa", async () => {
    const onSelect = vi.fn();

    render(<HeartGrid isInteractive selectedMomentId={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /As estrelas colidem/i }));
    expect(onSelect).toHaveBeenCalledWith("stars-collide");

    await userEvent.click(screen.getByRole("button", { name: /Quando nos entrelaçamos/i }));
    expect(onSelect).toHaveBeenCalledWith("first-day-five");
  });

  it("não transforma células decorativas em botões", () => {
    render(<HeartGrid isInteractive selectedMomentId={null} onSelect={vi.fn()} />);

    // Duas cinemáticas abríveis; "A próxima lembrança" fica reservada, sem botão.
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /próxima lembrança/i })).toBeNull();
    expect(screen.getByText(/A próxima lembrança/)).toBeTruthy();
    expect(screen.getAllByText("em breve").length).toBeGreaterThan(0);
  });
});
