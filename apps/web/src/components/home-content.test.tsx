import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeContent } from "./home-content";

describe("HomeContent", () => {
  it("renders a semantic, navigable landing page", () => {
    render(<HomeContent catalog={<div aria-label="Prévia do catálogo">Dados do catálogo</div>} />);
    expect(screen.getByRole("heading", { level: 1, name: /próximo destino acadêmico/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute("href", "#conteudo");
    expect(screen.getByLabelText("Prévia do catálogo")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /oportunidades/i }).length).toBeGreaterThan(0);
  });
});
