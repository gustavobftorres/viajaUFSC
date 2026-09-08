export const DEFAULT_API_URL = "https://viajaufsc-api.onrender.com";
export const CATALOG_TIMEOUT_MS = 65_000;

export type Opportunity = {
  externalId: string;
  title: string;
  kind: string | null;
  status: string | null;
  program: string | null;
  linkText: string | null;
  audience: string | null;
  applicationDeadline: string | null;
  deadlineText: string | null;
  body: string | null;
  publishedAt: string | null;
  modifiedAt: string | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  firstSeenAt: string | null;
  updatedAt: string | null;
};

export type OpportunityFilters = {
  page?: number;
  pageSize?: number;
  status?: "open" | "closed";
  deadlineFrom?: string;
  deadlineTo?: string;
};

export type OpportunityPage = {
  items: Opportunity[];
  page: number;
  pageSize: number;
  total: number;
};

export type Institution = {
  externalId: string;
  name: string;
  continent: string;
  country: string | null;
  details: string | null;
  startDate: string | null;
  endDate: string | null;
  agreementType: string | null;
  subjectArea: string | null;
  exchangeAvailable: boolean | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  firstSeenAt: string | null;
  updatedAt: string | null;
};

export type InstitutionFilters = {
  page?: number;
  pageSize?: number;
  continent?: string;
  country?: string;
  subjectArea?: string;
  exchangeAvailable?: boolean;
};

export type InstitutionPage = {
  items: Institution[];
  page: number;
  pageSize: number;
  total: number;
};

export type CatalogPreview = {
  opportunities: Opportunity[];
  opportunityTotal: number;
  institutionTotal: number;
};

type ApiPage = { items: unknown[]; total: number };

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalHttpUrl(value: unknown): string | null {
  const candidate = optionalString(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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
    linkText: optionalString(value.link_text),
    audience: optionalString(value.audience),
    applicationDeadline: optionalString(value.application_deadline),
    deadlineText: optionalString(value.deadline_text),
    body: optionalString(value.body),
    publishedAt: optionalString(value.published_at),
    modifiedAt: optionalString(value.modified_at),
    sourceUrl: optionalHttpUrl(value.source_url),
    canonicalUrl: optionalHttpUrl(value.canonical_url),
    firstSeenAt: optionalString(value.first_seen_at),
    updatedAt: optionalString(value.updated_at),
  };
}

export function normalizeInstitution(value: unknown): Institution | null {
  if (!isRecord(value) || typeof value.external_id !== "string" || typeof value.name !== "string" || typeof value.continent !== "string") return null;
  const externalId = value.external_id.trim();
  const name = value.name.trim();
  const continent = value.continent.trim();
  if (!externalId || !name || !continent) return null;
  return {
    externalId,
    name,
    continent,
    country: optionalString(value.country),
    details: optionalString(value.details),
    startDate: optionalString(value.start_date),
    endDate: optionalString(value.end_date),
    agreementType: optionalString(value.agreement_type),
    subjectArea: optionalString(value.subject_area),
    exchangeAvailable: typeof value.exchange_available === "boolean" ? value.exchange_available : null,
    sourceUrl: optionalHttpUrl(value.source_url),
    canonicalUrl: optionalHttpUrl(value.canonical_url),
    firstSeenAt: optionalString(value.first_seen_at),
    updatedAt: optionalString(value.updated_at),
  };
}

function normalizePage(value: unknown): ApiPage | null {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.total !== "number" || !Number.isFinite(value.total) || value.total < 0) return null;
  return { items: value.items, total: value.total };
}

function normalizeOpportunityPage(value: unknown): OpportunityPage | null {
  const page = normalizePage(value);
  if (!page || !isRecord(value) || typeof value.page !== "number" || !Number.isInteger(value.page) || value.page < 1 || typeof value.page_size !== "number" || !Number.isInteger(value.page_size) || value.page_size < 1) return null;
  return {
    items: page.items.map(normalizeOpportunity).filter((item): item is Opportunity => item !== null),
    page: value.page,
    pageSize: value.page_size,
    total: page.total,
  };
}

function normalizeInstitutionPage(value: unknown): InstitutionPage | null {
  const page = normalizePage(value);
  if (!page || !isRecord(value) || typeof value.page !== "number" || !Number.isInteger(value.page) || value.page < 1 || typeof value.page_size !== "number" || !Number.isInteger(value.page_size) || value.page_size < 1) return null;
  return {
    items: page.items.map(normalizeInstitution).filter((item): item is Institution => item !== null),
    page: value.page,
    pageSize: value.page_size,
    total: page.total,
  };
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

type RequestOptions = PreviewOptions;

async function getJson(
  path: string,
  { fetcher = fetch, timeoutMs = CATALOG_TIMEOUT_MS, signalFactory = AbortSignal.timeout }: RequestOptions = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(`${getApiBaseUrl()}/api/v1/${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: signalFactory(timeoutMs),
    });
  } catch {
    throw new ApiError("Não foi possível acessar o catálogo agora.");
  }
  if (!response.ok) throw new ApiError("O catálogo respondeu com erro.", response.status);
  try {
    return await response.json();
  } catch {
    throw new ApiError("O catálogo retornou uma resposta inválida.", response.status);
  }
}

export async function fetchOpportunities(
  filters: OpportunityFilters = {},
  options: RequestOptions = {},
): Promise<OpportunityPage> {
  const params = new URLSearchParams({ page: String(filters.page ?? 1), page_size: String(filters.pageSize ?? 12) });
  if (filters.status) params.set("status", filters.status);
  if (filters.deadlineFrom) params.set("deadline_from", filters.deadlineFrom);
  if (filters.deadlineTo) params.set("deadline_to", filters.deadlineTo);
  const page = normalizeOpportunityPage(await getJson(`opportunities?${params}`, options));
  if (!page) throw new ApiError("O catálogo retornou uma página inválida.");
  return page;
}

export async function fetchOpportunity(externalId: string, options: RequestOptions = {}): Promise<Opportunity> {
  const opportunity = normalizeOpportunity(await getJson(`opportunities/${encodeURIComponent(externalId)}`, options));
  if (!opportunity) throw new ApiError("O catálogo retornou uma oportunidade inválida.");
  return opportunity;
}

export async function fetchInstitutions(
  filters: InstitutionFilters = {},
  options: RequestOptions = {},
): Promise<InstitutionPage> {
  const params = new URLSearchParams({ page: String(filters.page ?? 1), page_size: String(filters.pageSize ?? 12) });
  if (filters.continent) params.set("continent", filters.continent);
  if (filters.country) params.set("country", filters.country);
  if (filters.subjectArea) params.set("subject_area", filters.subjectArea);
  if (typeof filters.exchangeAvailable === "boolean") params.set("exchange_available", String(filters.exchangeAvailable));
  const page = normalizeInstitutionPage(await getJson(`institutions?${params}`, options));
  if (!page) throw new ApiError("O catálogo retornou uma página de convênios inválida.");
  return page;
}

export async function fetchInstitution(externalId: string, options: RequestOptions = {}): Promise<Institution> {
  const institution = normalizeInstitution(await getJson(`institutions/${encodeURIComponent(externalId)}`, options));
  if (!institution) throw new ApiError("O catálogo retornou um convênio inválido.");
  return institution;
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
