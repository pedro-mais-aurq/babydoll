import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/** jsdom não implementa matchMedia; o flag abaixo permite testar reduced-motion. */
export const motionPreference = { reduceMotion: false };

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: query.includes("reduce") ? motionPreference.reduceMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  motionPreference.reduceMotion = false;
});
