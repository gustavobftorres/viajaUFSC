"""Launcher HTTP usado pelo container e por plataformas compatíveis com ``PORT``."""

import os

import uvicorn


DEFAULT_PORT = 8000
MIN_PORT = 1
MAX_PORT = 65535


def parse_port(value: str | None) -> int:
    """Converte ``PORT`` em uma porta TCP válida, usando 8000 quando ausente."""

    if value is None:
        return DEFAULT_PORT

    try:
        port = int(value)
    except ValueError as exc:
        raise ValueError("PORT must be an integer between 1 and 65535") from exc

    if not MIN_PORT <= port <= MAX_PORT:
        raise ValueError("PORT must be an integer between 1 and 65535")

    return port


def main() -> None:
    """Inicia o Uvicorn na interface pública do container."""

    uvicorn.run(
        "viajaufsc_api.main:app",
        host="0.0.0.0",
        port=parse_port(os.getenv("PORT")),
    )


if __name__ == "__main__":
    main()
