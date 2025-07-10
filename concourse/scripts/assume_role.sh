set -euo pipefail

aws sts assume-role --output text \
    --role-arn "${aws_role_arn}" \
    --role-session-name concourse-pipeline-run \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    | awk -F '\t' '{print $1 > ("AccessKeyId")}{print $2 > ("SecretAccessKey")}{print $3 > ("SessionToken")}'


export AWS_ACCESS_KEY_ID="$(cat AccessKeyId)"
export AWS_SECRET_ACCESS_KEY="$(cat SecretAccessKey)"
export AWS_SESSION_TOKEN="$(cat SessionToken)"