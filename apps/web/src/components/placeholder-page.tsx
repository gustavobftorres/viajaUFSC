import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PlaceholderPage({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="flex min-h-screen flex-col bg-[#050b18] text-white"><SiteHeader /><main className="grid-field flex flex-1 items-center px-5 py-24 lg:px-8"><div className="mx-auto w-full max-w-4xl"><Badge variant="outline" className="border-sky-300/20 bg-sky-300/[0.06] text-sky-200">{eyebrow}</Badge><h1 className="mt-6 max-w-3xl font-heading text-5xl tracking-[-0.04em] sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">{description}</p><Button nativeButton={false} render={<Link href="/" />} variant="outline" size="lg" className="mt-9 rounded-full border-white/15 bg-white/[0.04] text-white hover:bg-white/10"><ArrowLeft aria-hidden="true" /> Voltar para o início</Button></div></main><SiteFooter /></div>;
}
