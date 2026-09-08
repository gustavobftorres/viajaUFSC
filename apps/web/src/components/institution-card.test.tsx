import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstitutionCard } from "./institution-card";
import type { Institution } from "@/lib/api";

const institution: Institution = {
  externalId: "agreement/1", name: "Universidade Exemplo", continent: "Europa", country: "Portugal",
  details: null, startDate: null, endDate: null, agreementType: "Acordo geral", subjectArea: "Engenharia",
  exchangeAvailable: null, sourceUrl: "https://sinter.ufsc.br/convenios", canonicalUrl: null,
  firstSeenAt: null, updatedAt: null,
};

describe("InstitutionCard", () => {
  it("shows agreement data, nullable availability and an encoded detail route", () => {
    render(<InstitutionCard institution={institution} />);
    expect(screen.getByText("Universidade Exemplo")).toBeInTheDocument();
    expect(screen.getByText("Portugal")).toBeInTheDocument();
    expect(screen.getByText("Engenharia")).toBeInTheDocument();
    expect(screen.getByText("Não informado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver convênio/i })).toHaveAttribute("href", "/instituicoes/agreement%2F1");
  });
});
