set -e
set -x

apk add --no-cache jq

jq '.aws_access_key_id' $test_secret