from datetime import date, datetime, time, timedelta, timezone
from uuid import uuid4

from app.modules.catalog.application.usecases.show_search_usecase import (
    _CATALOG_TZ,
    _card,
    _floor_from,
    _slugify,
    _synopsis_short,
)
from app.modules.catalog.infrastructure.repositories import ShowCardRow

def _row(**overrides) -> ShowCardRow:
    base = dict(
        id=uuid4(),
        title="A Bela e a Fera",
        synopsis="Um clássico do teatro comunitário.",
        image_url="/images/show-placeholders/1.jpg",
        genre="Infantil",
        upcoming_dates=[datetime(2026, 10, 1, 20, tzinfo=timezone.utc)],
        price_min_cents=4000,
        price_max_cents=6000,
    )
    base.update(overrides)

    return ShowCardRow(**base)

def test_sinopse_curta_preserva_texto_dentro_do_limite():
    synopsis = "Uma comédia sobre um teatro comunitário."

    assert _synopsis_short(synopsis) == synopsis

def test_sinopse_curta_trunca_em_160_caracteres():
    short = _synopsis_short("a" * 500)

    assert len(short) == 160
    assert short.endswith("…")

def test_slug_de_genero_remove_acento_e_normaliza_separador():
    assert _slugify("Comédia Musical") == "comedia-musical"
    assert _slugify("DRAMA") == "drama"
    assert _slugify("Infantil / Família") == "infantil-familia"

def test_slug_colide_para_rotulos_equivalentes():
    # Por isso list_genres deduplica e o filtro casa em lista de rótulos.
    assert _slugify("Comédia") == _slugify("comedia")

def test_filtro_de_data_no_passado_vira_agora():
    antes = datetime.now(timezone.utc)

    # RF01: buscar sessão passada não faz sentido — o piso nunca recua.
    assert _floor_from(date(2020, 1, 1)) >= antes

def test_sem_filtro_de_data_parte_de_agora():
    antes = datetime.now(timezone.utc)

    assert _floor_from(None) >= antes

def test_filtro_de_data_parte_da_meia_noite_de_brasilia():
    futuro = (datetime.now(timezone.utc) + timedelta(days=30)).date()

    floor = _floor_from(futuro)

    # Meia-noite de Brasília, não de UTC: senão o filtro "a partir do dia X"
    # engoliria as sessões da noite do dia anterior.
    assert floor == datetime.combine(futuro, time.min, tzinfo=_CATALOG_TZ)
    assert floor.astimezone(timezone.utc).hour == 3

def test_card_limita_as_proximas_datas():
    dates = [datetime(2026, 10, dia, 20, tzinfo=timezone.utc) for dia in range(1, 11)]

    card = _card(_row(upcoming_dates=dates))

    assert card.upcoming_dates == dates[:5]

def test_card_converte_faixa_de_preco_para_reais():
    card = _card(_row(price_min_cents=4000, price_max_cents=6050))

    assert card.price_min == 40.0
    assert card.price_max == 60.5
