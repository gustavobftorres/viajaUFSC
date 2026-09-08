import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("explica o erro e oferece retorno ao início", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /voltar ao início/i })).toHaveAttribute("href", "/");
  });
});
