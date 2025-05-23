set -euo pipefail

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

cd ..

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com

podman build -t tech-audit-tool:${tag} resource-repo

podman tag tech-audit-tool:${tag} ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:${tag}

podman push ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:${tag}
