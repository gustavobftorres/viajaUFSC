import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "viajaUFSC — Oportunidades de mobilidade acadêmica", template: "%s · viajaUFSC" },
  description: "Explore oportunidades internacionais e instituições parceiras da UFSC com dados públicos organizados da SINTER.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
