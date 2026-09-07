FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY apps/api/pyproject.toml ./pyproject.toml
COPY apps/api/src ./src
COPY apps/api/alembic.ini ./alembic.ini
COPY apps/api/alembic ./alembic

RUN pip install --no-cache-dir . \
    && addgroup --system viajaufsc \
    && adduser --system --ingroup viajaufsc --no-create-home viajaufsc \
    && chown -R viajaufsc:viajaufsc /app

USER viajaufsc

EXPOSE 8000

CMD ["uvicorn", "viajaufsc_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
