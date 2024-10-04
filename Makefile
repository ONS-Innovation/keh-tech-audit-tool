DESIGN_SYSTEM_VERSION=`cat .design-system-version`

load-design-system-templates:
	./scripts/load_release.sh onsdigital/design-system $(DESIGN_SYSTEM_VERSION)

run: load-design-system-templates
	poetry run flask --app application run --debug

run-api:
	poetry run python server/main.py

run-api-test:
	poetry run python server/unittest.py


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