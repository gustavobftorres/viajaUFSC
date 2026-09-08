import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight, Compass } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity-card";
import { OpportunityFilters } from "@/components/opportunity-filters";
import { OpportunitiesPagination } from "@/components/opportunities-pagination";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, fetchOpportunities, type OpportunityPage } from "@/lib/api";
import { parseOpportunityFilters, type OpportunitySearchParams } from "@/lib/opportunities";

export const metadata: Metadata = { title: "Oportunidades", description: "Consulte editais e oportunidades de mobilidade acadêmica publicados pela SINTER." };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<OpportunitySearchParams> }) {
  const filters = parseOpportunityFilters(await searchParams);
  let data: OpportunityPage | null = null;
  let unavailable = false;
  try { data = await fetchOpportunities(filters); }
  catch (error) { unavailable = error instanceof ApiError; if (!unavailable) throw error; }

  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex-1 px-5 pb-20 pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><Badge variant="outline" className="border-sky-300/20 bg-sky-300/[0.06] text-sky-200">Catálogo SINTER</Badge><h1 className="mt-5 font-heading text-4xl tracking-[-0.04em] sm:text-6xl">Oportunidades para atravessar fronteiras.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Explore editais, confira o prazo e abra cada oportunidade para entender os dados publicados pela SINTER.</p></div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start">
            <aside><OpportunityFilters filters={filters} /></aside>
            <section aria-labelledby="resultados-title">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Resultados</p><h2 id="resultados-title" className="mt-2 text-2xl font-semibold">Editais e chamadas</h2></div>{data && <p className="text-sm text-slate-400"><strong className="font-semibold text-white">{data.total}</strong> {data.total === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}</p>}</div>
              {unavailable ? <Alert className="border-amber-200/20 bg-amber-200/[0.06] p-5 text-slate-100"><AlertCircle aria-hidden="true" /><AlertTitle>Catálogo temporariamente indisponível</AlertTitle><AlertDescription className="mt-1 text-slate-300">Não foi possível carregar as oportunidades. Tente novamente em instantes.</AlertDescription></Alert> : data && data.items.length > 0 ? <><div className="grid gap-4 xl:grid-cols-2">{data.items.map((opportunity) => <OpportunityCard key={opportunity.externalId} opportunity={opportunity} />)}</div><OpportunitiesPagination filters={filters} total={data.total} pageSize={data.pageSize} /></> : <><Alert className="border-white/10 bg-white/[0.035] p-6 text-slate-100"><Compass aria-hidden="true" /><AlertTitle>Nenhuma oportunidade nesta página</AlertTitle><AlertDescription className="mt-1 text-slate-300">Remova algum filtro ou consulte todas as oportunidades publicadas.</AlertDescription><Button nativeButton={false} render={<Link href="/oportunidades" />} variant="ghost" className="col-start-2 mt-3 w-fit px-0 text-sky-300 hover:bg-transparent hover:text-sky-200">Limpar filtros <ArrowRight aria-hidden="true" /></Button></Alert>{data && data.total > 0 && <OpportunitiesPagination filters={filters} total={data.total} pageSize={data.pageSize} />}</>}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
