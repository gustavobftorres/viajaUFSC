import { describe, expect, it, vi } from "vitest";
import { CATALOG_TIMEOUT_MS, DEFAULT_API_URL, fetchCatalogPreview, fetchOpportunities, fetchOpportunity, getApiBaseUrl, normalizeOpportunity } from "./api";

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

  it("serializes supported opportunity filters and normalizes pagination", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ external_id: "notice/1", title: "Chamada", source_url: "https://sinter.ufsc.br/notice" }], page: 2, page_size: 12, total: 18 }), { status: 200 }));
    await expect(fetchOpportunities({ page: 2, status: "open", deadlineFrom: "2026-09-01", deadlineTo: "2026-12-31" }, { fetcher })).resolves.toMatchObject({ page: 2, pageSize: 12, total: 18, items: [expect.objectContaining({ externalId: "notice/1", sourceUrl: "https://sinter.ufsc.br/notice" })] });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("opportunities?page=2&page_size=12&status=open&deadline_from=2026-09-01&deadline_to=2026-12-31");
  });

  it("loads encoded opportunity details and preserves an HTTP error status", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ external_id: "edital/1", title: "Edital", canonical_url: "javascript:alert(1)" }), { status: 200 })).mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(fetchOpportunity("edital/1", { fetcher })).resolves.toMatchObject({ externalId: "edital/1", canonicalUrl: null });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("opportunities/edital%2F1");
    await expect(fetchOpportunity("missing", { fetcher })).rejects.toMatchObject({ name: "ApiError", status: 404 });
  });
});
