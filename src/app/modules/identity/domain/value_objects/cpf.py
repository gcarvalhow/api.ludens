from dataclasses import dataclass

from app.core.domain.errors import DomainError


@dataclass(frozen=True)
class CPF:
    # CPF sem mascara — 11 digitos. A validade dos digitos verificadores e'
    # invariante de dominio (RF09); guardado sem mascara (RNF01).
    value: str

    def __post_init__(self) -> None:
        if not _is_valid(self.value):
            raise DomainError("CPF inválido.")


def _is_valid(cpf: str) -> bool:
    if not cpf.isdigit() or len(cpf) != 11:
        return False
    # Sequencias de digitos iguais (000... , 111...) passam na formula mas nao
    # sao CPFs validos.
    if cpf == cpf[0] * 11:
        return False
    for length in (9, 10):
        total = sum(int(cpf[i]) * ((length + 1) - i) for i in range(length))
        check = (total * 10) % 11
        check = 0 if check == 10 else check
        if check != int(cpf[length]):
            return False
    return True
