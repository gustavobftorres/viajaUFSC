import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function OpportunityDetailLoading() {
  return <div className="min-h-screen bg-[#050b18]"><SiteHeader /><main className="mx-auto max-w-5xl px-5 py-12 lg:px-8" aria-label="Carregando oportunidade"><Skeleton className="h-9 w-52 bg-white/10" /><Skeleton className="mt-12 h-7 w-32 bg-white/10" /><Skeleton className="mt-6 h-32 w-full bg-white/10" /><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]"><Skeleton className="h-80 bg-white/10" /><Skeleton className="h-72 bg-white/10" /></div></main></div>;
}
