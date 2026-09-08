import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="bg-[#050b18] px-5 pb-8 text-slate-400 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Separator className="bg-white/10" />
        <div className="flex flex-col gap-5 pt-7 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p><span className="font-semibold text-white">viajaUFSC</span> · Uma forma mais clara de consultar dados públicos.</p>
          <nav aria-label="Navegação do rodapé" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="hover:text-white" href="/oportunidades">Oportunidades</Link>
            <Link className="hover:text-white" href="/instituicoes">Instituições</Link>
            <Link className="hover:text-white" href="/sobre-os-dados">Sobre</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
