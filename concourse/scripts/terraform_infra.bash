set -e
set -x

apk add --no-cache jq

aws_account_id=$(echo "$test_secret" | jq -r .aws_account_id)
aws_access_key_id=$(echo "$test_secret" | jq -r .aws_access_key_id)
aws_secret_access_key=$(echo "$test_secret" | jq -r .aws_secret_access_key)
api_secret_name=$(echo "$test_secret" | jq -r .api_secret_name)
domain=$(echo "$test_secret" | jq -r .domain)
container_ver=$(cat resource-repo/tag)
api_bucket_name=$(echo "$test_secret" | jq -r .api_bucket_name)
ui_secret_name=$(echo "$test_secret" | jq -r .ui_secret_name)
aws_account_name=$(echo "$test_secret" | jq -r .aws_account_name)
localhost=$(echo "$test_secret" | jq -r .localhost)
container_image=$(echo "$test_secret" | jq -r .container_image)
force_deployment=$(echo "$test_secret" | jq -r .force_deployment)

export AWS_ACCESS_KEY_ID=$aws_access_key_id
export AWS_SECRET_ACCESS_KEY=$aws_secret_access_key

git config --global url."https://x-access-token:$github_access_token@github.com/".insteadOf "https://github.com/"

cd resource-repo/terraform/service
terraform init -backend-config=env/dev/backend-dev.tfbackend -reconfigure
terraform apply \
-var "aws_account_id=$aws_account_id" \
-var "aws_access_key_id=$aws_access_key_id" \
-var "aws_secret_access_key=$aws_secret_access_key" \
-var "api_secret_name=$api_secret_name" \
-var "domain=$domain" \
-var "container_ver=$container_ver" \
-var "api_bucket_name=$api_bucket_name" \
-var "ui_secret_name=$ui_secret_name" \
-var "aws_account_name=$aws_account_name" \
-var "localhost=$localhost" \
-var "container_image=$container_image" \
-var "force_deployment=$force_deployment" \
-auto-approve