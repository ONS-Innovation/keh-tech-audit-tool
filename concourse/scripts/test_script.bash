set -e
set -x

apk add --no-cache jq

echo "$test_secret" | jq .