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
RUN apk add --no-cache shadow make curl jq unzip bash git && \
    groupadd -r appuser && useradd -r -g appuser appuser && \
    mkdir -p /home/appuser && chown appuser:appuser /home/appuser
# ENV HOME=/home/appuser
# Prefer app-owned temp dir (for tempfile + many libs)
ENV TMPDIR=/tmp
ENV TEMP=/tmp
ENV TMP=/tmp
ENV HOME=/tmp

VOLUME ["/var/run", "/tmp"]

# Create writable temp directories for runtime (owned by appuser)
# - /tmp is conventional; sticky bit 1777 is standard
# - /home/appuser/.tmp is an app-owned temp fallback
# RUN mkdir -p /tmp /var/tmp /home/appuser/.tmp && \
#     chmod 1777 /tmp /var/tmp && \
#     chown -R appuser:appuser /home/appuser/.tmp

# Prefer app-owned temp dir (avoids relying on /tmp if hardened runtime changes it)
# ENV TMPDIR=/home/appuser/.tmp

# Ensure packaging toolchain exists (fixes missing packaging/tags.py)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel packaging

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Copy source
COPY . /app

# Ensure appuser can write where needed (if anything writes under /app)
RUN chown -R appuser:appuser /app

# Design assets (ensure .design-system-version not empty)
RUN make load-design

# Install only main (prod) deps and gunicorn
# RUN poetry install --only main --no-root && pip install --no-cache-dir gunicorn
RUN --mount=type=secret,id=github_token \
    set -e; \
    if [ -f /run/secrets/github_token ]; then \
      GITHUB_TOKEN="$(cat /run/secrets/github_token)"; \
      git config --global url."https://${GITHUB_TOKEN}:x-oauth-basic@github.com/".insteadOf "https://github.com/"; \
    fi; \
    poetry install --only main --no-root; \
    rm -f /root/.gitconfig 2>/dev/null || true; \
    pip install --no-cache-dir gunicorn

# RUN chown -R appuser:appuser /app
# # Create writable temp directories for runtime (owned by appuser)
# RUN mkdir -p /home/appuser/.tmp && \
#     chown -R appuser:appuser /home/appuser/.tmp && \
#     chmod 700 /home/appuser/.tmp




USER appuser

# Expose the port that the application listens on.
EXPOSE 8000
# Use Gunicorn for production instead of Flask dev server
CMD gunicorn application:app --bind 0.0.0.0:8000 --workers 3 --access-logfile - --error-logfile -