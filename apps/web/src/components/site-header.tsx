"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/instituicoes", label: "Instituições" },
  { href: "/sobre-os-dados", label: "Sobre os dados" },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-30 border-b border-white/10 bg-[#050b18]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <span className="flex size-8 items-center justify-center rounded-lg border border-sky-300/30 bg-sky-400/10 text-sky-300"><Compass aria-hidden="true" className="size-4" /></span>
          viaja<span className="text-sky-300">UFSC</span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10 md:hidden" aria-label="Abrir menu" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent showCloseButton={false} className="border-white/10 bg-[#081426] p-0 text-white md:hidden">
              <SheetHeader className="border-b border-white/10 p-5 pr-16">
                <SheetTitle className="text-lg text-white">Navegação</SheetTitle>
                <SheetDescription className="text-slate-400">Explore o catálogo viajaUFSC.</SheetDescription>
              </SheetHeader>
              <SheetClose render={<Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Fechar menu" />}>
                <X aria-hidden="true" />
              </SheetClose>
              <nav aria-label="Navegação móvel" className="flex flex-col gap-2 p-5">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-slate-200 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">{item.label}</Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Button nativeButton={false} render={<Link href="/oportunidades" />} size="lg" className="hidden h-9 rounded-full bg-white px-4 text-[#06101f] hover:bg-sky-100 md:inline-flex">Explorar <ArrowUpRight aria-hidden="true" /></Button>
        </div>
      </div>
    </header>
  );
}
