import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, FileSearch, MapPinned, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const faqs = [
  { question: "Os dados são oficiais?", answer: "O viajaUFSC organiza informações publicadas pela SINTER/UFSC e sempre preserva o link para a fonte consultada. Antes de se inscrever, confirme regras e prazos no documento oficial." },
  { question: "O viajaUFSC realiza inscrições?", answer: "Não. O catálogo facilita a descoberta e leva você à publicação original da SINTER, onde ficam as orientações e os canais oficiais." },
  { question: "Com que frequência as informações mudam?", answer: "O coletor acompanha as páginas públicas da SINTER. Cada registro mantém sua fonte e a data de atualização para deixar a proveniência explícita." },
];

export function HomeContent({ catalog }: { catalog: ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050b18] text-slate-100">
      <SiteHeader />
      <main id="conteudo">
        <section className="grid-field relative px-5 pb-16 pt-20 sm:pt-24 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="hero-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl text-center">
            <Badge variant="outline" className="rounded-full border-sky-300/20 bg-sky-300/[0.06] px-3 py-1.5 text-sm text-sky-200">Dados públicos da internacionalização UFSC</Badge>
            <h1 className="mx-auto mt-7 max-w-4xl font-heading text-5xl leading-[0.98] font-medium tracking-[-0.045em] text-balance text-white sm:text-6xl lg:text-[5.25rem]">Seu próximo destino acadêmico começa com informação clara.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Descubra oportunidades de intercâmbio e explore instituições parceiras da UFSC em um catálogo simples, rastreável e feito para decidir melhor.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button nativeButton={false} render={<Link href="/oportunidades" />} size="lg" className="h-12 rounded-full bg-sky-300 px-6 text-base text-[#06101f] hover:bg-sky-200">Ver oportunidades <ArrowRight aria-hidden="true" /></Button>
              <Button nativeButton={false} render={<Link href="/instituicoes" />} size="lg" variant="outline" className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-white hover:bg-white/10">Explorar instituições</Button>
            </div>
          </div>
          <div className="relative mx-auto mt-16 max-w-6xl lg:mt-20"><div className="absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_65%)]" aria-hidden="true" />{catalog}</div>
        </section>

        <section className="border-y border-white/10 bg-[#07101f] px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="caminhos-title">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="eyebrow">Comece por onde faz sentido</p><h2 id="caminhos-title" className="mt-4 font-heading text-4xl tracking-[-0.03em] text-white sm:text-5xl">Dois caminhos, uma decisão mais segura.</h2><p className="mt-5 text-base leading-7 text-slate-400">Procure um edital para agir agora ou entenda o mapa de parcerias antes de planejar sua experiência.</p></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <PathCard icon={<FileSearch />} title="Oportunidades" description="Veja chamadas, cursos e editais. Entenda público, status e prazo antes de consultar a publicação oficial." href="/oportunidades" link="Encontrar uma oportunidade" accent="sky" />
              <PathCard icon={<MapPinned />} title="Instituições parceiras" description="Explore acordos por continente, país e área acadêmica para entender onde a UFSC mantém conexões." href="/instituicoes" link="Explorar instituições" accent="indigo" />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="transparencia-title">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div><p className="eyebrow">Transparência por padrão</p><h2 id="transparencia-title" className="mt-4 font-heading text-4xl tracking-[-0.03em] text-white sm:text-5xl">Informação organizada, sem esconder a origem.</h2><p className="mt-6 text-base leading-7 text-slate-400">O viajaUFSC não substitui a SINTER. Ele transforma publicações dispersas em um ponto de partida legível e mantém a rota de volta para a fonte oficial.</p><Button nativeButton={false} render={<Link href="/sobre-os-dados" />} variant="outline" className="mt-7 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10">Como tratamos os dados <ExternalLink aria-hidden="true" /></Button></div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {[{ icon: ShieldCheck, title: "Fonte visível", text: "Cada item preserva o endereço da publicação consultada." }, { icon: Building2, title: "Contexto acadêmico", text: "Instituições, acordos e áreas aparecem com seus campos disponíveis." }, { icon: FileSearch, title: "Leitura responsável", text: "Ausência de dado é mostrada como ausência, sem inferências indevidas." }].map(({ icon: Icon, title, text }) => <div key={title} className="bg-[#081426] p-6 sm:p-7"><Icon aria-hidden="true" className="size-5 text-sky-300" /><h3 className="mt-8 font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#07101f] px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="eyebrow">Perguntas frequentes</p><h2 id="faq-title" className="mt-4 font-heading text-4xl tracking-[-0.03em] text-white">Antes de planejar, vale saber.</h2></div>
            <Accordion className="rounded-2xl border border-white/10 px-5 sm:px-7">{faqs.map((item) => <AccordionItem key={item.question} value={item.question} className="border-white/10"><AccordionTrigger className="py-5 text-base text-white hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="pb-5 text-base leading-7 text-slate-400">{item.answer}</AccordionContent></AccordionItem>)}</Accordion>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(99,102,241,0.06))] px-6 py-16 text-center sm:px-12"><div className="hero-glow opacity-60" aria-hidden="true" /><div className="relative"><p className="eyebrow">Seu próximo passo</p><h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl tracking-[-0.035em] text-white sm:text-5xl">Encontre uma possibilidade que combina com o seu momento.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">Comece pelas oportunidades que estão abertas e confirme os detalhes diretamente na fonte.</p><Button nativeButton={false} render={<Link href="/oportunidades" />} size="lg" className="mt-8 h-12 rounded-full bg-white px-6 text-base text-[#06101f] hover:bg-sky-100">Explorar oportunidades <ArrowRight aria-hidden="true" /></Button></div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PathCard({ icon, title, description, href, link, accent }: { icon: ReactNode; title: string; description: string; href: string; link: string; accent: "sky" | "indigo" }) {
  const color = accent === "sky" ? "border-sky-300/20 bg-sky-300/10 text-sky-300" : "border-indigo-300/20 bg-indigo-300/10 text-indigo-300";
  return <Card className="group border-white/10 bg-white/[0.035] py-0 text-white shadow-none transition-colors hover:border-sky-300/25 hover:bg-white/[0.055]"><CardHeader className="p-7 sm:p-9"><div className={`mb-8 flex size-11 items-center justify-center rounded-xl border ${color}`} aria-hidden="true">{icon}</div><CardTitle className="font-heading text-3xl font-medium">{title}</CardTitle><CardDescription className="max-w-lg text-base leading-7 text-slate-400">{description}</CardDescription></CardHeader><CardContent className="px-7 pb-8 sm:px-9"><Button nativeButton={false} render={<Link href={href} />} variant="link" className="px-0 text-sky-300">{link} <ArrowRight aria-hidden="true" /></Button></CardContent></Card>;
}
