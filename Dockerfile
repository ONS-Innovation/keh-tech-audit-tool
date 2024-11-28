# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

FROM python:3.11-slim-bullseye

WORKDIR /app

RUN pip install poetry==1.8.3

# Copy the source code into the container.
COPY .  /app

RUN poetry install

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD poetry run flask --app application run --host=0.0.0.0 --debug -p 8000
