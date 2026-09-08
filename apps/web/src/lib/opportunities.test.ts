import { describe, expect, it } from "vitest";
import { formatDeadline, opportunitiesHref, parseOpportunityFilters, statusLabel } from "./opportunities";

describe("opportunity presentation helpers", () => {
  it("accepts only filters supported by the API", () => {
    expect(parseOpportunityFilters({ page: "2", status: "OPEN", deadline_from: "2026-09-01", deadline_to: "invalid", continent: "Europa" })).toEqual({ page: 2, pageSize: 12, status: "open", deadlineFrom: "2026-09-01", deadlineTo: undefined });
    expect(parseOpportunityFilters({ page: "-3", status: "archived", deadline_from: "2026-02-31" })).toMatchObject({ page: 1, status: undefined, deadlineFrom: undefined });
  });

  it("keeps active filters in pagination links", () => {
    expect(opportunitiesHref({ status: "closed", deadlineFrom: "2026-01-01" }, 3)).toBe("/oportunidades?page=3&status=closed&deadline_from=2026-01-01");
  });

  it("formats known and missing values without inventing data", () => {
    expect(formatDeadline("2026-10-01", null)).toContain("2026");
    expect(formatDeadline(null, "Enquanto houver vagas")).toBe("Enquanto houver vagas");
    expect(statusLabel("open")).toBe("Aberta");
    expect(statusLabel(null)).toBe("Status não informado");
  });
});
