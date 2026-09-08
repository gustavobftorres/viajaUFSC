import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpportunityFilters } from "@/lib/api";
import { opportunitiesHref } from "@/lib/opportunities";

export function OpportunitiesPagination({ filters, total, pageSize }: { filters: OpportunityFilters; total: number; pageSize: number }) {
  const page = filters.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginação de oportunidades" className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
      {page > 1 ? <Button nativeButton={false} render={<Link href={opportunitiesHref(filters, page - 1)} />} variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10"><ArrowLeft aria-hidden="true" />Anterior</Button> : <Button variant="outline" disabled className="border-white/15 bg-white/[0.03] text-white"><ArrowLeft aria-hidden="true" />Anterior</Button>}
      <p className="text-sm text-slate-300">Página <strong className="text-white">{page}</strong> de <strong className="text-white">{pages}</strong></p>
      {page < pages ? <Button nativeButton={false} render={<Link href={opportunitiesHref(filters, page + 1)} />} variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10">Próxima<ArrowRight aria-hidden="true" /></Button> : <Button variant="outline" disabled className="border-white/15 bg-white/[0.03] text-white">Próxima<ArrowRight aria-hidden="true" /></Button>}
    </nav>
  );
}
