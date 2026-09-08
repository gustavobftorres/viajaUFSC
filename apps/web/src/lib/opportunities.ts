import type { OpportunityFilters } from "@/lib/api";

export type OpportunitySearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? value : undefined;
}

export function parseOpportunityFilters(params: OpportunitySearchParams): OpportunityFilters {
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const status = first(params.status)?.toLowerCase();
  return {
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: 12,
    status: status === "open" || status === "closed" ? status : undefined,
    deadlineFrom: validDate(first(params.deadline_from)),
    deadlineTo: validDate(first(params.deadline_to)),
  };
}

export function opportunitiesHref(filters: OpportunityFilters, page = filters.page ?? 1) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.status) params.set("status", filters.status);
  if (filters.deadlineFrom) params.set("deadline_from", filters.deadlineFrom);
  if (filters.deadlineTo) params.set("deadline_to", filters.deadlineTo);
  const query = params.toString();
  return `/oportunidades${query ? `?${query}` : ""}`;
}

export function formatDeadline(deadline: string | null, fallback: string | null) {
  if (deadline) {
    const parsed = new Date(`${deadline}T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(parsed);
  }
  return fallback ?? "Prazo não informado";
}

export function statusLabel(status: string | null) {
  if (status?.toLowerCase() === "open") return "Aberta";
  if (status?.toLowerCase() === "closed") return "Encerrada";
  return status ?? "Status não informado";
}
