import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="grid flex-1 place-items-center px-5 py-20">
        <Card className="max-w-xl border-white/10 bg-white/[0.035] text-center text-white ring-0">
          <CardContent className="p-8 sm:p-12">
            <SearchX aria-hidden="true" className="mx-auto size-10 text-sky-300" />
            <p className="eyebrow mt-5">Erro 404</p>
            <h1 className="mt-3 font-heading text-4xl">Página não encontrada</h1>
            <p className="mt-4 leading-7 text-slate-400">O endereço pode estar incorreto ou a página pode ter mudado. Volte ao início para continuar explorando.</p>
            <Button nativeButton={false} render={<Link href="/" />} className="mt-8 rounded-full bg-white text-slate-950 hover:bg-sky-100"><ArrowLeft aria-hidden="true" />Voltar ao início</Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
