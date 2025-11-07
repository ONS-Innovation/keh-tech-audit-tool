# syntax=docker/dockerfile:1
FROM python:3.12-alpine

WORKDIR /app

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1

RUN apk add --no-cache shadow make curl jq unzip bash && \
    groupadd -r appuser && useradd -r -g appuser appuser && \
    mkdir -p /home/appuser && chown appuser:appuser /home/appuser

ENV HOME=/home/appuser

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

COPY . /app

RUN make load-design

# Install deps into system site-packages (no venv)
RUN poetry install --only main --no-root && pip install --no-cache-dir gunicorn

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
# Use Gunicorn for production instead of Flask dev server
CMD poetry run gunicorn application:app --bind 0.0.0.0:8000 --workers 3 --access-logfile - --error-logfile -