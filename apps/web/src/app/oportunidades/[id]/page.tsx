import type { Metadata } from "next";
import { cache, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, FileText, Users } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, fetchOpportunity, type Opportunity } from "@/lib/api";
import { formatDeadline, statusLabel } from "@/lib/opportunities";

type Props = { params: Promise<{ id: string }> };
const getOpportunity = cache((id: string) => fetchOpportunity(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const opportunity = await getOpportunity((await params).id);
    return { title: opportunity.title, description: opportunity.body?.slice(0, 155) ?? `Detalhes da oportunidade ${opportunity.title}.` };
  } catch { return { title: "Detalhe da oportunidade" }; }
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-sky-300">{icon}</span><div><dt className="text-xs tracking-wide text-slate-400 uppercase">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-200">{value ?? "Não informado"}</dd></div></div>;
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { id } = await params;
  let opportunity: Opportunity;
  try { opportunity = await getOpportunity(id); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  const externalUrl = opportunity.canonicalUrl ?? opportunity.sourceUrl;
  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex-1 px-5 pb-20 pt-10 lg:px-8">
        <article className="mx-auto max-w-5xl">
          <Button nativeButton={false} render={<Link href="/oportunidades" />} variant="ghost" className="-ml-3 text-slate-300 hover:bg-white/[0.05] hover:text-white"><ArrowLeft aria-hidden="true" />Voltar às oportunidades</Button>
          <div className="mt-10 border-b border-white/10 pb-10"><div className="flex flex-wrap gap-2"><Badge className={opportunity.status?.toLowerCase() === "open" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.06] text-slate-300"}>{statusLabel(opportunity.status)}</Badge>{opportunity.kind && <Badge variant="outline" className="border-sky-300/20 text-sky-200">{opportunity.kind}</Badge>}</div><h1 className="mt-6 max-w-4xl font-heading text-4xl leading-tight tracking-[-0.035em] sm:text-6xl">{opportunity.title}</h1>{opportunity.program && <p className="mt-5 text-lg text-sky-200">{opportunity.program}</p>}</div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-8"><Card className="border-white/10 bg-white/[0.035] text-white ring-0"><CardHeader><CardTitle className="font-sans text-xl"><h2 className="flex items-center gap-2"><FileText aria-hidden="true" className="size-5 text-sky-300" />Sobre a oportunidade</h2></CardTitle></CardHeader><CardContent><p className="whitespace-pre-line text-base leading-8 text-slate-300">{opportunity.body ?? "A fonte não publicou uma descrição estruturada para esta oportunidade. Consulte o edital original para informações completas."}</p></CardContent></Card>{externalUrl && <Button nativeButton={false} render={<a href={externalUrl} target="_blank" rel="noreferrer" />} size="lg" className="rounded-full bg-white text-slate-950 hover:bg-sky-100">Consultar fonte oficial <span className="sr-only">(abre em nova aba)</span><ArrowUpRight aria-hidden="true" /></Button>}</div>
            <Card className="h-fit border-white/10 bg-[#081426] text-white ring-0"><CardHeader><CardTitle className="font-sans text-base"><h2>Resumo</h2></CardTitle></CardHeader><CardContent><dl className="space-y-6"><Info icon={<CalendarDays aria-hidden="true" className="size-4" />} label="Prazo" value={formatDeadline(opportunity.applicationDeadline, opportunity.deadlineText)} /><Info icon={<Users aria-hidden="true" className="size-4" />} label="Público" value={opportunity.audience} /><Info icon={<Clock3 aria-hidden="true" className="size-4" />} label="Atualização da fonte" value={opportunity.modifiedAt} /></dl><p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">Identificador da fonte: <span className="break-all text-slate-300">{opportunity.externalId}</span></p></CardContent></Card>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
