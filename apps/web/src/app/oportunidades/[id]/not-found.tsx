import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OpportunityNotFound() {
  return <div className="flex min-h-screen flex-col bg-[#050b18] text-white"><SiteHeader /><main id="conteudo" className="grid flex-1 place-items-center px-5 py-20"><Card className="max-w-xl border-white/10 bg-white/[0.035] text-center text-white ring-0"><CardContent className="p-8 sm:p-12"><SearchX aria-hidden="true" className="mx-auto size-10 text-sky-300" /><h1 className="mt-5 font-heading text-4xl">Oportunidade não encontrada</h1><p className="mt-4 leading-7 text-slate-400">O item pode ter sido removido ou o endereço está incorreto. Volte ao catálogo para continuar a busca.</p><Button nativeButton={false} render={<Link href="/oportunidades" />} className="mt-8 rounded-full bg-white text-slate-950 hover:bg-sky-100"><ArrowLeft aria-hidden="true" />Voltar ao catálogo</Button></CardContent></Card></main><SiteFooter /></div>;
}
