FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .

# alembic.ini na raiz aponta para src/migrations (que já veio no COPY src acima),
# então `alembic upgrade head` roda a partir de /app.
COPY alembic.ini ./

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
