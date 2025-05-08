
cd ../..

./concourse/scripts/assume_role.bash


docker build -t tech-audit-tool .

docker tag tech-audit-tool:latest ${account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest

docker push ${account_id}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest