import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityFilters } from "./opportunity-filters";

describe("OpportunityFilters", () => {
  it("renders supported filters and preserves them in status navigation", () => {
    render(<OpportunityFilters filters={{ page: 2, pageSize: 12, status: "open", deadlineFrom: "2026-09-01" }} />);
    expect(screen.getByLabelText("Prazo a partir de")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Prazo até")).toHaveAttribute("name", "deadline_to");
    expect(screen.getByRole("button", { name: "Encerradas" })).toHaveAttribute("href", "/oportunidades?status=closed&deadline_from=2026-09-01");
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toHaveAttribute("href", "/oportunidades");
    expect(screen.getByRole("link", { name: "catálogo de instituições" })).toHaveAttribute("href", "/instituicoes");
  });

  it("clears uncontrolled date fields when navigation removes query filters", () => {
    const { rerender } = render(<OpportunityFilters filters={{ page: 1, pageSize: 12, deadlineFrom: "2026-09-01", deadlineTo: "2026-12-31" }} />);
    expect(screen.getByLabelText("Prazo a partir de")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Prazo até")).toHaveValue("2026-12-31");

    rerender(<OpportunityFilters filters={{ page: 1, pageSize: 12 }} />);

    expect(screen.getByLabelText("Prazo a partir de")).toHaveValue("");
    expect(screen.getByLabelText("Prazo até")).toHaveValue("");
  });
});
