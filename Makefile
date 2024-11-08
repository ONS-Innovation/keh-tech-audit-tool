DESIGN_SYSTEM_VERSION=`cat .design-system-version`

load-design:
	./scripts/load_release.sh onsdigital/design-system $(DESIGN_SYSTEM_VERSION)

run-ui:
	poetry run flask --app application run --debug -p 8000

format-python:
	poetry run isort .
	poetry run black .
	poetry run flake8 --ignore=E501 .

black:
	poetry run black .

install: 
	poetry install --only main --no-root

install-dev: 
	poetry install --no-root
