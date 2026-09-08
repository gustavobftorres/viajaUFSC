import { Suspense } from "react";
import { CatalogPreview, CatalogPreviewSkeleton } from "@/components/catalog-preview";
import { HomeContent } from "@/components/home-content";

export const dynamic = "force-dynamic";

export default function Home() {
  return <HomeContent catalog={<Suspense fallback={<CatalogPreviewSkeleton />}><CatalogPreview /></Suspense>} />;
}
