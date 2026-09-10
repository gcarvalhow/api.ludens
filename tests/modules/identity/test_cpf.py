import pytest

from app.core.domain import DomainError
from app.modules.identity.domain.value_objects import CPF


def test_aceita_cpf_valido_e_guarda_so_digitos():
    assert CPF("529.982.247-25").value == "52998224725"
    assert CPF("52998224725").value == "52998224725"


def test_recusa_dv_invalido():
    with pytest.raises(DomainError) as exc_info:
        CPF("52998224724")

    assert exc_info.value.field == "cpf"
    assert exc_info.value.status_code == 422


def test_recusa_sequencia_repetida():
    with pytest.raises(DomainError):
        CPF("11111111111")


def test_recusa_quantidade_errada_de_digitos():
    with pytest.raises(DomainError):
        CPF("529982247")
