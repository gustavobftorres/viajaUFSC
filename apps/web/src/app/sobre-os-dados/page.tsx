import type { Metadata } from "next";
import { ArrowUpRight, Database, FileSearch, Info, RefreshCw, Server, TriangleAlert } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiBaseUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: "Sobre os dados",
  description: "Entenda a origem, o processamento e as limitações dos dados públicos exibidos pelo viajaUFSC.",
};

const stages = [
  {
    icon: FileSearch,
    title: "Coleta",
    description: "O coletor lê páginas públicas da SINTER e preserva a URL efetivamente consultada.",
  },
  {
    icon: Database,
    title: "Organização",
    description: "Os campos são normalizados e persistidos de forma idempotente em PostgreSQL.",
  },
  {
    icon: Server,
    title: "Consulta",
    description: "A API FastAPI entrega páginas, filtros e detalhes consumidos por este frontend.",
  },
];

export default function AboutDataPage() {
  const apiDocsUrl = `${getApiBaseUrl()}/api/v1/docs`;

  return (
    <div className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <SiteHeader />
      <main id="conteudo" className="flex-1 px-5 pb-24 pt-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <Badge variant="outline" className="border-sky-300/20 bg-sky-300/[0.06] text-sky-200">Transparência</Badge>
            <h1 className="mt-5 font-heading text-4xl tracking-[-0.04em] sm:text-6xl">Dados públicos, com origem e limites visíveis.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">O viajaUFSC organiza publicações da Secretaria de Relações Internacionais da UFSC para facilitar a busca. Ele não substitui editais, páginas institucionais nem a orientação oficial da Universidade.</p>
          </div>

          <section aria-labelledby="pipeline-title" className="mt-16">
            <p className="eyebrow">Como funciona</p>
            <h2 id="pipeline-title" className="mt-3 text-3xl font-semibold tracking-tight">Da publicação à tela</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {stages.map(({ icon: Icon, title, description }, index) => (
                <Card key={title} className="border-white/10 bg-white/[0.035] text-white ring-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-300/[0.08] text-sky-300"><Icon aria-hidden="true" className="size-5" /></span>
                      <span className="text-xs font-semibold tracking-[0.16em] text-slate-400">0{index + 1}</span>
                    </div>
                    <CardTitle className="pt-3 font-sans text-xl">{title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="leading-7 text-slate-300">{description}</p></CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-16 bg-white/10" />

          <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:items-start">
            <section aria-labelledby="proveniencia-title">
              <p className="eyebrow">Proveniência e atualização</p>
              <h2 id="proveniencia-title" className="mt-3 text-3xl font-semibold tracking-tight">O contexto acompanha cada registro</h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-300">
                <p>O catálogo mantém identificadores estáveis, a fonte consultada e, quando publicada, uma URL canônica do item ou da instituição. As páginas de detalhe oferecem acesso à fonte disponível para conferência.</p>
                <p><code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-sm text-sky-200">first_seen_at</code> registra a primeira observação do item no catálogo. <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-sm text-sky-200">updated_at</code> avança quando o conteúdo normalizado muda; ele não representa necessariamente a data de publicação da SINTER.</p>
                <p>Uma nova coleta atualiza registros alterados sem duplicar os que permanecem iguais. Registros removidos da fonte não são apagados automaticamente, portanto o banco pode representar o último estado observado.</p>
              </div>
            </section>

            <Card className="border-sky-300/15 bg-[#081426] text-white ring-0">
              <CardHeader><CardTitle className="flex items-center gap-2 font-sans text-lg"><RefreshCw aria-hidden="true" className="size-5 text-sky-300" />Confirme antes de decidir</CardTitle></CardHeader>
              <CardContent className="space-y-5 text-sm leading-6 text-slate-300">
                <p>Prazo, elegibilidade e vigência podem mudar. Consulte sempre a publicação oficial antes de se inscrever ou planejar uma mobilidade.</p>
                <Button nativeButton={false} render={<a href="https://sinter.ufsc.br/" target="_blank" rel="noreferrer" />} className="w-full bg-white text-slate-950 hover:bg-sky-100">Acessar a SINTER <span className="sr-only">(abre em nova aba)</span><ArrowUpRight aria-hidden="true" /></Button>
                <Button nativeButton={false} render={<a href={apiDocsUrl} target="_blank" rel="noreferrer" />} variant="outline" className="w-full border-white/15 bg-white/[0.03] text-white hover:bg-white/10">Documentação da API <span className="sr-only">(abre em nova aba)</span><ArrowUpRight aria-hidden="true" /></Button>
              </CardContent>
            </Card>
          </div>

          <section aria-labelledby="limits-title" className="mt-16">
            <Alert className="border-amber-200/20 bg-amber-200/[0.055] p-6 text-slate-100">
              <TriangleAlert aria-hidden="true" className="text-amber-300" />
              <AlertTitle id="limits-title" className="text-lg">Limitações importantes</AlertTitle>
              <AlertDescription className="mt-3 text-slate-300">
                <ul className="list-disc space-y-2 pl-5 leading-7">
                  <li>Oportunidades não possuem campos estruturados de país ou continente; não inferimos uma geografia a partir do texto.</li>
                  <li>O coletor atual não extrai a disponibilidade de intercâmbio como campo estruturado. Por isso, filtros e resumos podem mostrar “Não informado” mesmo que o texto bruto traga indícios; confirme sempre na fonte oficial.</li>
                  <li>Datas não reconhecidas são preservadas como texto, e mudanças na estrutura das páginas de origem podem exigir ajustes no coletor.</li>
                  <li>Uma instituição pode aparecer em vários registros quando há convênios distintos.</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-slate-400"><Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-300" /><p>O viajaUFSC somente lê conteúdo público: não autentica, altera ou publica informações nos sistemas da UFSC.</p></div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
