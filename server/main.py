from flask import Flask, jsonify, request, abort
import json
import os
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)

# AWS configurations
bucket_name = "keh-tech-audit-tool"
object_name = "data.json"
region_name = os.getenv("AWS_DEFAULT_REGION")

# Initialize S3 client
s3 = boto3.client('s3', region_name=region_name)

def read_data():
    try:
        response = s3.get_object(Bucket=bucket_name, Key=object_name)
        data = json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            data = {'projects': []}
        else:
            abort(500, description=f"Error reading data: {e}")
    return data

def write_data(new_data):
    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=object_name,
            Body=json.dumps(new_data, indent=4).encode('utf-8')
        )
    except ClientError as e:
        abort(500, description=f"Error writing data: {e}")

@app.route('/')
def home():
    return "Welcome to the KEH Tech Audit Tool API!"

@app.route('/api/projects', methods=['GET'])
def get_projects():
    owner_email = request.args.get('owner_email')
    if not owner_email:
        abort(400, description="owner_email is required")
    data = read_data()
    user_projects = [proj for proj in data['projects'] if proj['owner_email'] == owner_email]
    return jsonify(user_projects)

@app.route('/api/projects/<project_name>', methods=['GET'])
def get_project(project_name):
    owner_email = request.args.get('owner_email')
    if not owner_email:
        abort(400, description="owner_email is required")
    data = read_data()
    project = next((proj for proj in data['projects'] if proj['project_name'] == project_name and proj['owner_email'] == owner_email), None)
    if project is None:
        abort(404, description="Project not found")
    return jsonify(project)

@app.route('/api/projects', methods=['POST'])
def create_project():
    new_project = request.get_json()
    if 'owner_email' not in new_project or 'project_name' not in new_project:
        abort(400, description="owner_email and project_name are required")
    
    data = read_data()
    if any(proj['project_name'] == new_project['project_name'] and proj['owner_email'] == new_project['owner_email'] for proj in data['projects']):
        abort(400, description="Project with the same name and owner already exists")
    
    data['projects'].append(new_project)
    write_data(data)
    return jsonify(new_project), 201

if __name__ == '__main__':
    app.run(debug=True, port=8000)
