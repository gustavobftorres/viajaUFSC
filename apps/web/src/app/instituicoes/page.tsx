import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, Building2, Info } from "lucide-react";
import { InstitutionCard } from "@/components/institution-card";
import { InstitutionFilters } from "@/components/institution-filters";
import { InstitutionsPagination } from "@/components/institutions-pagination";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, fetchInstitutions, type InstitutionPage } from "@/lib/api";
import { institutionOverflowHref, institutionsHref, parseInstitutionFilters, type InstitutionSearchParams } from "@/lib/institutions";

export const metadata: Metadata = {
  title: "Instituições e convênios",
  description: "Consulte os registros de convênios internacionais publicados pela SINTER.",
};

export default async function InstitutionsPage({ searchParams }: { searchParams: Promise<InstitutionSearchParams> }) {
  const filters = parseInstitutionFilters(await searchParams);
  let data: InstitutionPage | null = null;
  let unavailable = false;
  try {
    data = await fetchInstitutions(filters);
  } catch (error) {
    unavailable = error instanceof ApiError;
    if (!unavailable) throw error;
  }
  const overflowHref = data ? institutionOverflowHref(filters, data.total, data.pageSize) : null;
  if (overflowHref) redirect(overflowHref);

  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex-1 px-5 pb-20 pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="outline" className="border-sky-300/20 bg-sky-300/[0.06] text-sky-200">Rede internacional</Badge>
            <h1 className="mt-5 font-heading text-4xl tracking-[-0.04em] sm:text-6xl">Convênios que aproximam destinos.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Consulte acordos publicados pela SINTER por localização, área e disponibilidade registrada.</p>
          </div>

          <Alert className="mt-8 max-w-4xl border-sky-300/15 bg-sky-300/[0.05] text-slate-100">
            <Info aria-hidden="true" />
            <AlertTitle>Um resultado representa um convênio</AlertTitle>
            <AlertDescription className="text-slate-300">A mesma instituição pode aparecer mais de uma vez quando possui acordos distintos. Por isso, a contagem abaixo é de registros de convênio, não de instituições únicas.</AlertDescription>
          </Alert>

          <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start">
            <aside><InstitutionFilters key={institutionsHref(filters)} filters={filters} /></aside>
            <section aria-labelledby="resultados-title">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="eyebrow">Resultados</p><h2 id="resultados-title" className="mt-2 text-2xl font-semibold">Registros de convênio</h2></div>
                {data && <p className="text-sm text-slate-400"><strong className="font-semibold text-white">{data.total}</strong> {data.total === 1 ? "registro encontrado" : "registros encontrados"}</p>}
              </div>

              {unavailable ? (
                <Alert className="border-amber-200/20 bg-amber-200/[0.06] p-5 text-slate-100">
                  <AlertCircle aria-hidden="true" />
                  <AlertTitle>Catálogo temporariamente indisponível</AlertTitle>
                  <AlertDescription className="mt-1 text-slate-300">Não foi possível carregar os convênios. Tente novamente em instantes.</AlertDescription>
                </Alert>
              ) : data && data.items.length > 0 ? (
                <>
                  <div className="grid gap-4 xl:grid-cols-2">{data.items.map((institution) => <InstitutionCard key={institution.externalId} institution={institution} />)}</div>
                  <InstitutionsPagination filters={filters} total={data.total} pageSize={data.pageSize} />
                </>
              ) : (
                <>
                  <Alert className="border-white/10 bg-white/[0.035] p-6 text-slate-100">
                    <Building2 aria-hidden="true" />
                    <AlertTitle>Nenhum convênio nesta busca</AlertTitle>
                    <AlertDescription className="mt-1 text-slate-300">Revise os termos ou consulte todos os registros publicados.</AlertDescription>
                    <Button nativeButton={false} render={<Link href="/instituicoes" />} variant="ghost" className="col-start-2 mt-3 w-fit px-0 text-sky-300 hover:bg-transparent hover:text-sky-200">Limpar filtros <ArrowRight aria-hidden="true" /></Button>
                  </Alert>
                  {data && data.total > 0 && <InstitutionsPagination filters={filters} total={data.total} pageSize={data.pageSize} />}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
