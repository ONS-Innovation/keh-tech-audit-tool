# Tech Audit Toool

## About

Introduction

The Tech Audit Tool is a tool used to survey out what tools, languages and frameworks are being used by various projects within DST.

This data aims to be used in the Tech Radar to help ONS understand more about the technology used within the organisation.

An API runs in AWS, so there is no need to run the API locally when testing the UI.
Authentication

### Authentication

An AWS Cognito is setup to authenticate each user. The application attempts to authorise the session token on each page load to ensure security between pages.

The session token has a life of 1 day, for development purposes.

## Testing the UI
### Setting Up

Install necessary dependencies using the make command:

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
export AWS_ACCOUNT_NAME=<sdp-sandbox/sdp-dev/sdp-prod>
export LOCALHOST=<true/false>
```

API_URL, APP_SECRET_KEY and REDIRECT_URI are stored and retrieved from AWS Secrets Manager, there is no need to export them.

The API_URL is set to the production URL to get the latest, working version of the API.

The REDIRECT_URI changes dynamically based on what is set by the LOCALHOST environment variable. When running locally, set `LOCALHOST=TRUE`. When running in production, LOCALHOST will be set to FALSE, and will instead retrieve the REDIRECT_URI from AWS Secrets Manager.

The AWS_ENVIRONMENT environment variable states which AWS environment tech-audit-tool is running on. This is important as the Cognito token URLs will change depending on the environment. You can choose between `sandbox`, `dev` and `prod`

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

Alternatively, you may use docker-compose to build:

```
docker-compose up --build
```

To run:

```
docker-compose up
```

On AWS, these environment variables will be set in the task definition on ECS.

Once running, the app will appear on [http://localhost:8000](http://localhost:8000). Do not change the port or authentication with Cognito will not work.

## Deployment to AWS

The deployment of the service is defined in Infrastructure as Code (IaC) using Terraform.  The service is deployed as a container on an AWS Fargate Service Cluster.

### Deployment Prerequisites

When first deploying the service to AWS the following prerequisites are expected to be in place or added.

#### Underlying AWS Infrastructure

The Terraform in this repository expects that underlying AWS infrastructure is present in AWS to deploy on top of, i.e:

- Route53 DNS Records
- Web Application Firewall and appropriate Rules and Rule Groups
- Virtual Private Cloud with Private and Public Subnets
- Security Groups
- Application Load Balancer
- ECS Service Cluster

That infrastructure is defined in the repository [sdp-infrastructure](https://github.com/ONS-Innovation/sdp-infrastructure)

#### Bootstrap IAM User Groups, Users and an ECSTaskExecutionRole

The following users must be provisioned in AWS IAM:

- ecr-user
  - Used for interaction with the Elastic Container Registry from AWS cli
- ecs-app-user
  - Used for terraform staging of the resources required to deploy the service

The following groups and permissions must be defined and applied to the above users:

- ecr-user-group
  - EC2 Container Registry Access
- ecs-application-user-group
  - EC2 Access
  - ECS Access
  - ECS Task Execution Role Policy
  - Route53 Access
  - S3 Access
  - Cloudwatch Logs All Access (Custom Policy)
  - IAM Access
  - Secrets Manager Access

Further to the above an IAM Role must be defined to allow ECS tasks to be executed:

- ecsTaskExecutionRole
  - See the [AWS guide to create the task execution role policy](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html)

#### Bootstrap for Terraform

To store the state and implement a state locking mechanism for the service resources a Terraform backend is deployed in AWS (an S3 object and DynamoDbTable).

#### Bootstrap for Secrets Manager

AWS Secret Manager must be set up with a secret:

- tech-audit-tool-ui/secrets

#### Running the Terraform

There are associated README files in each of the Terraform modules in this repository.  

- terraform/service/main.tf
  - This provisions the resources required to launch the service.

Depending upon which environment you are deploying to you will want to run your terraform by pointing at an appropriate environment tfvars file.  

Example service tfvars file:
[service/env/sandbox/example_tfvars.txt](./terraform/service/env/sandbox/example_tfvars.txt)

### Updating the running service using Terraform

If the application has been modified then the following can be performed to update the running service:

- Build a new version of the container image and upload to ECR as per the instructions earlier in this guide.
- Change directory to the **service terraform**

  ```
  cd terraform/service
  ```

- In the appropriate environment variable file env/sandbox/sandbox.tfvars, env/dev/dev.tfvars or env/prod/prod.tfvars
  - Change the _container_ver_ variable to the new version of your container.
  - Change the _force_deployment_ variable to _true_.

- Initialise terraform for the appropriate environment config file _backend-dev.tfbackend_ or _backend-prod.tfbackend_ run:

  ```
  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure
  ```

  The reconfigure options ensures that the backend state is reconfigured to point to the appropriate S3 bucket.

  **_Please Note:_** This step requires an **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY** to be loaded into the environment if not already in place.
  This can be done using:

  ```
  export AWS_ACCESS_KEY_ID="<aws_access_key_id>"
  export AWS_SECRET_ACCESS_KEY="<aws_secret_access_key>"
  ```

- Refresh the local state to ensure it is in sync with the backend

  ```
  terraform refresh -var-file=env/dev/dev.tfvars
  ```

- Plan the changes, ensuring you use the correct environment config (depending upon which env you are configuring):

  E.g. for the dev environment run

  ```
  terraform plan -var-file=env/dev/dev.tfvars
  ```

- Apply the changes, ensuring you use the correct environment config (depending upon which env you are configuring):

  E.g. for the dev environment run

  ```
  terraform apply -var-file=env/dev/dev.tfvars
  ```

- When the terraform has applied successfully the running task will have been replaced by a task running the container version you specified in the tfvars file

### Destroy the Main Service Resources

Delete the service resources by running the following ensuring your reference the correct environment files for the backend-config and var files:

  ```
  cd terraform/service

  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure

  terraform refresh -var-file=env/dev/dev.tfvars

  terraform destroy -var-file=env/dev/dev.tfvars
  ```

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
## Project layout

    mkdocs.yml    # The configuration file.
    docs/
        index.md  # The documentation homepage.
    application.py # The backend that serves the Tech Audit Tool UI
    tests/
        test_navigation.py # Test Basic Navigation of the Tech Audit Tool
        test_project_creation.py # Test Project Creation within Tech Audit Tool
        test_utils.py # Various Testing Utilities to be used when writing tests
    templates/
        chapter_summaries/
        pre_survey/ # HTML files that show the user what information is needed before filling in a form
            pre-survey-architecture.html
            pre-survey-project.html
            pre-survey.html
        section_code/ # HTML templates for source control, databases and hosting
            database.html
            hosting.html
            source_control_select.html
            source_control.html
        section_project/ # HTML templates for basic project details
            contact_manager.html
            developed.html
            project.html
            stage.html
        section_technology/
            frameworks.html # Allows user to add frameworks
            infrastructure.html # Allows user to add infrastructure
            integrations.html # Allows user to add integrations
            languages.html # Allows user to add languages
        core.html # Contains navbar that is inherited by all other templates
        index.html # Homepage that contains sign-in button to Cognito
        survey.html # Shows overall progress on the forms
        validate_details.html # Validation page for the fields input
        view_project.html # Displays project details
    terraform/
        service/
            env/
                dev/
                   dev.tfvars # AWS Credentials go in here
                   backend-dev.tfbackend # AWS Environment Setup
                sandbox/
                    backend-sandbox.tfbackend
                prod/
                    backend-prod.tfbackend
            alb.tf # Terraform Setup for Application Load Balancer
            data.tf # Configured tfbackend
            dns.tf # Terraform for DNS (Route53)
            main.tf # Main Terraform for AWS ECS setup
            outputs.tf
            providers.tf
            security.tf # Terraform for security groups
            variables.tf # Terraform for various variables needed for deployment



