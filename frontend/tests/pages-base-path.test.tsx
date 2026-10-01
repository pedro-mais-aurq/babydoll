import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";

const base = "/repositorio-renomeado/";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

it.each(["", "moments", "moments/stars-collide", "moments/first-day-five", "moments/sete-de-dezembro"])(
  "resolve a rota %s sob um prefixo de produção arbitrário",
  async (route) => {
    window.history.replaceState({}, "", base + route);
    render(<BrowserRouter basename={base}><App /></BrowserRouter>);
    if (route === "") expect(screen.getByPlaceholderText("DD/MM/AAAA")).toBeTruthy();
    else if (route === "moments") expect(screen.getByText("nossos momentos")).toBeTruthy();
    else if (route.endsWith("stars-collide")) expect(screen.getByTestId("stars-collide-cinematic")).toBeTruthy();
    else if (route.endsWith("first-day-five")) expect(await screen.findByRole("article", { name: "Quando nos entrelaçamos" })).toBeTruthy();
    else {
      expect(screen.getByTestId("sete-de-dezembro-cinematic")).toBeTruthy();
      expect(screen.getByTestId("sete-de-dezembro-chat")).toBeTruthy();
    }
    expect(screen.queryByText("Página não encontrada")).toBeNull();
  },
);
