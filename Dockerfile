# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

FROM python:3.12-slim-bullseye

WORKDIR /app

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser appuser

RUN pip install poetry==1.8.3

# Copy the source code into the container.
COPY .  /app

RUN apt update && \
    apt install -y make curl jq unzip wget

RUN make load-design

RUN pip install --upgrade pip && poetry install
# Change ownership of the application files to the non-root user
RUN chown -R appuser:appuser /app
ENV GUNICORN_WORKERS=3 \
    GUNICORN_BIND=0.0.0.0:8000

# Expose the port that the application listens on.
EXPOSE 8000

# check if the app is running every 2 minutes
HEALTHCHECK --interval=120s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/health || exit 1

CMD  poetry run gunicorn application:app --workers $GUNICORN_WORKERS --bind $GUNICORN_BIND --access-logfile - --error-logfile -