import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function OpportunitiesLoading() {
  return <div className="min-h-screen bg-[#050b18] text-white"><SiteHeader /><main id="conteudo" className="mx-auto max-w-7xl px-5 py-16 lg:px-8" aria-label="Carregando oportunidades"><Skeleton className="h-7 w-36 bg-white/10" /><Skeleton className="mt-5 h-14 max-w-2xl bg-white/10" /><Skeleton className="mt-4 h-6 max-w-xl bg-white/10" /><div className="mt-12 grid gap-8 lg:grid-cols-[18rem_1fr]"><Skeleton className="h-96 bg-white/10" /><div className="grid gap-4 xl:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-64 bg-white/10" />)}</div></div></main></div>;
}
