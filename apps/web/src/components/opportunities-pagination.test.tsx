import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunitiesPagination } from "./opportunities-pagination";

describe("OpportunitiesPagination", () => {
  it("keeps filters and exposes previous and next navigation", () => {
    render(<OpportunitiesPagination filters={{ page: 2, status: "open" }} total={30} pageSize={12} />);
    expect(screen.getByRole("navigation", { name: "Paginação de oportunidades" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /anterior/i })).toHaveAttribute("href", "/oportunidades?status=open");
    expect(screen.getByRole("button", { name: /próxima/i })).toHaveAttribute("href", "/oportunidades?page=3&status=open");
    expect(screen.getByText(/página/i)).toHaveTextContent("Página 2 de 3");
  });
});
