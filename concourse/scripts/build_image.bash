set -e
set -x

cd ../..

aws ecr get-login-password --region region | podman login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.region.amazonaws.com

podman build -t tech_audit_tool:latest .

podman tag tech_audit_tool:latest ${aws_account_id}.dkr.ecr.region.amazonaws.com/tech_audit_tool:latest

podman push ${aws_account_id}.dkr.ecr.region.amazonaws.com/tech_audit_tool:latest
