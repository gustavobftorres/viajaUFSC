import type { Metadata } from "next";
import { cache, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, CalendarRange, Clock3, FileText, Globe2, Plane } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, fetchInstitution, type Institution } from "@/lib/api";
import { exchangeLabel, formatAgreementPeriod, formatSourceTimestamp } from "@/lib/institutions";

type Props = { params: Promise<{ id: string }> };
const getInstitution = cache((id: string) => fetchInstitution(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const institution = await getInstitution((await params).id);
    return {
      title: institution.name,
      description: `Convênio da ${institution.name}${institution.country ? ` em ${institution.country}` : ""}, conforme dados da SINTER.`,
    };
  } catch {
    return { title: "Detalhe do convênio" };
  }
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-sky-300">{icon}</span><div><dt className="text-xs tracking-wide text-slate-400 uppercase">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-200">{value}</dd></div></div>;
}

export default async function InstitutionDetailPage({ params }: Props) {
  const { id } = await params;
  let institution: Institution;
  try {
    institution = await getInstitution(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const officialUrl = institution.canonicalUrl ?? institution.sourceUrl;

  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex-1 px-5 pb-20 pt-10 lg:px-8">
        <article className="mx-auto max-w-5xl">
          <Button nativeButton={false} render={<Link href="/instituicoes" />} variant="ghost" className="-ml-3 text-slate-300 hover:bg-white/[0.05] hover:text-white"><ArrowLeft aria-hidden="true" />Voltar aos convênios</Button>

          <div className="mt-10 border-b border-white/10 pb-10">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-sky-300/20 text-sky-200">{institution.continent}</Badge>
              {institution.agreementType && <Badge className="border-white/10 bg-white/[0.06] text-slate-300">{institution.agreementType}</Badge>}
            </div>
            <p className="eyebrow mt-6">Registro de convênio</p>
            <h1 className="mt-3 max-w-4xl font-heading text-4xl leading-tight tracking-[-0.035em] sm:text-6xl">{institution.name}</h1>
            {institution.country && <p className="mt-5 text-lg text-sky-200">{institution.country}</p>}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-8">
              <Card className="border-white/10 bg-white/[0.035] text-white ring-0">
                <CardHeader><CardTitle className="font-sans text-xl"><h2 className="flex items-center gap-2"><FileText aria-hidden="true" className="size-5 text-sky-300" />Informações publicadas</h2></CardTitle></CardHeader>
                <CardContent><p className="whitespace-pre-line text-base leading-8 text-slate-300">{institution.details ?? "A fonte não publicou observações adicionais estruturadas para este convênio. Consulte a página oficial para confirmar condições e vigência."}</p></CardContent>
              </Card>
              {officialUrl && <Button nativeButton={false} render={<a href={officialUrl} target="_blank" rel="noreferrer" />} size="lg" className="rounded-full bg-white text-slate-950 hover:bg-sky-100">Consultar fonte oficial <span className="sr-only">(abre em nova aba)</span><ArrowUpRight aria-hidden="true" /></Button>}
            </div>

            <Card className="h-fit border-white/10 bg-[#081426] text-white ring-0">
              <CardHeader><CardTitle className="font-sans text-base"><h2>Resumo do convênio</h2></CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-6">
                  <Info icon={<Building2 aria-hidden="true" className="size-4" />} label="Instituição" value={institution.name} />
                  <Info icon={<Globe2 aria-hidden="true" className="size-4" />} label="Localização" value={[institution.country, institution.continent].filter(Boolean).join(", ")} />
                  <Info icon={<BookOpen aria-hidden="true" className="size-4" />} label="Área acadêmica" value={institution.subjectArea ?? "Não informada"} />
                  <Info icon={<Plane aria-hidden="true" className="size-4" />} label="Intercâmbio" value={exchangeLabel(institution.exchangeAvailable)} />
                  <Info icon={<CalendarRange aria-hidden="true" className="size-4" />} label="Vigência" value={formatAgreementPeriod(institution.startDate, institution.endDate)} />
                  <Info icon={<Clock3 aria-hidden="true" className="size-4" />} label="No catálogo desde" value={formatSourceTimestamp(institution.firstSeenAt)} />
                  <Info icon={<Clock3 aria-hidden="true" className="size-4" />} label="Atualizado no catálogo" value={formatSourceTimestamp(institution.updatedAt)} />
                </dl>
                <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">Identificador do registro: <span className="break-all text-slate-300">{institution.externalId}</span></p>
              </CardContent>
            </Card>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
