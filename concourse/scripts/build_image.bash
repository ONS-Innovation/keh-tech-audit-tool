cd ../..

./assume_role.bash

docker build -t tech-audit-tool .

docker tag tech-audit-tool:latest ${aws_account_sdp_dev}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest

docker push ${aws_account_sdp_dev}.dkr.ecr.eu-west-2.amazonaws.com/tech-audit-tool:latest