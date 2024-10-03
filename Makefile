DESIGN_SYSTEM_VERSION=`cat .design-system-version`

load-design-system-templates:
	./scripts/load_release.sh onsdigital/design-system $(DESIGN_SYSTEM_VERSION)

run: load-design-system-templates
	poetry run flask --app application run --debug

format-python:
	poetry run isort .
	poetry run black .
	poetry run flake8 .

format:
	npx prettier --write .
