tag=$(git rev-parse HEAD)

if [ ${#1} -gt 0 ]; then
    branch=${1}
else
    branch=$(git rev-parse --abbrev-ref HEAD)
fi

fly -t aws-sdp set-pipeline -c concourse/ci.yml -p KEH-TAT-UI -v branch=$(echo ${branch}) -v tag=$(echo ${tag}) 
