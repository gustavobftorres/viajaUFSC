export const DEFAULT_API_URL = "https://viajaufsc-api.onrender.com";
export const CATALOG_TIMEOUT_MS = 65_000;

export type Opportunity = {
  externalId: string;
  title: string;
  kind: string | null;
  status: string | null;
  program: string | null;
  audience: string | null;
  applicationDeadline: string | null;
  deadlineText: string | null;
  canonicalUrl: string | null;
};

export type CatalogPreview = {
  opportunities: Opportunity[];
  opportunityTotal: number;
  institutionTotal: number;
};

type ApiPage = { items: unknown[]; total: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL): string {
  if (!value) return DEFAULT_API_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_API_URL;
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_API_URL;
  }
}

export function normalizeOpportunity(value: unknown): Opportunity | null {
  if (!isRecord(value) || typeof value.external_id !== "string" || typeof value.title !== "string") return null;
  const title = value.title.trim();
  const externalId = value.external_id.trim();
  if (!title || !externalId) return null;
  return {
    externalId,
    title,
    kind: optionalString(value.kind),
    status: optionalString(value.status),
    program: optionalString(value.program),
    audience: optionalString(value.audience),
    applicationDeadline: optionalString(value.application_deadline),
    deadlineText: optionalString(value.deadline_text),
    canonicalUrl: optionalString(value.canonical_url),
  };
}

function normalizePage(value: unknown): ApiPage | null {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.total !== "number" || value.total < 0) return null;
  return { items: value.items, total: value.total };
}

type PreviewOptions = {
  fetcher?: typeof fetch;
  timeoutMs?: number;
  signalFactory?: (timeoutMs: number) => AbortSignal;
};

async function getPage(
  path: string,
  fetcher: typeof fetch,
  timeoutMs: number,
  signalFactory: (timeoutMs: number) => AbortSignal,
): Promise<ApiPage> {
  const response = await fetcher(`${getApiBaseUrl()}/api/v1/${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: signalFactory(timeoutMs),
  });
  if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
  const page = normalizePage(await response.json());
  if (!page) throw new Error("Catalog returned an invalid payload");
  return page;
}

export async function fetchCatalogPreview({
  fetcher = fetch,
  timeoutMs = CATALOG_TIMEOUT_MS,
  signalFactory = AbortSignal.timeout,
}: PreviewOptions = {}): Promise<CatalogPreview | null> {
  try {
    const [opportunities, institutions] = await Promise.all([
      getPage("opportunities?status=open&page=1&page_size=3", fetcher, timeoutMs, signalFactory),
      getPage("institutions?page=1&page_size=1", fetcher, timeoutMs, signalFactory),
    ]);
    return {
      opportunities: opportunities.items.map(normalizeOpportunity).filter((item): item is Opportunity => item !== null),
      opportunityTotal: opportunities.total,
      institutionTotal: institutions.total,
    };
  } catch {
    return null;
  }
}
