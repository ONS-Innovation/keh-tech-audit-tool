repo_name=${1}

if [[ $# -gt 1 ]]; then
    branch=${2}
    git rev-parse --verify ${branch}
    if [[ $? -ne 0 ]]; then
        echo "Branch \"${branch}\" does not exist"
        exit 1
    fi
else
    branch=$(git rev-parse --abbrev-ref HEAD)
fi

if [[ ${branch} == "main" || ${branch} == "master" ]]; then
    env="prod"
else
    env="dev"
fi

if [[ ${env} == "dev" ]]; then
    tag=$(git rev-parse HEAD)
else
    tag=$(git tag | tail -n 1)
fi

fly -t aws-sdp set-pipeline -c concourse/ci.yml -p ${repo_name}-${branch} -v branch=${branch} -v tag=${tag} -v env=${env}

