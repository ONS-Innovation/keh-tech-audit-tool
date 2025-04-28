set -e
set -x

apk add --no-cache jq

aws_access_key_id= jq '.aws_access_key_id' $test_secret

echo $aws_access_key_id