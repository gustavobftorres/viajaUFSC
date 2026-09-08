import Link from "next/link";
import { ArrowRight, BookOpen, Globe2, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Institution } from "@/lib/api";
import { exchangeLabel } from "@/lib/institutions";

export function InstitutionCard({ institution }: { institution: Institution }) {
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-0 transition-colors hover:bg-white/[0.055]">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-sky-300/20 text-sky-200">{institution.continent}</Badge>
          {institution.agreementType && <Badge className="border-white/10 bg-white/[0.06] text-slate-300">{institution.agreementType}</Badge>}
        </div>
        <CardTitle className="mt-3 text-xl text-slate-50"><h3>{institution.name}</h3></CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <p className="flex items-start gap-2"><Globe2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /><span><span className="block text-xs text-slate-400">Localização</span>{institution.country ?? "País não informado"}</span></p>
        <p className="flex items-start gap-2"><BookOpen aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /><span><span className="block text-xs text-slate-400">Área</span>{institution.subjectArea ?? "Área não informada"}</span></p>
        <p className="flex items-start gap-2 sm:col-span-2"><Plane aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /><span><span className="block text-xs text-slate-400">Intercâmbio</span>{exchangeLabel(institution.exchangeAvailable)}</span></p>
      </CardContent>
      <CardFooter className="border-white/10 bg-transparent">
        <Button nativeButton={false} render={<Link href={`/instituicoes/${encodeURIComponent(institution.externalId)}`} />} variant="ghost" className="ml-auto text-sky-300 hover:bg-sky-300/10 hover:text-sky-200">Ver convênio <ArrowRight aria-hidden="true" /></Button>
      </CardFooter>
    </Card>
  );
}
