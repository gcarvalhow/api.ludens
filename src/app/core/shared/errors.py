from collections.abc import Sequence

def format_validation_errors(errors: Sequence[dict]) -> list[dict]:
    result = []

    for error in errors:
        loc = [str(part) for part in error.get("loc", []) if part != "body"]
        field = ".".join(loc) if loc else "body"
        error_type = error.get("type", "")
        ctx = error.get("ctx", {})

        if error_type == "missing":
            message = "Campo obrigatório"

        elif error_type == "string_too_short":
            min_len = ctx.get("min_length", 1)
            message = "Não pode ficar em branco" if min_len <= 1 else f"Mínimo de {min_len} caracteres"

        elif error_type == "string_too_long":
            message = f"Máximo de {ctx.get('max_length', '')} caracteres"

        elif "email" in error_type or "email" in error.get("msg", "").lower():
            message = "E-mail inválido"

        elif "uuid" in error_type:
            message = "ID inválido"

        elif error_type == "enum":
            message = f"Valor inválido. Opções: {ctx.get('expected', '')}"

        elif "int" in error_type:
            message = "Deve ser um número inteiro"

        elif "float" in error_type or "decimal" in error_type:
            message = "Deve ser um número"

        elif "bool" in error_type:
            message = "Deve ser verdadeiro ou falso"

        else:
            message = error.get("msg", "Valor inválido")

        result.append({"field": field, "message": message})

    return result
