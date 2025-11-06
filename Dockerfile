# syntax=docker/dockerfile:1

########################################
# Builder stage
########################################
FROM python:3.12-alpine AS build

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apk add --no-cache build-base curl jq unzip bash

COPY pyproject.toml poetry.lock ./

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION" && \
    poetry export -f requirements.txt --only main --without-hashes -o requirements.txt

COPY application.py ./
COPY templates ./templates
COPY static ./static

########################################
# Runtime stage
########################################
FROM python:3.12-alpine AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_DEBUG=0 \
    GUNICORN_WORKERS=3 \
    GUNICORN_BIND=0.0.0.0:8000

WORKDIR /app

# Add wget for healthcheck (or switch to curl)
RUN apk add --no-cache bash wget

RUN addgroup -S appuser && adduser -S appuser -G appuser

COPY --from=build /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

COPY --from=build /app /app

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/health || exit 1

CMD gunicorn application:app --workers $GUNICORN_WORKERS --bind $GUNICORN_BIND --access-logfile - --error-logfile -