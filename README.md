# API_BRANCH

To run API please import these credentials into the app:

```bash
export AWS_ACCESS_KEY_ID=<KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
export AWS_DEFAULT_REGION=eu-west-2
export AWS_SECRET_NAME=github-tooling-suite/onsdigital
```

*To run tests, import the same credentials into the test environment when running `make run-api-test`*

Then run to start the app on [http://localhost:8000](http://localhost:8000).

**Important:** Make to run on **localhost:8000** specifically or else Cognito will not work.

```bash
make run-api
```

```bash
make run-ui
```

There is not `make run/run-api`.


## Known future problems

`## HOSTING NEEDS CHANGING IN FUTURE [DO NOT DELETE]`

in application.py