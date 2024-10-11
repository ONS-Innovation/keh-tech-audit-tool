# API_BRANCH

To run API please import these credentials into the app:

```bash
export AWS_ACCESS_KEY_ID=<KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
export AWS_DEFAULT_REGION=eu-west-2
export AWS_SECRET_NAME=github-tooling-suite/onsdigital
```

*To run tests, import the same credentials into the test environment when running `make run-api-test`*

Then run to start the app on [localhost](http://127.0.0.1:5000).

```bash
make run-api
```


## API Reference

#### Get all user projects

```http
  GET /api/projects
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `owner_email` | `string` | **Required**. Your owner_email |

Get's the projects associated with `owner_email`.

#### Get a specific user project

```http
  GET /api/projects/<project_name>
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `owner_email`      | `string` | **Required**. Your owner_email |
| `<project_name>`      | `string` | **Required**. The project you want to get |


Get's a specific project from a user.

#### Create a new project

```http
  POST /api/projects/
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `owner_email`      | `string` | **Required**. Your owner_email |

Send JSON in this format:
```JSON
{
    "project_name": "PROJECT SHORT NAME (KEH)",
    "project_long_name": "PROJECT LONG NAME (Knowledge Exchange Hub)",
    "contact_email": "POINT OF CONTACT EMAIL USER@ons.gov.uk",
    "owner_email": "OWNER'S EMAIL USER@ons.gov.uk",
    "doc_link": "DOCUMENT LINK http://confluence.ons.gov.uk",
    "IDE_arr": [
        {
            "name": "VSCODE"
        }
    ],
    "lang_frame_arr": [
        {
            "name": "Python"
        }
    ],
    "misc_arr": [
        {
            "name": "Slack"
        }
    ]
}
```
Create's a project.