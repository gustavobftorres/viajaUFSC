"""Conservative HTTP client for public SINTER pages."""

from __future__ import annotations

import math
import os
import time
from typing import Callable

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


DEFAULT_USER_AGENT = (
    "sinter-ufsc-collector/0.1 "
    "(+https://github.com/gustavobftorres/viajaUFSC)"
)


def _environment_number(
    name: str,
    default: float | int,
    converter: type[float] | type[int],
) -> float | int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return converter(raw)
    except ValueError as error:
        raise ValueError(f"{name} must be a valid {converter.__name__}") from error


class HttpClient:
    def __init__(
        self,
        *,
        timeout: float | None = None,
        delay: float | None = None,
        retries: int | None = None,
        user_agent: str | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        timeout = float(
            timeout
            if timeout is not None
            else _environment_number("SINTER_COLLECTOR_TIMEOUT", 15.0, float)
        )
        delay = float(
            delay
            if delay is not None
            else _environment_number("SINTER_COLLECTOR_DELAY", 1.0, float)
        )
        retry_value = (
            retries
            if retries is not None
            else _environment_number("SINTER_COLLECTOR_RETRIES", 2, int)
        )
        if not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("timeout must be finite and positive")
        if not math.isfinite(delay) or delay < 0:
            raise ValueError("delay must be finite and non-negative")
        if (
            isinstance(retry_value, bool)
            or not isinstance(retry_value, int)
            or retry_value < 0
            or retry_value > 10
        ):
            raise ValueError("retries must be an integer between 0 and 10")
        retries = retry_value
        self.timeout = timeout
        self.delay = delay
        self._sleep = sleep
        self._has_requested = False
        self.session = requests.Session()
        retry = Retry(
            total=retries,
            connect=retries,
            read=retries,
            status=retries,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET"}),
            respect_retry_after_header=True,
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self.session.mount("http://", HTTPAdapter(max_retries=retry))
        identity = user_agent or os.getenv(
            "SINTER_COLLECTOR_USER_AGENT", DEFAULT_USER_AGENT
        )
        self.session.headers.update({"User-Agent": identity, "Accept": "*/*"})

    def get(self, url: str, **kwargs: object) -> requests.Response:
        if self._has_requested and self.delay:
            self._sleep(self.delay)
        kwargs.setdefault("timeout", self.timeout)
        response = self.session.get(url, **kwargs)
        self._has_requested = True
        response.raise_for_status()
        return response

    def close(self) -> None:
        self.session.close()

    def __enter__(self) -> "HttpClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
