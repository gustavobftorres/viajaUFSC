"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OpportunitiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[#050b18] px-5 text-white"><Card className="max-w-xl border-white/10 bg-white/[0.035] text-center text-white ring-0"><CardContent className="p-8 sm:p-12"><AlertTriangle aria-hidden="true" className="mx-auto size-10 text-amber-300" /><h1 className="mt-5 font-heading text-4xl">Não foi possível abrir esta página</h1><p className="mt-4 leading-7 text-slate-400">Tente novamente. Se o problema continuar, volte ao catálogo.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={reset} className="bg-white text-slate-950 hover:bg-sky-100"><RotateCcw aria-hidden="true" />Tentar novamente</Button><Button nativeButton={false} render={<Link href="/oportunidades" />} variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10">Voltar ao catálogo</Button></div></CardContent></Card></main>;
}
