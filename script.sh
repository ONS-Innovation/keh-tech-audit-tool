#!/bin/bash

# This script is used to calculate the priority of the listener rule.
# It ensures that the calculated priority starts at the value defined in the START_PRIORITY constant.
# If the current highest priority already exceeds the start value then the priority is incremented to 
# the next highest value.
#
# This allows multiple services to be deployed to the same load balancer without conflicting priorities
# The start priority allows lower priority rules to be implemented should the need arise. 
#
# The environment must have variables set for AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_DEFAULT_REGION
# prior to running the script
#
# parameters are: 
# arn of the listener (e.g arn:aws:elasticloadbalancing:eu-west-2:xxxxxxxxx:listener/app/sdp-dev-service-lb/9f562f363e67cd39/1d07b514ca7c3239)
# region (e.g eu-west-2)

# Define a constant for the starting priority
START_PRIORITY=20

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_DEFAULT_REGION" ]; then
    echo "AWS credentials or region not set"
else

    aws elbv2 describe-rules --listener-arn $1 --region $AWS_DEFAULT_REGION  --query 'Rules[*].Priority' --output json | jq '[.[] | select(test("^[0-9]+$")) | tonumber] | max' > highest_priority.txt

    # read the contents of the file and assign to a variable
    highest_priority=$(<highest_priority.txt)

    # print the value to screen
    echo $highest_priority

    # If the value is < START_PRIORITY then set the priority to the start value minus 1
    # so that the terraform can increment it to the start value
    # else set it to the highest value
    if [ $highest_priority -lt $START_PRIORITY ]; then
        echo "Setting priority to START_PRIORITY - 1"
        priority=$((START_PRIORITY - 1))
    else
        priority=$((highest_priority))
        echo "Setting priority to $priority"
    fi

    # write the value to a file 
    echo $priority > highest_alb_listener_priority.txt
fi