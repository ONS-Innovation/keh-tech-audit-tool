run-ui:
	poetry run flask --app application run --debug -p 8000

format-python:
	poetry run isort .
	poetry run black .
	poetry run flake8 .

black:
	poetry run black .

install: 
	poetry install --only main --no-root

install-dev: 
	poetry install --no-root
