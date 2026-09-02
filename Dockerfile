FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .

# alembic.ini e migrations/ ficam disponíveis para `alembic upgrade head`
COPY alembic.ini ./
COPY migrations ./migrations

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
