from datetime import date, datetime, time, timedelta, timezone

# Horário de Brasília. Offset fixo, não ZoneInfo: o Brasil não observa horário de
# verão desde 2019, e ZoneInfo exigiria o pacote `tzdata` no Windows.
CATALOG_TZ = timezone(timedelta(hours=-3))

def floor_from(from_date: date | None) -> datetime:
    now = datetime.now(timezone.utc)
    if from_date is None:
        return now

    # A data vem do calendário do visitante, não em UTC: "a partir de 13/09" tem
    # que começar à meia-noite de Brasília, senão pega a noite do dia 12.
    # Data no passado não faz sentido para sessão futura — o piso nunca recua.
    return max(datetime.combine(from_date, time.min, tzinfo=CATALOG_TZ), now)
