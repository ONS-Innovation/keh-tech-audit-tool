# TECH AUDIT TOOL - UI

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Testing the UI](#testing-the-ui)
  - [Setting Up](#setting-up)
  - [Running the Application](#running-the-application)
  - [Setting up with Docker](#setting-up-with-docker)
- [Linting](#linting)
- [Testing](#testing)
  - [Setting Up Test Environment Variables](#setting-up-test-environment-variables)
  - [Running Tests](#running-tests)
    - [Project Creation Tests](#project-creation-tests)
- [Further Documentation](#further-documentation)

## Overview
The Tech Audit Tool is a tool used to survey out information such as the tools, languages and frameworks that are used by various projects within Digital Services and Technology (DST).

This data is used in the Tech Radar on the Digital Landscape to help ONS understand more about technology trends across the organisation.

An API runs in AWS, so there is no need to run the API locally when testing the UI.

## Authentication

An AWS Cognito is set up to authenticate each user. The application attempts to authorise the session token on each page load to ensure security between pages.

The session token has a life of 1 day for development purposes.

## Testing the UI

### Setting Up

Install necessary dependencies using the command:

```
make install
```

To run, please import these credentials into the app:

```
export AWS_ACCESS_KEY_ID=<KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
export API_BUCKET_NAME=sdp-dev-tech-audit-tool-api
export API_SECRET_NAME=sdp-dev-tech-audit-tool-api/secrets
export UI_SECRET_NAME=tech-audit-tool-ui/secrets
export AWS_ACCOUNT_NAME=<sdp-dev/sdp-prod>
export LOCALHOST=<true/false>
```

`API_URL`, `APP_SECRET_KEY` and `REDIRECT_URI` are stored and retrieved from AWS Secrets Manager, so there is no need to export them.

The `API_URL` is set to the production URL to get the latest, working version of the API.

The `REDIRECT_URI` changes dynamically based on what is set by the `LOCALHOST` environment variable. When running locally, set `LOCALHOST=TRUE`. When running in production, `LOCALHOST` will be set to `false`, and will instead retrieve the `REDIRECT_URI` from AWS Secrets Manager.

The `AWS_ENVIRONMENT` environment variable states which AWS environment `tech-audit-tool` is running on. This is important as the Cognito token URLs will change depending on the environment. You can choose between `dev` and `prod`

On AWS, these environment variables will be set in the task definition on ECS.

### Running the Application

Use the make command in the root directory of the project to load the design system:

```
make load-design
```

Then you can start the application by running:

```
make run-ui
```

### Setting up with Docker

To build the image:

```
make docker-build
```

To run an instance of the image as a container:

```
make docker-run
```

Alternatively, you may use `docker-compose` to build:

```
docker-compose up --build
```

To run:

```
docker-compose up
```

On AWS, these environment variables will be set in the task definition on ECS.

Once running, the app will appear on [http://localhost:8000](http://localhost:8000). Do not change the port or authentication with Cognito will not work.

### Linting

Install necessary dev dependencies using the make command:

```
make install-dev
```

Use the make command in the root directory of the project to run the app:

```
make format-python
```

This will run `isort`, `black` and `flake8`. Flake8 will ignore `E501 line too long`.

## Testing

### Setting Up Test Environment Variables

The following environment variables are used for signing into the Tech Audit Tool through Cognito:

```
export TEST_EMAIL=<EMAIL> e.g test@ons.gov.uk
export TEST_PASSWORD=<PASSWORD> e.g testpassword123
export CLIENT=<CLIENT NAME> e.g Chrome, defaults to Firefox
```

## Running Tests

### Project Creation Tests

The following test will automatically go through the steps required for creating a project.

This is useful if you wish to quickly populate the fields after a change has been made instead of populating the fields manually.

```
make test-project-creation
```

## Further Documentation

For additional technical information, see the [documentation](documentation/docs/index.md).

Guidance for adding new pages can be found [here](documentation/docs/Technical_help.md).

