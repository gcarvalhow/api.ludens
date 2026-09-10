import pytest

from app.core.domain import DomainError
from app.modules.identity.domain.value_objects import Email


def test_normaliza_para_minusculas_e_apara_espacos():
    assert Email("  Ana.Souza@Example.COM ").value == "ana.souza@example.com"


def test_recusa_formato_invalido():
    with pytest.raises(DomainError) as exc_info:
        Email("ana(at)example.com")

    assert exc_info.value.field == "email"
