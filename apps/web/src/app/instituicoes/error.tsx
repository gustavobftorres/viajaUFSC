"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstitutionsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className="flex min-h-screen items-center bg-[#050b18] px-5 text-white">
      <div className="mx-auto max-w-xl text-center">
        <AlertTriangle aria-hidden="true" className="mx-auto size-8 text-amber-300" />
        <h1 className="mt-6 font-heading text-4xl">Não foi possível abrir o catálogo.</h1>
        <p className="mt-4 text-slate-400">Tente novamente. Se o problema continuar, volte à página inicial.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={reset} className="bg-white text-slate-950 hover:bg-sky-100">Tentar novamente</Button><Button nativeButton={false} render={<Link href="/" />} variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10">Ir para o início</Button></div>
      </div>
    </main>
  );
}
