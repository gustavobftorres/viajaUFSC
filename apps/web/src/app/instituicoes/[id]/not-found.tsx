import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function InstitutionNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex flex-1 items-center px-5 py-20 lg:px-8">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center sm:p-12">
          <Building2 aria-hidden="true" className="mx-auto size-8 text-sky-300" />
          <p className="eyebrow mt-6">Registro não encontrado</p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight">Este convênio não está no catálogo.</h1>
          <p className="mt-4 text-base leading-7 text-slate-400">O endereço pode estar incorreto ou o registro pode ter mudado na fonte.</p>
          <Button nativeButton={false} render={<Link href="/instituicoes" />} className="mt-8 rounded-full bg-white text-slate-950 hover:bg-sky-100"><ArrowLeft aria-hidden="true" />Voltar aos convênios</Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
