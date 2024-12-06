# Testing
### Setting up test environment variables

```bash
export TEST_EMAIL=<email>
export TEST_PASSWORD=<password>
```

## Running tests
### Login test
```bash
cd tests
poetry run python3 test_login.py
```

If login is successful, cookies will be saved to the `cookies` directory. When running the tests again, the cookies will be used to log in automatically. If the session is expired, a user can login again and the cookies will be updated.