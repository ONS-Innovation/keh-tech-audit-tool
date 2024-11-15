# KEH TECH AUDIT TOOL - UI
## About

### Introduction

This application is to demonstrate a proof of concept of how a survey for collecting project data from tech leads or delivery managers would work.

This data aims to be used in the Tech Radar to help ONS understand more about the technology used within the organisation.

An API runs in AWS, so there is no need to run the API locally when testing the UI.

### Authentication

An AWS Cognito is setup to authenticate each user. The application attempts to authorise the session token on each page load to ensure security between pages.

The session token has a life of 1 day, for development purposes.

## Testing the UI
### Setting Up

Install necessary dependencies using the make command:

```bash
make install
```

To run, please import these credentials into the app:

```bash
export AWS_ACCESS_KEY_ID=<KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
```

API_URL, APP_SECRET_KEY and REDIRECT_URI are stored and retrieved from AWS Secrets  Manager, there is no need to export them.

The API_URL is set to the production URL to get the latest, working version of the API.

The APP_SECRET_KEY can be anything for development purposes.

The REDIRECT_URI must be set to localhost:8000 in development purposes as that is set in AWS Cognito. When pushed to production, this must change to the production URI of the UI app.

### Running the Application

Use the make command in the root directory of the project to load the design system:

```bash
make load-design
```

Then you can start the application by running:

```bash
make run-ui
```

### Setting up with Docker

To build the image:
```bash
make docker-build
```

To run an instance of the image as a container:
```bash
make docker-run
```

Alternatively, you may use docker-compose to build:

```bash
docker-compose up --build
```

To run:

```bash
docker-compose up
```

On AWS, these environment variables will be set in the task definition on ECS.

Once running, the app will appear on [http://localhost:8000](http://localhost:8000). Do not change the port or authentication with Cognito will not work.


### Linting

Install necessary dev dependencies using the make command:

```bash
make install-dev
```

Use the make command in the root directory of the project to run the app:

```bash
make format-python
```

This will run `isort`, `black` and `flake8`. Flake8 will ignore `E501 line too long`.