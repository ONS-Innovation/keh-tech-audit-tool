from flask import Flask, render_template, request, url_for, redirect, session, flash, abort
from jinja2 import ChainableUndefined
from botocore.exceptions import ClientError
import requests
import os
import boto3
import json

bucket_name = "keh-tech-audit-tool"
region_name = os.getenv("AWS_DEFAULT_REGION")

app = Flask(__name__)
app.secret_key = "lsdbfnhjldfbvjlhdsblhjsd"
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")


s3 = boto3.client('s3', region_name=region_name)

def read_client_keys():
    try:
        response = s3.get_object(Bucket=bucket_name, Key="client_keys.json")
        client_keys = json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            client_keys = {}
        else:
            abort(500, description=f"Error reading client keys: {e}")
    return client_keys

def read_auto_complete_data():
    try:
        response = s3.get_object(Bucket=bucket_name, Key="array_data.json")
        array_data = json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            array_data = {}
        else:
            abort(500, description=f"Error reading client keys: {e}")
    return array_data

cognito_settings = read_client_keys()
AWS_COGNITO_CLIENT_ID = cognito_settings["AWS_COGNITO_CLIENT_ID"]
AWS_COGNITO_CLIENT_SECRET = cognito_settings["AWS_COGNITO_CLIENT_SECRET"]
REDIRECT_URI = "http://localhost:8000"


@app.route("/", methods=["GET"])
def home():
    code = request.args.get('code')
    if code:
        token_response = exchange_code_for_tokens(code)
        if 'id_token' in token_response:
            session['id_token'] = token_response['id_token']
            flash("You have successfully logged in with Cognito")
            return redirect(url_for("dashboard"))
        else:
            print(token_response)
            flash("Failed to retrieve ID Token")
            return redirect(url_for("home"))
    return render_template("index.html")

@app.route("/sign-out", methods=["GET"])
def sign_out():
    session.clear()
    flash("You have successfully logged out")
    return redirect(url_for("home"))

@app.route("/autocomplete/<search>.json", methods=["GET"])
def autocomplete(search):
    array_data = read_auto_complete_data()
    if search in array_data:
        result = [{"en": language.capitalize()} for language in array_data[search]]
        return json.dumps(result)
    else:
        abort(404, description=f"No autocomplete data found for type: {search}")

def exchange_code_for_tokens(code):
    token_url = f"https://keh-tech-audit-tool.auth.eu-west-2.amazoncognito.com/oauth2/token"
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': f'{REDIRECT_URI}'
    }

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    auth = (AWS_COGNITO_CLIENT_ID, AWS_COGNITO_CLIENT_SECRET)

    response = requests.post(token_url, data=payload, headers=headers, auth=auth)

    if response.status_code != 200:
        if response.json().get('error') == 'invalid_grant':
            logger.error("Invalid authorization code")
            return {"error": "Invalid authorization code"}
        logger.error(f"Error: {response.status_code}, {response.text}")
        raise Exception(f"Error: {response.status_code}, {response.text}")
    else:
        if response.json()["id_token"]:
            session["id_token"] = response.json()["id_token"]
        else:
            raise Exception("Failed to retrieve ID Token")
        headers = {"Authorization": f"{session['id_token']}"}
        user_request = requests.get("https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/user", headers=headers)
        print(user_request.json())
        if user_request.status_code != 200:
            return {"error": "Failed to retrieve user information"}
        else:
            session["email"] = user_request.json()["email"]

    return response.json()

@app.route("/dashboard", methods=["GET"])
def dashboard():
    headers = {"Authorization": f"{session['id_token']}"}
    projects = requests.get("https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/projects", headers=headers).json()
    try:
        return render_template("dashboard.html", email=session["email"], projects=projects)
    except Exception as error:
        print(f"{error.__class__.__name__}: {error}")
        flash("Failed to retrieve ID Token")
        return redirect(url_for("home"))

@app.route("/project/<project_name>", methods=["GET"])
def view_project(project_name):
    headers = {"Authorization": f"{session['id_token']}"}
    print(project_name)
    projects = requests.get(f"https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/projects/{project_name}", headers=headers).json()
    return render_template("view_project.html", project=projects)

@app.route("/pre-survey", methods=['GET'])
def pre_survey():
    return render_template("/pre_survey/pre-survey.html")

@app.route("/pre-survey/project", methods=["GET"])
def project_pre_survey():
    return render_template("/pre_survey/pre-survey-project.html")

@app.route("/pre-survey/architecture", methods=["GET"])
def architecture_pre_survey():
    return render_template("/pre_survey/pre-survey-architecture.html")

@app.route("/pre-survey/technology", methods=["GET"])
def tech_pre_survey():
    return render_template("/pre_survey/pre-survey-tech.html")

@app.route("/survey", methods=['GET', 'POST'])
def survey():
    if request.method == 'POST':
        headers = {"Authorization": f"{session['id_token']}", "content-type": "application/json"}

        user = json.loads(request.form["user"])
        project = json.loads(request.form["project"])
        developed = json.loads(request.form["developed"])
        source_control = json.loads(request.form["source_control"])
        hosting = json.loads(request.form["hosting"])
        database = json.loads(request.form["database"])
        languages = json.loads(request.form["languages"])
        frameworks = json.loads(request.form["frameworks"])
        integrations = json.loads(request.form["integrations"])
        infrastructure = json.loads(request.form["infrastructure"])

        if developed["developed"] == "Outsourced":
            developed_company = developed["outsource_company"]
        elif developed["developed"] == "Partnership":
            developed_company = developed["partnership_company"]
        else:
            developed_company = None
        
        source_control = source_control["source_control"]
        database = database["database"]
        print([u for u in user])
        data = {
            "user": [u for u in user],
            "details": {
                "name": project["project_name"],
                "short_name": project["project_long_name"],
                "documentation_link": project["doc_link"],
            },
            "developed":[  
                developed["developed"],
                [developed_company]
            ],
            "source_control":[
                source_control
            ],
            "architecture": {
                "hosting": {"type": "Cloud", "detail": hosting},
                "database": {"main": database, "others": []},
                "languages": {"main": "", "others": languages},
                "frameworks": {"main": "", "others": frameworks},
                "CICD": {"main": "", "others": integrations},
                "infrastructure": {"main": "", "others": infrastructure}
                }
            }
        projects = requests.post(f"https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/projects", json=data, headers=headers)
        print(projects.json())
        return redirect(url_for("dashboard"))

    return render_template("survey.html")

@app.route("/survey/contact-tech", methods=['GET'])
def contact_tech():
    return render_template("/section_project/contact_tech.html")

@app.route("/survey/contact-manager", methods=['GET'])
def contact_manager():
    return render_template("/section_project/contact_manager.html")

@app.route("/survey/project", methods=['GET'])
def project():
    return render_template("/section_project/project.html")

@app.route("/survey/developed", methods=['GET'])
def developed():
    return render_template("/section_project/developed.html")

@app.route("/survey/source_control", methods=['GET'])
def source_control():
    return render_template("/section_code/source_control.html")

@app.route("/survey/architecture", methods=['GET'])
def architecture():
    return render_template("/section_code/architecture.html")

@app.route("/survey/database", methods=['GET'])
def database():
    return render_template("/section_code/database.html")

@app.route("/survey/languages", methods=['GET'])
def languages():
    return render_template("/section_technology/languages.html")

@app.route("/survey/frameworks", methods=['GET'])
def frameworks():
    return render_template("/section_technology/frameworks.html")

@app.route("/survey/integrations", methods=['GET'])
def integrations():
    return render_template("/section_technology/integrations.html")

@app.route("/survey/infrastructure", methods=['GET'])
def infrastructure():
    return render_template("/section_technology/infrastructure.html")

@app.route("/validate_details", methods=["GET"])
def validate_details():
    return render_template("validate_details.html")

@app.route("/survey/project_summary")
def project_summary():
    return render_template("chapter_summaries/project_summary.html")

@app.route("/survey/architecture_summary")
def architecture_summary():
    return render_template("chapter_summaries/architecture_summary.html")

@app.route("/survey/tech_summary")
def tech_summary():
    return render_template("chapter_summaries/tech_summary.html")



if __name__ == "__main__":
    app.run(debug=True)
