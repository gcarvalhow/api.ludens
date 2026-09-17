from datetime import date, datetime, time, timedelta, timezone

# Brasília time. Fixed offset, not ZoneInfo: Brazil has not observed daylight
# saving time since 2019, and ZoneInfo would require the `tzdata` package on Windows.
CATALOG_TZ = timezone(timedelta(hours=-3))

def floor_from(from_date: date | None) -> datetime:
    now = datetime.now(timezone.utc)
    if from_date is None:
        return now

    # The date comes from the visitor's calendar, not UTC: "from 09/13" must
    # start at midnight Brasília time, otherwise it catches the night of the 12th.
    # A past date makes no sense for a future session — the floor never moves backward.
    return max(datetime.combine(from_date, time.min, tzinfo=CATALOG_TZ), now)
