set -e
set -x

apk add --no-cache jq

secret=$(echo "$test_secret" | jq .aws_access_key_id)

echo $secret