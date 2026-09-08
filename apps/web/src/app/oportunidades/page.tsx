import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Oportunidades" };
export default function OpportunitiesPage() { return <PlaceholderPage eyebrow="Catálogo em construção" title="Oportunidades para o seu próximo passo." description="A experiência completa de busca, filtros e detalhes será a próxima parte do projeto. Enquanto isso, a página inicial já consulta oportunidades abertas na API." />; }
