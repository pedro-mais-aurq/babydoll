import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AsEstrelasColidem } from "../src/cinematics/as-estrelas-colidem/AsEstrelasColidem";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("desbloqueia o contexto existente por gesto, tolera rejeição e não duplica a ambiência", async () => {
  const param = () => ({
    value: 0.01,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });
  const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), loop: false };
  const breath = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: param() };
  const ctx = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 10,
    destination: {},
    resume: vi.fn<() => Promise<void>>(),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(30) })),
    createBufferSource: vi.fn(() => source),
    createBiquadFilter: vi.fn(() => ({ connect: vi.fn(), frequency: param() })),
    createGain: vi.fn(() => ({ connect: vi.fn(), gain: param() })),
    createOscillator: vi.fn(() => breath),
  };
  const ctor = vi.fn(function () { return ctx; });
  vi.stubGlobal("AudioContext", ctor);
  const view = render(<AsEstrelasColidem onComplete={vi.fn()} playSound={vi.fn()} />);
  expect(ctx.resume).not.toHaveBeenCalled();
  expect(source.start).toHaveBeenCalledTimes(1);

  let rejectResume!: (error: Error) => void;
  ctx.resume.mockImplementationOnce(() => new Promise((_, reject) => { rejectResume = reject; }));
  fireEvent.wheel(window);
  fireEvent.touchStart(window); // retomada pendente: não inicia outra
  expect(ctx.resume).toHaveBeenCalledTimes(1);
  await act(async () => { rejectResume(new Error("autoplay bloqueado")); });
  expect(screen.getByTestId("stars-collide-scene")).toBeTruthy();

  ctx.resume.mockImplementationOnce(() => { throw new Error("falha síncrona"); });
  expect(() => fireEvent.pointerDown(window)).not.toThrow();
  ctx.resume.mockImplementationOnce(async () => { ctx.state = "running"; });
  await act(async () => { fireEvent.click(window); });
  expect(ctx.resume).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(window, { key: "Enter" });
  fireEvent.wheel(window);
  expect(ctx.resume).toHaveBeenCalledTimes(3);
  expect(ctor).toHaveBeenCalledTimes(1);
  expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  expect(source.start).toHaveBeenCalledTimes(1);
  expect(breath.start).toHaveBeenCalledTimes(1);

  view.unmount();
  expect(source.stop).toHaveBeenCalledTimes(1);
  expect(breath.stop).toHaveBeenCalledTimes(1);
  ctx.state = "suspended";
  fireEvent.click(window);
  expect(ctx.resume).toHaveBeenCalledTimes(3); // listener removido
});
