set -euo pipefail

apk add --no-cache jq

aws_account_id=$(echo "$tat_secrets_ui" | jq -r .aws_account_id)
aws_access_key_id=$(echo "$tat_secrets_ui" | jq -r .aws_access_key_id)

aws_secret_access_key=$(echo "$tat_secrets_ui" | jq -r .aws_secret_access_key)
api_secret_name=$(echo "$tat_secrets_ui" | jq -r .api_secret_name)

domain=$(echo "$tat_secrets_ui" | jq -r .domain)

api_bucket_name=$(echo "$tat_secrets_ui" | jq -r .api_bucket_name)
ui_secret_name=$(echo "$tat_secrets_ui" | jq -r .ui_secret_name)

aws_account_name=$(echo "$tat_secrets_ui" | jq -r .aws_account_name)
localhost=$(echo "$tat_secrets_ui" | jq -r .localhost)

container_image=$(echo "$tat_secrets_ui" | jq -r .container_image)
force_deployment=$(echo "$tat_secrets_ui" | jq -r .force_deployment)

export AWS_ACCESS_KEY_ID=$aws_access_key_id
export AWS_SECRET_ACCESS_KEY=$aws_secret_access_key

git config --global url."https://x-access-token:$github_access_token@github.com/".insteadOf "https://github.com/"

if [[ ${env} != "prod" ]]; then
    env="dev"
fi

cd resource-repo/terraform/service
terraform init -backend-config=env/${env}/backend-${env}.tfbackend -reconfigure
terraform apply \
-var "aws_account_id=$aws_account_id" \
-var "aws_access_key_id=$aws_access_key_id" \
-var "aws_secret_access_key=$aws_secret_access_key" \
-var "api_secret_name=$api_secret_name" \
-var "domain=$domain" \
-var "container_ver=${tag}" \
-var "api_bucket_name=$api_bucket_name" \
-var "ui_secret_name=$ui_secret_name" \
-var "aws_account_name=$aws_account_name" \
-var "localhost=$localhost" \
-var "container_image=$container_image" \
-var "force_deployment=$force_deployment" \
-auto-approve