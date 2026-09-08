import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./error";

describe("GlobalError", () => {
  it("oferece recuperação e retorno ao início", () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<GlobalError error={new Error("falha de teste")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /ir ao início/i })).toHaveAttribute("href", "/");
    vi.restoreAllMocks();
  });
});
