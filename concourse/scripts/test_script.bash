set -e
set -x

apk add --no-cache jq

aws_access_key_id = $test_secret | jq .aws_access_key_id

echo $aws_access_key_id