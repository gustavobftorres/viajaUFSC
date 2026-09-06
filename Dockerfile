FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
RUN pip install --no-cache-dir --no-deps .

RUN addgroup --system collector \
    && adduser --system --ingroup collector --no-create-home collector \
    && mkdir -p /data \
    && chown collector:collector /data
VOLUME ["/data"]

USER collector

ENTRYPOINT ["sinter-collector"]
CMD ["--help"]
