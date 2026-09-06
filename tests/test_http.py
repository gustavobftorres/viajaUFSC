from unittest.mock import Mock

import pytest

from sinter_collector.http import HttpClient


def test_client_configures_identity_timeout_and_inter_request_delay() -> None:
    sleep = Mock()
    client = HttpClient(timeout=7, delay=0.25, retries=1, sleep=sleep)
    response = Mock()
    response.raise_for_status = Mock()
    client.session.get = Mock(return_value=response)

    client.get("https://example.test/one")
    client.get("https://example.test/two")

    assert client.session.headers["User-Agent"] == (
        "sinter-ufsc-collector/0.1 "
        "(+https://github.com/gustavobftorres/viajaUFSC)"
    )
    assert client.session.get.call_args_list[0].kwargs["timeout"] == 7
    sleep.assert_called_once_with(0.25)
    assert response.raise_for_status.call_count == 2


def test_client_accepts_user_agent_from_environment(monkeypatch) -> None:
    monkeypatch.setenv("SINTER_COLLECTOR_USER_AGENT", "viajaUFSC-test/contact@example.test")
    client = HttpClient()

    assert client.session.headers["User-Agent"] == "viajaUFSC-test/contact@example.test"


def test_client_accepts_numeric_settings_from_environment(monkeypatch) -> None:
    monkeypatch.setenv("SINTER_COLLECTOR_TIMEOUT", "8.5")
    monkeypatch.setenv("SINTER_COLLECTOR_DELAY", "0.4")
    monkeypatch.setenv("SINTER_COLLECTOR_RETRIES", "4")

    client = HttpClient()

    assert client.timeout == 8.5
    assert client.delay == 0.4
    adapter = client.session.get_adapter("https://")
    assert adapter.max_retries.total == 4


@pytest.mark.parametrize(
    ("name", "value", "message"),
    [
        ("SINTER_COLLECTOR_TIMEOUT", "zero", "must be a valid float"),
        ("SINTER_COLLECTOR_RETRIES", "1.5", "must be a valid int"),
        ("SINTER_COLLECTOR_DELAY", "-1", "non-negative"),
        ("SINTER_COLLECTOR_TIMEOUT", "nan", "finite and positive"),
        ("SINTER_COLLECTOR_TIMEOUT", "inf", "finite and positive"),
        ("SINTER_COLLECTOR_DELAY", "nan", "finite and non-negative"),
        ("SINTER_COLLECTOR_DELAY", "inf", "finite and non-negative"),
        ("SINTER_COLLECTOR_RETRIES", "11", "between 0 and 10"),
    ],
)
def test_client_rejects_invalid_environment_settings(
    monkeypatch, name: str, value: str, message: str
) -> None:
    monkeypatch.setenv(name, value)

    with pytest.raises(ValueError, match=message):
        HttpClient()


@pytest.mark.parametrize(
    "settings",
    [
        {"timeout": float("nan")},
        {"timeout": float("inf")},
        {"delay": float("nan")},
        {"delay": float("inf")},
    ],
)
def test_client_rejects_non_finite_explicit_settings(settings) -> None:
    with pytest.raises(ValueError, match="finite"):
        HttpClient(**settings)


@pytest.mark.parametrize("retries", [-1, 11, True, 1.5, float("nan"), float("inf")])
def test_client_rejects_explicit_retry_values_outside_safe_range(retries) -> None:
    with pytest.raises(ValueError, match="integer between 0 and 10"):
        HttpClient(retries=retries)


def test_explicit_request_timeout_replaces_default_without_duplicate_keyword() -> None:
    client = HttpClient(timeout=7)
    response = Mock()
    response.raise_for_status = Mock()
    client.session.get = Mock(return_value=response)

    client.get("https://example.test", timeout=2)

    assert client.session.get.call_args.kwargs["timeout"] == 2
