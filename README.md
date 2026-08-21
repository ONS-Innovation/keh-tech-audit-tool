# TECH AUDIT TOOL - UI

## Table of Contents

- [TECH AUDIT TOOL - UI](#tech-audit-tool---ui)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Authentication](#authentication)
  - [Testing the UI](#testing-the-ui)
    - [Setting Up](#setting-up)
    - [Running the Application](#running-the-application)
    - [Setting up with Docker](#setting-up-with-docker)
    - [Linting](#linting)
  - [Deployment with Concourse](#deployment-with-concourse)
    - [Allowlisting your IP](#allowlisting-your-ip)
    - [Setting up a pipeline](#setting-up-a-pipeline)
    - [Prod deployment](#prod-deployment)
    - [Triggering a pipeline](#triggering-a-pipeline)
    - [Destroying a pipeline](#destroying-a-pipeline)
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

Sign in with AWS SSO, and export the correct profile for this service:

```bash
aws sso login

export AWS_PROFILE=keh-tech-audit-tool
```

This allows you to assume the AWS IAM role for the service, enabling the most secure development experience. This also means you will have limited permissions until you exit out of the profile.

**Note:** See the Developer Onboarding Guide on the "Using AWS SSO for Local Development" page on Confluence to set up service profile selection on your local machine.

Then export the required environment variables:

```bash
export API_BUCKET_NAME=sdp-dev-tech-audit-tool-api
export API_SECRET_NAME=sdp-dev-tech-audit-tool-api/secrets
export UI_SECRET_NAME=tech-audit-tool-ui/secrets
export AZURE_SECRET_NAME=sdp-keh-team-azure/secrets
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

## Deployment with Concourse

### Allowlisting your IP

To setup the deployment pipeline with concourse, you must first allowlist your IP address on the Concourse server. IP addresses are flushed everyday at 00:00 so this must be done at the beginning of every working day whenever the deployment pipeline needs to be used.

Instructions on this are available within **KEH's Confluence Space**.

All pipelines run within the `sdp-pipeline-prod` AWS account, whereas `sdp-pipeline-dev` is the account used for testing changes to the Concourse instance itself (i.e. configuration changes, not pipeline changes).

### Setting up a pipeline

Our pipelines use IAM role assumption via AWS STS to interact with our infrastructure.
Credentials/secrets for pipelines are stored within AWS Secrets Manager on the `sdp-pipeline-prod` account, so you do not need to set up anything yourself.

To set the pipeline, run the following script:

```bash
chmod u+x ./concourse/scripts/set_pipeline.sh
./concourse/scripts/set_pipeline.sh
```

**Note:** You only have to run `chmod` the first time running the script in order to give permissions.

This script will set the branch and pipeline name to whatever branch you are currently on.
It will also set the image tag on ECR to 7 characters of the current branch name if running on a branch other than `main`.
For `main`, the ECR tag will be the latest release tag on the repository that has semantic versioning(vX.Y.Z).

The pipeline name itself will usually follow a pattern as follows:

- `tech-audit-tool-<branch-name>` for any non-main branch.
  - When following our branching strategy, pipelines are normally postfixed with the Jira ticket number, e.g. `tech-audit-tool-KEH1234`.
- `tech-audit-tool` for the main/master branch.

### Prod deployment

To deploy to prod, it is required that a Github Release is made on Github. The release is required to follow semantic versioning of vX.Y.Z.

A manual trigger is to be made on the pipeline name `tech-audit-tool > deploy-after-github-release` job through the Concourse CI UI. This will create a `github-create-tag` resource that is required on the `tech-audit-tool > build-and-push-prod` job. Then the prod deployment job is also through a manual trigger ensuring that prod is only deployed using the latest GitHub release tag in the form of vX.Y.Z and is manually controlled.

More information on our typical deployment patterns in Concourse can be found in our Confluence space.

### Triggering a pipeline

Once the pipeline has been set, you can manually trigger a dev build on the Concourse UI, or run the following command for non-main branch deployment:

```bash
fly -t aws-sdp trigger-job -j tech-audit-tool-<branch-name>/build-and-push-dev
```

and for main branch deployment:

```bash
fly -t aws-sdp trigger-job -j tech-audit-tool/build-and-push-dev
```

### Destroying a pipeline

To destroy the pipeline, run the following command:

```bash
fly -t aws-sdp destroy-pipeline -p tech-audit-tool-<branch-name>
```

**It is unlikely that you will need to destroy a pipeline, but the command is here if needed.**

**Note:** This will not destroy any resources created by Terraform. You must manually destroy these resources using Terraform.

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
