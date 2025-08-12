# Tech Audit Tool - UI

## Table of Contents

- [Overview](#overview)
- [Deployment to AWS](#deployment-to-aws)
  - [Deployment Prerequisites](#deployment-prerequisites)
  - [Underlying AWS Infrastructure](#underlying-aws-infrastructure)
  - [Bootstrap IAM User Groups, Users and an ECSTaskExecutionRole](#bootstrap-iam-user-groups-users-and-an-ecstaskexecutionrole)
  - [Bootstrap for Terraform](#bootstrap-for-terraform)
  - [Bootstrap for Secrets Manager](#bootstrap-for-secrets-manager)
  - [Running the Terraform](#running-the-terraform)
  - [Updating the running service using Terraform](#updating-the-running-service-using-terraform)
  - [Destroy the Main Service Resources](#destroy-the-main-service-resources)
  - [Deployments with Concourse](#deployments-with-concourse)
    - [Allowlisting your IP](#allowlisting-your-ip)
    - [Setting up a pipeline](#setting-up-a-pipeline)
    - [Triggering a pipeline](#triggering-a-pipeline)
- [Project layout](#project-layout)

## Overview
The Tech Audit Tool is a tool used to survey out information such as the tools, languages and frameworks that are used by various projects within Digital Services and Technology (DST).

This data is used in the Tech Radar on the Digital Landscape to help ONS understand more about technology trends across the organisation.

An API runs in AWS, so there is no need to run the API locally when testing the UI.

## Deployment to AWS

The deployment of the service is defined in Infrastructure as Code (IaC) using Terraform.  The service is deployed as a container on an AWS Fargate Service Cluster.

### Deployment Prerequisites

When first deploying the service to AWS, the following prerequisites are expected to be in place or added.

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

- `ecr-user`
  - Used for interaction with the Elastic Container Registry from AWS cli
- `ecs-app-user`
  - Used for Terraform staging of the resources required to deploy the service

The following groups and permissions must be defined and applied to the above users:

- `ecr-user-group`
  - EC2 Container Registry Access
- `ecs-application-user-group`
  - EC2 Access
  - ECS Access
  - ECS Task Execution Role Policy
  - Route53 Access
  - S3 Access
  - Cloudwatch Logs All Access (Custom Policy)
  - IAM Access
  - Secrets Manager Access

Further to the above an IAM Role must be defined to allow ECS tasks to be executed:

- `ecsTaskExecutionRole`
  - See the [AWS guide to create the task execution role policy](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html)

#### Bootstrap for Terraform

To store the state and implement a state locking mechanism for the service resources, a Terraform backend is deployed in AWS (an S3 object and DynamoDbTable).

#### Bootstrap for Secrets Manager

AWS Secret Manager must be set up with a secret:

- `tech-audit-tool-ui/secrets`

#### Running the Terraform

There are associated README files in each of the Terraform modules in this repository.  

- terraform/service/main.tf
  - This provisions the resources required to launch the service.

Depending upon which environment you are deploying to you will want to run your terraform by pointing at an appropriate environment tfvars file.  

Example service tfvars file:
[terraform/service/env/dev/example_tfvars.txt](/terraform/service/env/dev/example_tfvars.txt)

### Updating the running service using Terraform

If the application has been modified then the following can be performed to update the running service:

- Build a new version of the container image and upload to ECR as per the instructions earlier in this guide.
- Change directory to the **service terraform**

  ```
  cd terraform/service
  ```

- In the appropriate environment variable file `env/dev/dev.tfvars` or `env/prod/prod.tfvars`
  - Change the `container_ver` variable to the new version of your container.
  - Change the `force_deployment` variable to `true`.

- Initialise Terraform for the appropriate environment config file `backend-dev.tfbackend` or `backend-prod.tfbackend` by running:

  ```
  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure
  ```

  The reconfigure options ensures that the backend state is reconfigured to point to the appropriate S3 bucket.

  **_Please Note:_** This step requires an `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to be loaded into the environment if not already in place.
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

- When the Terraform has applied successfully, the running task will have been replaced by a task running the container version you specified in the `tfvars` file

### Destroy the Main Service Resources

Delete the service resources by running the following, ensuring your reference the correct environment files for the `backend-config` and `tfvars` files:

  ```
  cd terraform/service

  terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure

  terraform refresh -var-file=env/dev/dev.tfvars

  terraform destroy -var-file=env/dev/dev.tfvars
  ```

### Deployments with Concourse

#### Allowlisting your IP

To setup the deployment pipeline with concourse, you must first allowlist your IP address on the Concourse
server. IP addresses are flushed everyday at 00:00 so this must be done at the beginning of every working day
whenever the deployment pipeline needs to be used. Follow the instructions on the Confluence page (SDP Homepage > SDP Concourse > Concourse Login) to
login. All our pipelines run on sdp-pipeline-prod, whereas sdp-pipeline-dev is the account used for
changes to Concourse instance itself. Make sure to export all necessary environment variables from sdp-pipeline-prod (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN).

#### Setting up a pipeline

When setting up our pipelines, we use ecs-infra-user on sdp-dev to be able to interact with our infrastructure on AWS. The credentials for this are stored on
AWS Secrets Manager so you do not need to set up anything yourself.
To set the pipeline, run the following script:
```bash
chmod u+x ./concourse/scripts/set_pipeline.sh
./concourse/scripts/set_pipeline.sh KEH-TAT-UI
```
Note that you only have to run chmod the first time running the script in order to give permissions.
This script will set the branch and pipeline name to whatever branch you are currently on. It will also set the image tag on ECR to the current commit hash at the time of setting the pipeline.
The pipeline name itself will usually follow a pattern as follows: `<repo-name>-<branch-name>`
If you wish to set a pipeline for another branch without checking out, you can run the following:
```bash
./concourse/scripts/set_pipeline.sh KEH-TAT-UI <branch_name>
```
If the branch you are deploying is "main" or "master", it will trigger a deployment to the sdp-prod environment. To set the ECR image tag, you must draft a Github release pointing to the latest release of the main/master branch that has a tag in the form of vX.Y.Z. Drafting up a release will automatically deploy the latest version of the main/master branch with the associated release tag, but you can also manually trigger a build through the Concourse UI or the terminal prompt.
#### Triggering a pipeline
Once the pipeline has been set, you can manually trigger a build on the Concourse UI, or run the following command:
```bash
fly -t aws-sdp trigger-job -j KEH-TAT-UI-<branch-name>/build-and-push
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
            project_dependencies.html
        section_supporting_tools/ #HTML templates for supporting tools
            code_editors.html
            collaboration.html
            communication.html
            diagrams.html
            documentation.html
            incident_management.html
            miscellaneous.html
            project_tracking.html
            user_interface.html
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
