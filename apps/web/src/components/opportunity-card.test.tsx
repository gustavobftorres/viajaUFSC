import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityCard } from "./opportunity-card";
import type { Opportunity } from "@/lib/api";

const opportunity: Opportunity = {
  externalId: "edital-1", title: "Mobilidade internacional", kind: "Edital", status: "open", program: null,
  linkText: null, audience: "Graduação", applicationDeadline: "2026-10-01", deadlineText: null,
  body: null, publishedAt: null, modifiedAt: null, sourceUrl: "https://sinter.ufsc.br/edital-1",
  canonicalUrl: null, firstSeenAt: null, updatedAt: null,
};

describe("OpportunityCard", () => {
  it("shows source data and links to its encoded detail route", () => {
    render(<OpportunityCard opportunity={opportunity} />);
    expect(screen.getByText("Mobilidade internacional")).toBeInTheDocument();
    expect(screen.getByText("Graduação")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver detalhes/i })).toHaveAttribute("href", "/oportunidades/edital-1");
  });
});
