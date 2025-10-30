#!/bin/sh
set -euo pipefail

echo "Redeploying API in ${env}"

# Extract credentials from secrets JSON
aws_account_id=$(echo "$secrets" | jq -r .aws_account_id)
aws_access_key_id=$(echo "$secrets" | jq -r .aws_access_key_id)
aws_secret_access_key=$(echo "$secrets" | jq -r .aws_secret_access_key)

export AWS_ACCESS_KEY_ID=$aws_access_key_id
export AWS_SECRET_ACCESS_KEY=$aws_secret_access_key

api_name="tech-audit-tool"

api_id=$(aws apigateway get-rest-apis \
  --query "items[?name && contains(name, '${api_name}')].id" \
  --output text)

if [[ -z "$api_id" ]]; then
  echo "ERROR: No API Gateway REST API found with name '${api_name}'"
  exit 1
fi

echo "Found API Gateway REST API ID: ${api_id} (name: ${api_name})"

echo "Triggering redeployment for API Gateway REST API: ${api_id}, stage: dev"
aws apigateway create-deployment \
  --rest-api-id "${api_id}" \
  --stage-name dev \
  --description "API redeploy via cicd pipeline on $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --no-cli-pager

echo "API Gateway redeploy complete."