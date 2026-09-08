import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeContent } from "@/components/home-content";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("oferece um único atalho global para o conteúdo principal", () => {
    const markup = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <HomeContent catalog={<div>Catálogo</div>} />
      </RootLayout>,
    );
    const document = new DOMParser().parseFromString(markup, "text/html");

    const skipLinks = document.querySelectorAll('a[href="#conteudo"]');
    expect(skipLinks).toHaveLength(1);
    expect(skipLinks[0]?.textContent).toBe("Ir para o conteúdo principal");
  });
});
