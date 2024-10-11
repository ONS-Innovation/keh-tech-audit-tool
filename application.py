from flask import Flask, render_template, request, url_for, redirect, session, flash
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
            flash("Failed to retrieve ID Token")
            return redirect(url_for("home"))
    return render_template("index.html")



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
        headers = {"Authorization": f"{session['id_token']}"}
        user_request = requests.get("https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/user", headers=headers)
        if user_request.status_code != 200:
            return {"error": "Failed to retrieve user information"}
        else:
            session["email"] = user_request.json()["email"]

    return response.json()


@app.route("/dashboard", methods=["GET"])
def dashboard():
    headers = {"Authorization": f"{session['id_token']}"}
    projects = requests.get("https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/projects", headers=headers).json()

    return render_template("dashboard.html", email=session["email"], projects=projects)

@app.route("/dashboard", methods=["POST"])
def add_project():
    project_name = request.form["project_name"]
    project_long_name = request.form["project_long_name"]
    contact_email = request.form["contact_email"]
    owner_email = request.form["owner_email"]
    doc_link = request.form["doc_link"]
    langframe_arr = request.form.getlist("con1[]")
    ide_arr = request.form.getlist("con2[]")
    misc_arr = request.form.getlist("con3[]")


    lang_frame_arr_temp = []
    ide_arr_temp = []
    misc_arr_temp = []

    if project_name == "":
        flash("Project name cannot be empty")

    for lang_frame in langframe_arr:
        lang_frame_arr_temp.append({"name": lang_frame})

    for ide in  ide_arr:
        ide_arr_temp.append({"name": ide})
    
    for misc in misc_arr:
        misc_arr_temp.append({"name": misc})

    project = {
        "project_name": project_name,
        "project_long_name": project_long_name,
        "contact_email": contact_email,
        "owner_email": owner_email,
        "doc_link": doc_link,
        "lang_frame_arr": lang_frame_arr_temp,
        "IDE_arr": ide_arr_temp,
        "misc_arr": misc_arr_temp
    }

    requests.post("http://127.0.0.1:8000/api/projects", json=project, params={"owner_email": "seb@ons.gov.uk"})
    
    return redirect(url_for("dashboard"))

@app.route("/project/<project_name>", methods=["GET"])
def view_project(project_name):
    headers = {"Authorization": f"{session['id_token']}"}
    projects = requests.get(f"https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev/api/projects/{project_name}", headers=headers).json()
    return render_template("view_project.html", project=projects)

@app.route("/pre-survey", methods=['GET'])
def pre_survey():
    return render_template("pre-survey.html")

@app.route("/survey", methods=['GET'])
def survey():
    return render_template("survey.html")

@app.route("/survey/you", methods=['GET'])
def you():
    return render_template("you.html")

if __name__ == "__main__":
    app.run(debug=True)
