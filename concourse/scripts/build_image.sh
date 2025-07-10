set -euo pipefail

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

container_image=$(echo "$secrets" | jq -r .container_image)

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com

podman build -t ${container_image}:${tag} resource-repo

podman tag ${container_image}:${tag} ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}

podman push ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}
