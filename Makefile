DESIGN_SYSTEM_VERSION=`cat .design-system-version`

load-design-system-templates:
	./scripts/load_release.sh onsdigital/design-system $(DESIGN_SYSTEM_VERSION)

run-ui: load-design-system-templates
	poetry run flask --app application run --debug -p 8000

format-python:
	poetry run isort .
	poetry run black .
	poetry run flake8 .

black:
	poetry run black .

format:
	npx prettier --write .

run-api-tests:
	poetry run pytest server/test.py