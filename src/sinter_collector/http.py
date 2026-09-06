"""Conservative HTTP client for public SINTER pages."""

from __future__ import annotations

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


class HttpClient:
    def __init__(
        self,
        *,
        timeout: float = 15.0,
        delay: float = 1.0,
        retries: int = 2,
        user_agent: str | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        if timeout <= 0 or delay < 0 or retries < 0:
            raise ValueError("timeout must be positive; delay and retries non-negative")
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
