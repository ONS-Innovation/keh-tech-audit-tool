set -euo pipefail

export STORAGE_DRIVER=vfs
export PODMAN_SYSTEMD_UNIT=concourse-task

container_image=$(echo "$secrets" | jq -r .container_image)

aws ecr get-login-password --region eu-west-2 | podman --storage-driver=vfs login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com

# podman build -t ${container_image}:${tag} resource-repo

# Write token to a temp file and mount as a build secret
tmp_token_file="$(mktemp)"
chmod 600 "$tmp_token_file"
printf '%s' "${github_access_token}" > "$tmp_token_file"

# Create a gitconfig file that rewrites https://github.com/* to token auth
tmp_gitconfig_file="$(mktemp)"
chmod 600 "$tmp_gitconfig_file"
cat > "$tmp_gitconfig_file" <<EOF
[url "https://${github_access_token}:x-oauth-basic@github.com/"]
    insteadOf = https://github.com/
EOF

podman build \
  --secret id=github_token,src="$tmp_token_file" \
  --secret id=gitconfig,src="$tmp_gitconfig_file" \
  -t "${container_image}:${tag}" \
  resource-repo

rm -f "$tmp_token_file" "$tmp_gitconfig_file"

# # Write token to a temp file and mount as a build secret (only used when needed)
# tmp_token_file="$(mktemp)"
# chmod 600 "$tmp_token_file"
# printf '%s' "${github_access_token}" > "$tmp_token_file"

# podman build \
#   --secret id=github_token,src="$tmp_token_file" \
#   -t "${container_image}:${tag}" \
#   resource-repo

# rm -f "$tmp_token_file"

podman tag ${container_image}:${tag} ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}

podman push ${aws_account_id}.dkr.ecr.eu-west-2.amazonaws.com/${container_image}:${tag}

echo "Saving image as tar for next task..."
podman save --format=oci-dir "${container_image}:${tag}" -o built-images/tech_audit_tool.tar
