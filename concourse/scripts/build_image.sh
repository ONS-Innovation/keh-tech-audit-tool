set -euo pipefail

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

container_image=$(echo "$secrets" | jq -r .container_image)

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com


# Configure git to use the GitHub token for HTTPS clones (Poetry git dependencies)
# This makes "https://github.com/ONS-Innovation/..." authenticate automatically.
git config --global url."https://${github_access_token}:x-oauth-basic@github.com/".insteadOf "https://github.com/"

# (Optional) sanity check without printing the token
git config --global --get-regexp '^url\..*\.insteadOf$' | sed 's/https:\/\/.*@github.com/https:\/\/***@github.com/'


podman build -t ${container_image}:${tag} resource-repo

podman tag ${container_image}:${tag} ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}

podman push ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}

echo "Saving image as tar for next task..."
podman save --format=oci-dir "${container_image}:${tag}" -o built-images/tech_audit_tool.tar
