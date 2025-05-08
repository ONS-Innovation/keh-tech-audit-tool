set -e
set -x

echo ${aws_account_id}

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com

podman build -t tech_audit_tool:latest resource-repo

podman tag tech_audit_tool:latest ${aws_account_id}.dkr.ecr.region.amazonaws.com/tech_audit_tool:latest

podman push ${aws_account_id}.dkr.ecr.region.amazonaws.com/tech_audit_tool:latest
