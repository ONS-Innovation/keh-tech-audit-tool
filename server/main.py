from flask import Flask, jsonify, request, abort
import json
import os

app = Flask(__name__)

DATA_FILE = './server/data.json'

def read_data():
    if not os.path.exists(DATA_FILE):
        return {'projects': []}
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

def write_data(new_data):
    data = read_data()
    data.update(new_data)
    with open(DATA_FILE, 'w') as file:
        json.dump(data, file, indent=4)

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

@app.route('/api/projects/<project_name>', methods=['PUT'])
def edit_project(project_name):
    owner_email = request.args.get('owner_email')
    if not owner_email:
        abort(400, description="owner_email is required")
    
    updated_data = request.get_json()
    data = read_data()
    project = next((proj for proj in data['projects'] if proj['project_name'] == project_name and proj['owner_email'] == owner_email), None)
    if project is None:
        abort(404, description="Project not found")
    
    project.update(updated_data)
    write_data({'projects': data['projects']})
    return jsonify(project)

if __name__ == '__main__':
    app.run(debug=True)
