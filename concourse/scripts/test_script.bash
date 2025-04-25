set -e
set -x

aws_access_key_id = $test_secret | jq -r .aws_access_key_id

echo aws_access_key_id