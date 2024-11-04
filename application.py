import json
import logging
import os

import boto3
import requests
from botocore.exceptions import ClientError
from flask import (
    Flask,
    abort,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from jinja2 import ChainableUndefined

# Basic logging information
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# SETTING OF API URL: Change if moving to production
API_URL = "https://dutwj6q915.execute-api.eu-west-2.amazonaws.com/dev"

# AWS S3 bucket settings
bucket_name = "keh-tech-audit-tool"
region_name = os.getenv("AWS_DEFAULT_REGION")
s3 = boto3.client("s3", region_name=region_name)

# Standard flask initialisation
app = Flask(__name__)
app.secret_key = "lsdbfnhjldfbvjlhdsblhjsd"
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")


# GET client keys from S3 bucket using boto3
def read_client_keys():
    try:
        response = s3.get_object(Bucket=bucket_name, Key="client_keys.json")
        client_keys = json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            client_keys = {}
        else:
            abort(500, description=f"Error reading client keys: {e}")
    return client_keys


# GET auto complete data from S3 bucket using boto3
def read_auto_complete_data():
    try:
        response = s3.get_object(Bucket=bucket_name, Key="array_data.json")
        array_data = json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            array_data = {}
        else:
            abort(500, description=f"Error reading client keys: {e}")
    return array_data


# SET client keys from S3 bucket using boto3
cognito_settings = read_client_keys()
AWS_COGNITO_CLIENT_ID = cognito_settings["AWS_COGNITO_CLIENT_ID"]
AWS_COGNITO_CLIENT_SECRET = cognito_settings["AWS_COGNITO_CLIENT_SECRET"]

# IMPORTANT: CHANGE WHEN MOVING TO PRODUCTION
# This is the redirect uri set in the Cognito app settings.
REDIRECT_URI = "http://localhost:8000"

# For the _template.njk to load info into the header of the page. Automatically loads the user's email into the header.
items = [{"text": "", "iconType": "person"}, {"text": "Sign Out", "url": "/sign-out"}]
items_none = []

# For the _template.njk to load info into the header of the page. Automatically loads the navigation depending on what page the user is on.
mainNavItems = [
    {"text": "Dashboard", "url": "/dashboard"},
    {"text": "Pre-Survey", "url": "/pre-survey"},
    {"text": "Survey", "url": "/survey"},
    {"text": "Submit", "url": "/validate_details"},
]

projectNavItems = [
    {"text": "Survey", "url": "/survey"},
    {"text": "Details", "url": "/pre-survey/project"},
    {"text": "Technical Contact", "url": "/survey/contact-tech"},
    {"text": "Delivery Contact", "url": "/survey/contact-manager"},
    {"text": "Project", "url": "/survey/project"},
    {"text": "Developed", "url": "/survey/developed"},
    {"text": "Stage", "url": "/survey/stage"},
    {"text": "Summary", "url": "/survey/project_summary"},
]

codeNavItems = [
    {"text": "Survey", "url": "/survey"},
    {"text": "Details", "url": "/pre-survey/architecture"},
    {"text": "Source Control", "url": "/survey/source_control"},
    {"text": "Hosting", "url": "/survey/hosting"},
    {"text": "Database", "url": "/survey/database"},
    {"text": "Summary", "url": "/survey/architecture_summary"},
]

techNavItems = [
    {"text": "Survey", "url": "/survey"},
    {"text": "Details", "url": "/pre-survey/technology"},
    {"text": "Languages", "url": "/survey/languages"},
    {"text": "Frameworks", "url": "/survey/frameworks"},
    {"text": "Integrations", "url": "/survey/integrations"},
    {"text": "Infrastructure", "url": "/survey/infrastructure"},
    {"text": "Summary", "url": "/survey/tech_summary"},
]


@app.context_processor
def inject_header():
    # IMPORTANT | MAY REVISE
    # Each page load, make sure the user is logged in.
    user_auth = get_email()
    if not user_auth:
        flash("Please re-login to authenticate your account.")
        return dict(items=items_none, currentPath=[], navItems=[])

    # Reaching this point means the user is logged in. This should not error.
    user_email = session.get("email", "No email found")

    # Injecting the user's email into the header and sorting navigation based on the current page.
    injected_items = items.copy()
    injected_items[0]["text"] = user_email
    current_url = request.path
    if current_url == "/dashboard":
        navItems = []
    elif current_url in [item["url"] for item in mainNavItems]:
        navItems = mainNavItems
    elif current_url in [item["url"] for item in projectNavItems]:
        navItems = projectNavItems
    elif current_url in [item["url"] for item in codeNavItems]:
        navItems = codeNavItems
    elif current_url in [item["url"] for item in techNavItems]:
        navItems = techNavItems
    else:
        navItems = []

    return dict(items=injected_items, currentPath=[current_url], navItems=navItems)


@app.route("/", methods=["GET"])
def home():
    # This is the login page. If there is URL/code=<code> then it will attempt exchange the code for tokens (ID and refresh).
    code = request.args.get("code")
    if code:
        token_response = exchange_code_for_tokens(code)
        if "id_token" in token_response and "refresh_token" in token_response:
            session["id_token"], session["refresh_token"] = (
                token_response["id_token"],
                token_response["refresh_token"],
            )
            # Once set in session, get email.
            get_email()
            # Goes to dashboard with tokens stored in session.
            flash("You have successfully logged in with Cognito")
            return redirect(url_for("dashboard"))
        else:
            # Goes back to home page with error message.
            flash("Failed to retrieve ID Token")
            return redirect(url_for("home"))

    return render_template("index.html", items=items_none)


# Basic sign out
@app.route("/sign-out", methods=["GET"])
def sign_out():
    session.clear()
    flash("You have successfully logged out")
    return redirect(url_for("home"))


# Make a GET request to '/autocomplete/<search>.json' and returned with a JSON list of whatever you searched for.
@app.route("/autocomplete/<search>.json", methods=["GET"])
def autocomplete(search):
    array_data = read_auto_complete_data()
    if search in array_data:
        # Formats the data into a list of dictionaries with the key 'en' and the value of the search result. This is the format needed for ONS autosuggest.
        result = [{"en": language.capitalize()} for language in array_data[search]]
        return json.dumps(result)
    else:
        abort(404, description=f"No autocomplete data found for type: {search}")


def exchange_code_for_tokens(code):
    # Hit AWS Cognito auth endpoint with specific payload for exchange tokens.
    token_url = (
        f"https://keh-tech-audit-tool.auth.eu-west-2.amazoncognito.com/oauth2/token"
    )
    payload = {
        "grant_type": "authorization_code",
        "code": f"{code}",
        "redirect_uri": f"{REDIRECT_URI}",
    }

    # For apps with secrets, secret has to be included in auth headers.
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    auth = (AWS_COGNITO_CLIENT_ID, AWS_COGNITO_CLIENT_SECRET)

    response = requests.post(token_url, data=payload, headers=headers, auth=auth)
    response_json = response.json()
    if response.status_code != 200:
        if response_json.get("error") == "invalid_grant":
            logger.error("Invalid authorization code")
            return {"error": "Invalid authorization code"}
        logger.error(f"Error: {response.status_code}, {response.text}")
        return {"error": response_json}
    else:
        # Setting the session tokens to be used in the session later in home().abort
        return response.json()


def get_email():
    try:
        headers = {"Authorization": f"{session['id_token']}"}
        user_request = requests.get(
            f"{API_URL}/api/user",
            headers=headers,
        )
        if user_request.status_code != 200:
            return False
        else:
            session["email"] = user_request.json()["email"]
            return True
    except Exception as error:
        logger.error(f"{error.__class__.__name__}: {error}")
        return False


@app.route("/dashboard", methods=["GET"])
def dashboard():
    headers = {"Authorization": f"{session['id_token']}"}
    projects = requests.get(
        f"{API_URL}/api/projects",
        headers=headers,
    ).json()
    try:
        if len(projects) == 0:
            flash("You have no projects. Get started by clicking 'Create a Project'.")
        return render_template(
            "dashboard.html", email=session["email"], projects=projects
        )
    except Exception as error:
        logger.error(error)
        flash("Please re-login to authenticate your account.")
        return redirect(url_for("home"))


@app.route("/project/<project_name>", methods=["GET"])
def view_project(project_name):
    headers = {"Authorization": f"{session['id_token']}"}
    projects = requests.get(
        f"{API_URL}/api/projects/{project_name}",
        headers=headers,
    ).json()
    # projects either returnes {'description': 'Project not found', 'message': None} or a project in dict form.
    print(projects)
    try:
        if projects["message"] and projects["message"] is None:
            flash("Project not found. Please try again.")
            return redirect(url_for("dashboard"))
    except Exception:
        return render_template("view_project.html", project=projects)


@app.route("/survey", methods=["GET", "POST"])
def survey():
    # ONLY GET AND POST ARE ALLOWED HENCE NO NEED FOR SECOND IF STATEMENT
    # IF METHOD IS 'GET' THEN THE SURVEY IS RENDERED
    if request.method == "GET":
        return render_template("survey.html")
    # IF METHOD IS 'NOT GET' THEN THE POST PROCESS BEGINS
    headers = {
        "Authorization": f"{session['id_token']}",
        "content-type": "application/json",
    }

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
    stage = json.loads(request.form["stage"])

    developed_company = ""
    if developed["developed"] == "Outsourced":
        developed_company = developed["outsource_company"]
    elif developed["developed"] == "Partnership":
        developed_company = developed["partnership_company"]

    data = {
        "user": [u for u in user],
        "details": [
            {
                "name": project["project_name"],
                "short_name": project["project_short_name"],
                "documentation_link": [project["doc_link"]],
                "project_description": project["project_description"],
            }
        ],
        "developed": [developed["developed"], [developed_company]],
        "source_control": source_control,
        "architecture": {
            "hosting": hosting,
            "database": database,
            "languages": languages,
            "frameworks": frameworks,
            "CICD": integrations,
            "infrastructure": infrastructure,
        },
        "stage": stage,
    }
    print(data)
    try:
        projects = requests.post(
            f"{API_URL}/api/projects",
            json=data,
            headers=headers,
        )
    except Exception:
        try:
            print(f"Request was not blocked but returned: {projects.json()}")
        except Exception as second_error:
            print(f"{second_error.__class__.__name__}: {second_error}")

    return redirect(url_for("dashboard"))


# ------------------------
# PRE-SURVEY RENDERING
# ------------------------


@app.route("/pre-survey", methods=["GET"])
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


# ------------------------
# PROJECT SECTION RENDERING
# ------------------------


@app.route("/survey/contact-tech", methods=["GET"])
def contact_tech():
    return render_template("/section_project/contact_tech.html")


@app.route("/survey/contact-manager", methods=["GET"])
def contact_manager():
    return render_template("/section_project/contact_manager.html")


@app.route("/survey/project", methods=["GET"])
def project():
    return render_template("/section_project/project.html")


@app.route("/survey/stage", methods=["GET"])
def stage():
    return render_template("/section_project/stage.html")


@app.route("/survey/developed", methods=["GET"])
def developed():
    return render_template("/section_project/developed.html")


# ------------------------
# CODE AND ARCHITECTURE SECTION RENDERING
# ------------------------


@app.route("/survey/source_control", methods=["GET"])
def source_control():
    stage = request.args.get("stage")
    if stage == "2":
        return render_template("/section_code/source_control_select.html")
    return render_template("/section_code/source_control.html")


@app.route("/survey/hosting", methods=["GET"])
def hosting():
    stage = request.args.get("stage")
    if stage == "2":
        return render_template("/section_code/hosting_select.html")
    return render_template("/section_code/hosting.html")


@app.route("/survey/database", methods=["GET"])
def database():
    return render_template("/section_code/database.html")


# ------------------------
# TECHNOLOGY SECTION RENDERING
# ------------------------


@app.route("/survey/languages", methods=["GET"])
def languages():
    return render_template("/section_technology/languages.html")


@app.route("/survey/frameworks", methods=["GET"])
def frameworks():
    return render_template("/section_technology/frameworks.html")


@app.route("/survey/integrations", methods=["GET"])
def integrations():
    return render_template("/section_technology/integrations.html")


@app.route("/survey/infrastructure", methods=["GET"])
def infrastructure():
    return render_template("/section_technology/infrastructure.html")


# ------------------------
# SUMMARY SECTION RENDERING
# ------------------------


@app.route("/survey/project_summary")
def project_summary():
    return render_template("chapter_summaries/project_summary.html")


@app.route("/survey/architecture_summary")
def architecture_summary():
    return render_template("chapter_summaries/architecture_summary.html")


@app.route("/survey/tech_summary")
def tech_summary():
    return render_template("chapter_summaries/tech_summary.html")


# ------------------------
# SUBMIT PROJECT PAGE RENDERING
# ------------------------


@app.route("/validate_details", methods=["GET"])
def validate_details():
    return render_template("validate_details.html")


if __name__ == "__main__":
    app.run(debug=True)
