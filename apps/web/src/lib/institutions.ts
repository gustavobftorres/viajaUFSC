import type { InstitutionFilters } from "@/lib/api";

export type InstitutionSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function text(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 120) : undefined;
}

export function parseInstitutionFilters(params: InstitutionSearchParams): InstitutionFilters {
  const pageValue = first(params.page) ?? "1";
  const requestedPage = /^[1-9]\d*$/.test(pageValue) ? Number(pageValue) : 1;
  const exchange = first(params.exchange_available)?.toLowerCase();
  return {
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: 12,
    continent: text(first(params.continent)),
    country: text(first(params.country)),
    subjectArea: text(first(params.subject_area)),
    exchangeAvailable: exchange === "true" ? true : exchange === "false" ? false : undefined,
  };
}

export function institutionsHref(filters: InstitutionFilters, page = filters.page ?? 1) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.continent) params.set("continent", filters.continent);
  if (filters.country) params.set("country", filters.country);
  if (filters.subjectArea) params.set("subject_area", filters.subjectArea);
  if (typeof filters.exchangeAvailable === "boolean") params.set("exchange_available", String(filters.exchangeAvailable));
  const query = params.toString();
  return `/instituicoes${query ? `?${query}` : ""}`;
}

export function institutionOverflowHref(filters: InstitutionFilters, total: number, pageSize: number) {
  if (total <= 0 || pageSize <= 0) return null;
  const lastPage = Math.ceil(total / pageSize);
  return (filters.page ?? 1) > lastPage ? institutionsHref(filters, lastPage) : null;
}

export function exchangeLabel(value: boolean | null) {
  if (value === true) return "Disponível";
  if (value === false) return "Não disponível";
  return "Não informado";
}

export function formatAgreementPeriod(start: string | null, end: string | null) {
  const formattedStart = start ? formatAgreementDate(start) : null;
  const formattedEnd = end ? formatAgreementDate(end) : null;
  if (formattedStart && formattedEnd) return `${formattedStart} — ${formattedEnd}`;
  if (formattedStart) return `Desde ${formattedStart}`;
  if (formattedEnd) return `Até ${formattedEnd}`;
  return "Período não informado";
}

function formatAgreementDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatSourceTimestamp(value: string | null) {
  if (!value) return "Não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}
