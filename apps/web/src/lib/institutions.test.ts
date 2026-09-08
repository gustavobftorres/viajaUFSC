import { describe, expect, it } from "vitest";
import { exchangeLabel, formatAgreementPeriod, institutionOverflowHref, institutionsHref, parseInstitutionFilters } from "./institutions";

describe("institution query filters", () => {
  it("parses valid filters, trims text and rejects invalid page or availability", () => {
    expect(parseInstitutionFilters({ page: "2", continent: " Europa ", country: "Portugal", subject_area: "Engenharia", exchange_available: "false" })).toEqual({
      page: 2,
      pageSize: 12,
      continent: "Europa",
      country: "Portugal",
      subjectArea: "Engenharia",
      exchangeAvailable: false,
    });
    expect(parseInstitutionFilters({ page: "-8", exchange_available: "unknown" })).toEqual({
      page: 1,
      pageSize: 12,
      continent: undefined,
      country: undefined,
      subjectArea: undefined,
      exchangeAvailable: undefined,
    });
    expect(parseInstitutionFilters({ page: "2abc" }).page).toBe(1);
    expect(parseInstitutionFilters({ page: "02" }).page).toBe(1);
  });

  it("builds encoded links and resets pagination when requested", () => {
    expect(institutionsHref({ page: 8, continent: "América do Sul", subjectArea: "Ciências Humanas", exchangeAvailable: true }, 1)).toBe("/instituicoes?continent=Am%C3%A9rica+do+Sul&subject_area=Ci%C3%AAncias+Humanas&exchange_available=true");
  });

  it("canonicalizes only pages beyond the filtered result range", () => {
    const filters = { page: 8, continent: "Europa", exchangeAvailable: true } as const;
    expect(institutionOverflowHref(filters, 25, 12)).toBe("/instituicoes?page=3&continent=Europa&exchange_available=true");
    expect(institutionOverflowHref({ ...filters, page: 3 }, 25, 12)).toBeNull();
    expect(institutionOverflowHref(filters, 0, 12)).toBeNull();
  });

  it("describes nullable availability and partial agreement periods honestly", () => {
    expect(exchangeLabel(null)).toBe("Não informado");
    expect(exchangeLabel(false)).toBe("Não disponível");
    expect(formatAgreementPeriod("2025-01-02", "2025-12-31")).toBe("02/01/2025 — 31/12/2025");
    expect(formatAgreementPeriod("2025-01-02", null)).toBe("Desde 02/01/2025");
    expect(formatAgreementPeriod(null, "2025-12-31")).toBe("Até 31/12/2025");
    expect(formatAgreementPeriod("2025-02-30", "texto da fonte")).toBe("2025-02-30 — texto da fonte");
  });
});
