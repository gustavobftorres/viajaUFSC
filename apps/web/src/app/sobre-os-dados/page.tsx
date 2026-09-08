import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Sobre os dados" };
export default function AboutDataPage() { return <PlaceholderPage eyebrow="Transparência" title="Dados públicos, contexto preservado." description="O viajaUFSC coleta publicações públicas da SINTER, normaliza campos para consulta e mantém os links das fontes. A confirmação final deve sempre acontecer nos canais oficiais da UFSC." />; }
