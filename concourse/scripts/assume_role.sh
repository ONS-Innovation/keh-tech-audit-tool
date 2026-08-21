#!/bin/sh
set -eu

apk add --no-cache aws-cli podman jq iptables

# Check if aws_role_arn is set
if [ -z "${aws_role_arn:-}" ]; then
	echo "Error: aws_role_arn is not set."
	exit 1
fi

aws sts assume-role --output text \
	--role-arn "${aws_role_arn}" \
	--role-session-name concourse-pipeline-run \
	--query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" |
	awk -F '\t' '{print $1 > ("AccessKeyId")}{print $2 > ("SecretAccessKey")}{print $3 > ("SessionToken")}'

AWS_ACCESS_KEY_ID="$(cat AccessKeyId)"
AWS_SECRET_ACCESS_KEY="$(cat SecretAccessKey)"
AWS_SESSION_TOKEN="$(cat SessionToken)"

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN