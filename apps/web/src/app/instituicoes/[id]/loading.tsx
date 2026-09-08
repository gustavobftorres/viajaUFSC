import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstitutionDetailLoading() {
  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <p className="sr-only">Carregando detalhes do convênio</p>
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="mt-12 h-6 w-32 bg-white/10" />
        <Skeleton className="mt-5 h-20 max-w-3xl bg-white/10" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_20rem]"><Skeleton className="h-72 bg-white/10" /><Skeleton className="h-[32rem] bg-white/10" /></div>
      </main>
    </div>
  );
}
