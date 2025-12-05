# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

FROM python:3.12-alpine

WORKDIR /app

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1

# Tools + non-root user + home dir
RUN apk add --no-cache shadow make curl jq unzip bash wget && \
    groupadd -r appuser && useradd -r -g appuser appuser && \
    mkdir -p /home/appuser && chown appuser:appuser /home/appuser
ENV HOME=/home/appuser

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Copy source
COPY . /app

# Design assets (ensure .design-system-version not empty)
RUN make load-design

# Install only main (prod) deps and gunicorn
RUN  pip install --upgrade pip && poetry install --only main --no-root

RUN chown -R appuser:appuser /app

USER appuser

# Expose the port that the application listens on.
EXPOSE 8000
# Use Gunicorn for production instead of Flask dev server
HEALTHCHECK --interval=300s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/health || exit 1

CMD gunicorn application:app --bind 0.0.0.0:8000 --workers 3 --access-logfile - --error-logfile -

