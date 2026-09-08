import Link from "next/link";
import { ArrowRight, CalendarDays, Globe2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCatalogPreview, type CatalogPreview as CatalogData } from "@/lib/api";

function deadlineLabel(deadline: string | null, deadlineText: string | null) {
  if (deadline) {
    const parsed = new Date(`${deadline}T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
  }
  return deadlineText ?? "Consulte o edital";
}

export function CatalogWindow({ data }: { data: CatalogData | null }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#081426]/90 shadow-2xl shadow-sky-950/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex gap-1.5" aria-hidden="true"><span className="size-2.5 rounded-full bg-rose-400/70" /><span className="size-2.5 rounded-full bg-amber-300/70" /><span className="size-2.5 rounded-full bg-emerald-300/70" /></div>
        <span className="text-xs font-medium tracking-[0.16em] text-slate-400 uppercase">Catálogo viajaUFSC</span><span className="size-8" aria-hidden="true" />
      </div>
      <div className="grid min-h-[25rem] md:grid-cols-[13rem_1fr]">
        <aside className="hidden border-r border-white/10 p-5 md:block" aria-label="Filtros de exemplo">
          <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Descobrir</p>
          <div className="space-y-1 text-sm"><div className="rounded-lg bg-sky-400/10 px-3 py-2.5 font-medium text-sky-200">Oportunidades</div><div className="px-3 py-2.5 text-slate-400">Instituições</div></div>
          <p className="mb-3 mt-8 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Status</p>
          <Badge className="rounded-full border-emerald-300/20 bg-emerald-400/10 text-emerald-200">Abertas agora</Badge>
        </aside>
        <div className="p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm text-sky-300">Seleção atual</p><h3 className="mt-1 text-xl font-semibold text-white">Oportunidades abertas</h3></div>
            {data && <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400"><span><strong className="font-semibold text-white">{data.opportunityTotal}</strong> abertas</span><span><strong className="font-semibold text-white">{data.institutionTotal}</strong> registros parceiros</span></div>}
          </div>
          {!data ? (
            <Alert className="border-amber-200/15 bg-amber-200/5 text-slate-200"><Globe2 aria-hidden="true" /><AlertTitle>Catálogo temporariamente indisponível</AlertTitle><AlertDescription className="text-slate-400">A consulta ao serviço de dados não respondeu a tempo. Você ainda pode conhecer como o projeto funciona.</AlertDescription></Alert>
          ) : data.opportunities.length === 0 ? (
            <Alert className="border-white/10 bg-white/[0.03] text-slate-200"><CalendarDays aria-hidden="true" /><AlertTitle>Nenhuma oportunidade aberta agora</AlertTitle><AlertDescription className="text-slate-400">O catálogo continua disponível para consulta de editais anteriores e instituições parceiras.</AlertDescription></Alert>
          ) : (
            <div className="space-y-3">{data.opportunities.map((item) => (
              <Card key={item.externalId} className="border-white/10 bg-white/[0.035] py-0 text-white shadow-none transition-colors hover:bg-white/[0.06]">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className="rounded-full border-emerald-300/20 bg-emerald-400/10 text-emerald-200">Aberta</Badge>{item.kind && <span className="text-xs tracking-wide text-slate-400 uppercase">{item.kind}</span>}</div><p className="line-clamp-2 font-medium leading-6 text-slate-100">{item.title}</p></div>
                  <div className="shrink-0 sm:text-right"><p className="text-xs text-slate-400">Prazo</p><p className="mt-1 text-sm text-slate-300">{deadlineLabel(item.applicationDeadline, item.deadlineText)}</p></div>
                </CardContent>
              </Card>
            ))}</div>
          )}
          <Button nativeButton={false} render={<Link href="/oportunidades" />} variant="ghost" className="mt-5 px-0 text-sky-300 hover:bg-transparent hover:text-sky-200">Abrir catálogo completo <ArrowRight aria-hidden="true" /></Button>
        </div>
      </div>
    </div>
  );
}

export async function CatalogPreview() { return <CatalogWindow data={await fetchCatalogPreview()} />; }

export function CatalogPreviewSkeleton() {
  return <div className="rounded-[1.5rem] border border-white/12 bg-[#081426]/90 p-6" aria-label="Carregando catálogo"><div className="mb-8 flex justify-between"><Skeleton className="h-4 w-24 bg-white/10" /><Skeleton className="h-4 w-36 bg-white/10" /></div><div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full bg-white/10" />)}</div></div>;
}
