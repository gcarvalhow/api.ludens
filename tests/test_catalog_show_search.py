from datetime import date, datetime, time, timedelta, timezone

from app.modules.catalog.application.usecases.show_search_usecase import (
    _floor_from,
    _slugify,
    _synopsis_short,
)

def test_sinopse_curta_preserva_texto_dentro_do_limite():
    synopsis = "Uma comédia sobre um teatro comunitário."

    assert _synopsis_short(synopsis) == synopsis

def test_sinopse_curta_trunca_em_160_caracteres():
    synopsis = "a" * 500
    short = _synopsis_short(synopsis)

    assert len(short) == 160
    assert short.endswith("…")

def test_slug_de_genero_remove_acento_e_normaliza_separador():
    assert _slugify("Comédia Musical") == "comedia-musical"
    assert _slugify("DRAMA") == "drama"
    assert _slugify("Infantil / Família") == "infantil-familia"

def test_filtro_de_data_no_passado_vira_agora():
    antes = datetime.now(timezone.utc)

    # RF01: buscar sessão passada não faz sentido — o piso nunca recua.
    assert _floor_from(date(2020, 1, 1)) >= antes

def test_filtro_de_data_futura_parte_do_inicio_do_dia():
    futuro = (datetime.now(timezone.utc) + timedelta(days=30)).date()

    assert _floor_from(futuro) == datetime.combine(futuro, time.min, tzinfo=timezone.utc)

def test_sem_filtro_de_data_parte_de_agora():
    antes = datetime.now(timezone.utc)

    assert _floor_from(None) >= antes
