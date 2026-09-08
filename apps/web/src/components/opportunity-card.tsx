import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Opportunity } from "@/lib/api";
import { formatDeadline, statusLabel } from "@/lib/opportunities";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const open = opportunity.status?.toLowerCase() === "open";
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-0 transition-colors hover:bg-white/[0.055]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={open ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.06] text-slate-300"}>{statusLabel(opportunity.status)}</Badge>
          {opportunity.kind && <Badge variant="outline" className="border-sky-300/20 text-sky-200">{opportunity.kind}</Badge>}
        </div>
        <CardTitle className="mt-3 text-xl text-slate-50"><h3>{opportunity.title}</h3></CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <p className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /><span><span className="block text-xs text-slate-400">Prazo</span>{formatDeadline(opportunity.applicationDeadline, opportunity.deadlineText)}</span></p>
        <p className="flex items-start gap-2"><Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /><span><span className="block text-xs text-slate-400">Público</span>{opportunity.audience ?? "Consulte o edital"}</span></p>
      </CardContent>
      <CardFooter className="border-white/10 bg-transparent">
        <Button nativeButton={false} render={<Link href={`/oportunidades/${encodeURIComponent(opportunity.externalId)}`} />} variant="ghost" className="ml-auto text-sky-300 hover:bg-sky-300/10 hover:text-sky-200">Ver detalhes <ArrowRight aria-hidden="true" /></Button>
      </CardFooter>
    </Card>
  );
}
