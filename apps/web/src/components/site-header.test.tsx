import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader mobile navigation", () => {
  it("opens with accessible navigation links and closes from the keyboard", async () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    const dialog = await screen.findByRole("dialog");
    const navigation = within(dialog).getByRole("navigation", { name: "Navegação móvel" });
    expect(within(navigation).getByRole("link", { name: "Oportunidades" })).toHaveAttribute("href", "/oportunidades");
    expect(within(navigation).getByRole("link", { name: "Instituições" })).toHaveAttribute("href", "/instituicoes");
    expect(within(navigation).getByRole("link", { name: "Sobre os dados" })).toHaveAttribute("href", "/sobre-os-dados");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    const mobileNavigation = within(await screen.findByRole("dialog")).getByRole("navigation", { name: "Navegação móvel" });
    const institutionLink = within(mobileNavigation).getByRole("link", { name: "Instituições" });
    institutionLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(institutionLink);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
