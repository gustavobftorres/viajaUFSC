import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstitutionsLoading() {
  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <p className="sr-only">Carregando convênios</p>
        <Skeleton className="h-6 w-36 bg-white/10" />
        <Skeleton className="mt-6 h-16 max-w-2xl bg-white/10" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[18rem_1fr]"><Skeleton className="h-[32rem] bg-white/10" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-64 bg-white/10" />)}</div></div>
      </main>
    </div>
  );
}
