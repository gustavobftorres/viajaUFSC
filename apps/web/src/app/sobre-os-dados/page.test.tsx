import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutDataPage from "./page";

describe("AboutDataPage", () => {
  it("explica a proveniência, o pipeline e as limitações sem ocultar a fonte", () => {
    render(<AboutDataPage />);

    expect(screen.getByRole("heading", { level: 1, name: /dados públicos/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Da publicação à tela" })).toBeInTheDocument();
    expect(screen.getByText(/não possuem campos estruturados de país ou continente/i)).toBeInTheDocument();
    expect(screen.getByText(/não extrai a disponibilidade de intercâmbio como campo estruturado/i)).toHaveTextContent(/filtros e resumos podem mostrar “Não informado”.*confirme sempre na fonte oficial/i);
    expect(screen.getByRole("button", { name: /acessar a SINTER/i })).toHaveAttribute("href", "https://sinter.ufsc.br/");
    expect(screen.getByRole("button", { name: /documentação da API/i })).toHaveAttribute("href", "https://viajaufsc-api.onrender.com/api/v1/docs");
  });
});
