#!/bin/sh
set -eu

apk add --no-cache jq

if [ -z "${secrets:-}" ]; then
	echo "Error: secrets is not set."
	exit 1
fi
if [ -z "${github_access_token:-}" ]; then
	echo "Error: github_access_token is not set."
	exit 1
fi
if [ -z "${tag:-}" ]; then
	echo "Error: tag is not set."
	exit 1
fi
if [ -z "${env:-}" ]; then
	echo "Error: env is not set."
	exit 1
fi

api_secret_name=$(echo "$secrets" | jq -r .api_secret_name)

domain=$(echo "$secrets" | jq -r .domain)

api_bucket_name=$(echo "$secrets" | jq -r .api_bucket_name)
ui_secret_name=$(echo "$secrets" | jq -r .ui_secret_name)
azure_secret_name=$(echo "$secrets" | jq -r .azure_secret_name)

localhost=$(echo "$secrets" | jq -r .localhost)

container_image=$(echo "$secrets" | jq -r .container_image)
force_deployment=$(echo "$secrets" | jq -r .force_deployment)

branch_name=$branch

git config --global url."https://x-access-token:${github_access_token}@github.com/".insteadOf "https://github.com/"

if [ "${env}" != "prod" ]; then
	env="dev"
fi

echo "${env}"

# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are used within `alb.tf`.
# These are set in the assume_role.sh script, which is run before this script in the Concourse pipeline.
# When running the apply step, these values are loaded from the environment and passed to Terraform.

cd resource-repo/terraform/service
terraform init -backend-config=env/"${env}"/backend-"${env}".tfbackend -reconfigure
terraform apply \
	-var "aws_access_key_id=${AWS_ACCESS_KEY_ID}" \
	-var "aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}" \
	-var "api_secret_name=${api_secret_name}" \
	-var "domain=${domain}" \
	-var "container_ver=${tag}" \
	-var "api_bucket_name=${api_bucket_name}" \
	-var "ui_secret_name=${ui_secret_name}" \
	-var "azure_secret_name=${azure_secret_name}" \
	-var "localhost=${localhost}" \
	-var "container_image=${container_image}" \
	-var "force_deployment=${force_deployment}" \
	-var "branch_name=${branch_name}" \
	-auto-approve