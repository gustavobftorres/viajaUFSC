import pytest

from viajaufsc_api.server import DEFAULT_PORT, parse_port


def test_parse_port_uses_local_default_when_environment_is_absent() -> None:
    assert parse_port(None) == DEFAULT_PORT


@pytest.mark.parametrize("value", ["10000", "1", "65535"])
def test_parse_port_accepts_valid_tcp_port(value: str) -> None:
    assert parse_port(value) == int(value)


@pytest.mark.parametrize("value", ["", "not-a-port", "0", "65536", "-1"])
def test_parse_port_rejects_invalid_value(value: str) -> None:
    with pytest.raises(ValueError, match="PORT must be an integer between 1 and 65535"):
        parse_port(value)
