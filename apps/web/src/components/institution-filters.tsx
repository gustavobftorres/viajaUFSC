"use client";

import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InstitutionFilters as Filters } from "@/lib/api";
import { institutionsHref } from "@/lib/institutions";

export function InstitutionFilters({ filters }: { filters: Filters }) {
  const availability = filters.exchangeAvailable;
  const [continent, setContinent] = useState(filters.continent ?? "");
  const [country, setCountry] = useState(filters.country ?? "");
  const [subjectArea, setSubjectArea] = useState(filters.subjectArea ?? "");
  return (
    <Card className="border-white/10 bg-[#081426]/90 text-white ring-0">
      <CardHeader className="border-b border-white/10"><CardTitle className="flex items-center gap-2 font-sans text-base"><Filter aria-hidden="true" className="size-4 text-sky-300" />Refinar resultados</CardTitle></CardHeader>
      <CardContent>
        <Form action="/instituicoes" className="space-y-4">
          {typeof availability === "boolean" && <input type="hidden" name="exchange_available" value={String(availability)} />}
          <div className="space-y-2"><Label htmlFor="continent">Continente</Label><Input id="continent" name={continent.trim() ? "continent" : undefined} value={continent} onChange={(event) => setContinent(event.target.value)} placeholder="Ex.: Europa" maxLength={120} className="h-10 border-white/15 bg-white/[0.04] text-white placeholder:text-slate-400" /></div>
          <div className="space-y-2"><Label htmlFor="country">País</Label><Input id="country" name={country.trim() ? "country" : undefined} value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Ex.: Portugal" maxLength={120} className="h-10 border-white/15 bg-white/[0.04] text-white placeholder:text-slate-400" /></div>
          <div className="space-y-2"><Label htmlFor="subject-area">Área acadêmica</Label><Input id="subject-area" name={subjectArea.trim() ? "subject_area" : undefined} value={subjectArea} onChange={(event) => setSubjectArea(event.target.value)} placeholder="Ex.: Engenharia" maxLength={120} className="h-10 border-white/15 bg-white/[0.04] text-white placeholder:text-slate-400" /></div>
          <div className="flex gap-2 pt-1"><Button type="submit" className="flex-1 bg-white text-slate-950 hover:bg-sky-100"><Search aria-hidden="true" />Aplicar</Button><Button nativeButton={false} render={<Link href="/instituicoes" aria-label="Limpar filtros" />} variant="outline" size="icon" className="border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/10"><RotateCcw aria-hidden="true" /></Button></div>
        </Form>

        <div className="mt-6 border-t border-white/10 pt-5">
          <Label className="mb-3 text-slate-200">Intercâmbio</Label>
          <div className="grid gap-2" role="group" aria-label="Filtrar por disponibilidade de intercâmbio">
            {[
              { value: undefined, label: "Todos (inclui não informado)" },
              { value: true, label: "Disponível" },
              { value: false, label: "Não disponível" },
            ].map((option) => (
              <Button key={option.label} aria-pressed={availability === option.value} nativeButton={false} render={<Link href={institutionsHref({ ...filters, exchangeAvailable: option.value }, 1)} />} variant={availability === option.value ? "default" : "outline"} size="sm" className={availability === option.value ? "justify-start bg-sky-200 text-slate-950 hover:bg-sky-100" : "justify-start border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/10"}>{option.label}</Button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">“Não informado” aparece nos resultados gerais, mas a API ainda não permite filtrá-lo isoladamente.</p>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">Continente e país exigem correspondência exata. A área aceita parte do nome. Os campos livres evitam sugerir uma lista de opções incompleta.</p>
      </CardContent>
    </Card>
  );
}
