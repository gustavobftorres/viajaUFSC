import type { Metadata } from "next";
import "./globals.css";

function configuredSiteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: configuredSiteUrl(),
  title: { default: "viajaUFSC — Oportunidades de mobilidade acadêmica", template: "%s · viajaUFSC" },
  description: "Explore oportunidades internacionais e instituições parceiras da UFSC com dados públicos organizados da SINTER.",
  applicationName: "viajaUFSC",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "viajaUFSC",
    title: "viajaUFSC — Oportunidades de mobilidade acadêmica",
    description: "Dados públicos da SINTER organizados para consultar oportunidades e convênios internacionais.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#conteudo" className="skip-link">Ir para o conteúdo principal</a>
        {children}
      </body>
    </html>
  );
}
