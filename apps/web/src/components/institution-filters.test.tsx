import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstitutionFilters } from "./institution-filters";

describe("InstitutionFilters", () => {
  it("preserves text filters, resets page and explains unknown availability", () => {
    render(<InstitutionFilters filters={{ page: 4, continent: "Europa", country: "Portugal", subjectArea: "Engenharia", exchangeAvailable: true }} />);
    expect(screen.getByLabelText("Continente")).toHaveValue("Europa");
    expect(screen.getByLabelText("País")).toHaveValue("Portugal");
    expect(screen.getByLabelText("Área acadêmica")).toHaveValue("Engenharia");
    expect(screen.getByRole("button", { name: "Não disponível" })).toHaveAttribute("href", "/instituicoes?continent=Europa&country=Portugal&subject_area=Engenharia&exchange_available=false");
    expect(screen.getByRole("button", { name: "Todos (inclui não informado)" })).toHaveAttribute("href", "/instituicoes?continent=Europa&country=Portugal&subject_area=Engenharia");
    expect(screen.getByText(/API ainda não permite filtrá-lo isoladamente/i)).toBeInTheDocument();
  });

  it("remounts cleanly when navigation removes filters", () => {
    const { rerender } = render(<InstitutionFilters key="filtered" filters={{ continent: "Europa", country: "Portugal", subjectArea: "Engenharia" }} />);
    rerender(<InstitutionFilters key="empty" filters={{}} />);
    expect(screen.getByLabelText("Continente")).toHaveValue("");
    expect(screen.getByLabelText("País")).toHaveValue("");
    expect(screen.getByLabelText("Área acadêmica")).toHaveValue("");
  });

  it("omits empty text controls from the canonical GET query", () => {
    render(<InstitutionFilters filters={{}} />);
    const continent = screen.getByLabelText("Continente");
    const country = screen.getByLabelText("País");
    const subjectArea = screen.getByLabelText("Área acadêmica");
    expect(continent).not.toHaveAttribute("name");
    expect(country).not.toHaveAttribute("name");
    expect(subjectArea).not.toHaveAttribute("name");

    fireEvent.change(continent, { target: { value: "Europa" } });
    expect(continent).toHaveAttribute("name", "continent");
    fireEvent.change(continent, { target: { value: "   " } });
    expect(continent).not.toHaveAttribute("name");
  });
});
