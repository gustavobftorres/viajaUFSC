import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstitutionsPagination } from "./institutions-pagination";

describe("InstitutionsPagination", () => {
  it("preserves every filter in accessible previous and next links", () => {
    render(<InstitutionsPagination filters={{ page: 2, continent: "Europa", exchangeAvailable: true }} total={31} pageSize={12} />);
    expect(screen.getByRole("navigation", { name: "Paginação de convênios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /anterior/i })).toHaveAttribute("href", "/instituicoes?continent=Europa&exchange_available=true");
    expect(screen.getByRole("button", { name: /próxima/i })).toHaveAttribute("href", "/instituicoes?page=3&continent=Europa&exchange_available=true");
    expect(screen.getByText(/página/i)).toHaveTextContent("Página 2 de 3");
  });
});
