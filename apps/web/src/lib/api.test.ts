import { describe, expect, it, vi } from "vitest";
import { CATALOG_TIMEOUT_MS, DEFAULT_API_URL, fetchCatalogPreview, getApiBaseUrl, normalizeOpportunity } from "./api";

describe("API client", () => {
  it("uses only valid HTTP origins", () => {
    expect(getApiBaseUrl("https://example.org/")).toBe("https://example.org");
    expect(getApiBaseUrl("not-a-url")).toBe(DEFAULT_API_URL);
    expect(getApiBaseUrl("javascript:alert(1)")).toBe(DEFAULT_API_URL);
  });

  it("normalizes an opportunity and rejects malformed records", () => {
    expect(normalizeOpportunity({ external_id: " notice-1 ", title: " Edital aberto ", status: "open", application_deadline: "2026-10-10" })).toMatchObject({ externalId: "notice-1", title: "Edital aberto", status: "open", applicationDeadline: "2026-10-10" });
    expect(normalizeOpportunity({ title: "Sem identificador" })).toBeNull();
  });

  it("loads and normalizes the preview without real network access", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ external_id: "1", title: "Chamada", status: "open" }], total: 9 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ external_id: "i1" }], total: 381 }), { status: 200 }));
    await expect(fetchCatalogPreview({ fetcher })).resolves.toEqual({ opportunities: [expect.objectContaining({ externalId: "1", title: "Chamada" })], opportunityTotal: 9, institutionTotal: 381 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns an honest fallback for transport failures", async () => {
    const failed = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(fetchCatalogPreview({ fetcher: failed })).resolves.toBeNull();
  });

  it("aborts after the cold-start budget and returns fallback without waiting", async () => {
    const controller = new AbortController();
    const signalFactory = vi.fn(() => {
      controller.abort(new DOMException("Timed out", "TimeoutError"));
      return controller.signal;
    });
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      return Promise.reject(controller.signal.reason);
    }) as unknown as typeof fetch;

    await expect(fetchCatalogPreview({ fetcher, signalFactory })).resolves.toBeNull();
    expect(signalFactory).toHaveBeenCalledWith(CATALOG_TIMEOUT_MS);
    expect(fetcher).toHaveBeenCalled();
  });
});
