"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="grid flex-1 place-items-center px-5 py-20">
        <Card className="max-w-xl border-white/10 bg-white/[0.035] text-center text-white ring-0">
          <CardContent className="p-8 sm:p-12">
            <AlertTriangle aria-hidden="true" className="mx-auto size-10 text-amber-300" />
            <h1 className="mt-5 font-heading text-4xl">Algo saiu do percurso</h1>
            <p className="mt-4 leading-7 text-slate-400">Tente carregar a página novamente. Se o problema continuar, volte ao início.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={reset} className="bg-white text-slate-950 hover:bg-sky-100"><RotateCcw aria-hidden="true" />Tentar novamente</Button>
              <Button nativeButton={false} render={<Link href="/" />} variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10"><Home aria-hidden="true" />Ir ao início</Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
