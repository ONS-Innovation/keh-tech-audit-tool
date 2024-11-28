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
export API_BUCKET_NAME=sdp-dev-tech-audit-tool-api
export API_SECRET_NAME=sdp-dev-tech-audit-tool-api/secrets
export UI_SECRET_NAME=tech-audit-tool-ui/secrets
export AWS_ENVIRONMENT=<sandbox/dev/prod>
```

API_URL, APP_SECRET_KEY and REDIRECT_URI are stored and retrieved from AWS Secrets  Manager, there is no need to export them.

The API_URL is set to the production URL to get the latest, working version of the API.

The APP_SECRET_KEY can be anything for development purposes.

The REDIRECT_URI must be set to localhost:8000 in development purposes as that is set in AWS Cognito. When pushed to production, this must change to the production URI of the UI app.

On AWS, these environment variables will be set in the task definition on ECS.

### Running the Application

Use the make command in the root directory of the project to load the design system:

```bash
make load-design
```

Then you can start the application by running:

```bash
make run-ui
```

Once running, the app will appear on [http://localhost:8000](http://localhost:8000). Do not change the port or authentication with Cognito will not work.

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
  - A plaintext secret, containing the contents of the .pem file created when a Github App was installed.

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

  ```bash
  cd terraform/service
  ```

- In the appropriate environment variable file env/sandbox/sandbox.tfvars, env/dev/dev.tfvars or env/prod/prod.tfvars
  - Change the _container_ver_ variable to the new version of your container.
  - Change the _force_deployment_ variable to _true_.

- Initialise terraform for the appropriate environment config file _backend-dev.tfbackend_ or _backend-prod.tfbackend_ run:

  ```bash
  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure
  ```

  The reconfigure options ensures that the backend state is reconfigured to point to the appropriate S3 bucket.

  **_Please Note:_** This step requires an **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY** to be loaded into the environment if not already in place.
  This can be done using:

  ```bash
  export AWS_ACCESS_KEY_ID="<aws_access_key_id>"
  export AWS_SECRET_ACCESS_KEY="<aws_secret_access_key>"
  ```

- Refresh the local state to ensure it is in sync with the backend

  ```bash
  terraform refresh -var-file=env/dev/dev.tfvars
  ```

- Plan the changes, ensuring you use the correct environment config (depending upon which env you are configuring):

  E.g. for the dev environment run

  ```bash
  terraform plan -var-file=env/dev/dev.tfvars
  ```

- Apply the changes, ensuring you use the correct environment config (depending upon which env you are configuring):

  E.g. for the dev environment run

  ```bash
  terraform apply -var-file=env/dev/dev.tfvars
  ```

- When the terraform has applied successfully the running task will have been replaced by a task running the container version you specified in the tfvars file

### Destroy the Main Service Resources

Delete the service resources by running the following ensuring your reference the correct environment files for the backend-config and var files:

  ```bash
  cd terraform/service

  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure

  terraform refresh -var-file=env/dev/dev.tfvars

  terraform destroy -var-file=env/dev/dev.tfvars
  ```

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