import Form from "next/form";
import Link from "next/link";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpportunityFilters as Filters } from "@/lib/api";
import { opportunitiesHref } from "@/lib/opportunities";

export function OpportunityFilters({ filters }: { filters: Filters }) {
  const activeStatus = filters.status;
  return (
    <Card className="border-white/10 bg-[#081426]/90 text-white ring-0">
      <CardHeader className="border-b border-white/10"><CardTitle className="flex items-center gap-2 font-sans text-base"><Filter aria-hidden="true" className="size-4 text-sky-300" />Refinar resultados</CardTitle></CardHeader>
      <CardContent>
        <Label className="mb-3 text-slate-200">Status</Label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Filtrar por status">
          {[
            { value: undefined, label: "Todas" },
            { value: "open" as const, label: "Abertas" },
            { value: "closed" as const, label: "Encerradas" },
          ].map((option) => <Button key={option.label} aria-pressed={activeStatus === option.value} nativeButton={false} render={<Link href={opportunitiesHref({ ...filters, status: option.value }, 1)} />} variant={activeStatus === option.value ? "default" : "outline"} size="sm" className={activeStatus === option.value ? "bg-sky-200 text-slate-950 hover:bg-sky-100" : "border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/10"}>{option.label}</Button>)}
        </div>
        <Form action="/oportunidades" className="mt-6 space-y-4">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <div className="space-y-2"><Label htmlFor="deadline-from">Prazo a partir de</Label><Input key={filters.deadlineFrom ?? "empty-from"} id="deadline-from" name="deadline_from" type="date" defaultValue={filters.deadlineFrom ?? ""} className="h-10 border-white/15 bg-white/[0.04] text-white scheme-dark" /></div>
          <div className="space-y-2"><Label htmlFor="deadline-to">Prazo até</Label><Input key={filters.deadlineTo ?? "empty-to"} id="deadline-to" name="deadline_to" type="date" defaultValue={filters.deadlineTo ?? ""} className="h-10 border-white/15 bg-white/[0.04] text-white scheme-dark" /></div>
          <div className="flex gap-2 pt-1"><Button type="submit" className="flex-1 bg-white text-slate-950 hover:bg-sky-100"><Search aria-hidden="true" />Aplicar</Button><Button nativeButton={false} render={<Link href="/oportunidades" aria-label="Limpar filtros" />} variant="outline" size="icon" className="border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/10"><RotateCcw aria-hidden="true" /></Button></div>
        </Form>
        <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">Busca por continente, país, área e disponibilidade de intercâmbio está no <Link href="/instituicoes" className="text-sky-300 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-200">catálogo de instituições</Link>, conforme os dados disponíveis na API.</p>
      </CardContent>
    </Card>
  );
}
