# KEH | Tech Audit Tool - UI

To run API please import these credentials into the app:

```bash
export AWS_ACCESS_KEY_ID=<KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
export AWS_DEFAULT_REGION=eu-west-2
export AWS_SECRET_NAME=github-tooling-suite/onsdigital
```


Then run to start the app on [http://localhost:8000](http://localhost:8000).

**Important:** Make to run on **localhost:8000** specifically or else Cognito will not work.

```bash
make install
```

```bash
make run-ui
```

There is not `make run/run-api`.