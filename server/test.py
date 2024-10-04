import os
import pytest
import json
from flask import Flask
from flask.testing import FlaskClient
from main import app, read_data, write_data

# Set AWS_DEFAULT_REGION environment variable
os.environ['AWS_DEFAULT_REGION'] = 'eu-west-2'

@pytest.fixture
def client():
    app.testing = True
    client = app.test_client()
    yield client

@pytest.fixture(autouse=True)
def setup_and_teardown():
    data = {
        'projects': [
            {'name': 'Project1', 'owner_email': 'owner1@example.com'},
            {'name': 'Project2', 'owner_email': 'owner2@example.com'}
        ],
        'users_projects': {
            'owner1@example.com': [{'name': 'Project1', 'owner_email': 'owner1@example.com'}],
            'owner2@example.com': [{'name': 'Project2', 'owner_email': 'owner2@example.com'}]
        }
    }

def test_home(client):
    response = client.get('/')
    assert response.status_code == 200
    assert response.data.decode('utf-8') == "Welcome to the KEH Tech Audit Tool API!"

def test_get_projects(client):
    response = client.get('/api/projects?owner_email=seb@ons.gov.uk')
    assert response.status_code == 200

def test_get_project(client):
    response = client.get('/api/projects/Project1?owner_email=seb@ons.gov.uk')
    assert response.status_code == 200

def test_create_project(client):
    new_project = {
            "project_name": "Project 5",
            "project_long_name": "This is project 1",
            "contact_email": "seb@ons.gov.uk",
            "owner_email": "seb@ons.gov.uk",
            "doc_link": "https://ons.gov.uk",
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
    response = client.post('/api/projects', data=json.dumps(new_project), content_type='application/json')
