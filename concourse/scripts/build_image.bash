set -e
set -x

apk add --no-cache aws-cli podman

aws sts assume-role --output text \
    --role-arn "${aws_role_arn}" \
    --role-session-name concourse-pipeline-run \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    | awk -F '\t' '{print $1 > ("AccessKeyId")}{print $2 > ("SecretAccessKey")}{print $3 > ("SessionToken")}'


export AWS_ACCESS_KEY_ID="$(cat AccessKeyId)"
export AWS_SECRET_ACCESS_KEY="$(cat SecretAccessKey)"
export AWS_SESSION_TOKEN="$(cat SessionToken)"

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com

podman build -t tech-audit-tool:latest resource-repo

podman tag tech-audit-tool:latest ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest

podman push ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest
