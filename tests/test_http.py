from unittest.mock import Mock

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


def test_explicit_request_timeout_replaces_default_without_duplicate_keyword() -> None:
    client = HttpClient(timeout=7)
    response = Mock()
    response.raise_for_status = Mock()
    client.session.get = Mock(return_value=response)

    client.get("https://example.test", timeout=2)

    assert client.session.get.call_args.kwargs["timeout"] == 2
