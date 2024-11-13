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
from http import HTTPStatus
from enum import Enum

# Basic logging information
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# SETTING OF API URL: Change if moving to production
API_URL = os.getenv("API_URL")

# AWS S3 bucket settings
bucket_name = "keh-tech-audit-tool"
region_name = os.getenv("AWS_DEFAULT_REGION")
s3 = boto3.client("s3", region_name=region_name)

# Standard flask initialisation
app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY")
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")

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

# GET secrets from AWS Secrets Manager using boto3
def get_secrets():

    secret_name = "tech-audit-tool-api/secrets"
    region_name = "eu-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    secret = get_secret_value_response['SecretString']

    return secret


# SET client keys from S3 bucket using boto3
cognito_settings = json.loads(get_secrets())
AWS_COGNITO_CLIENT_ID = cognito_settings["COGNITO_CLIENT_ID"]
AWS_COGNITO_CLIENT_SECRET = cognito_settings["COGNITO_CLIENT_SECRET"]

# IMPORTANT: CHANGE WHEN MOVING TO PRODUCTION
# This is the redirect uri set in the Cognito app settings.
REDIRECT_URI = os.getenv("REDIRECT_URI")

# For the _template.njk to load info into the header of the page.
# Automatically loads the user's email into the header.
items = [{"text": "", "iconType": "person"}, {"text": "Sign Out", "url": "/sign-out"}]
items_none = []

# For the _template.njk to load info into the header of the page.
# Automatically loads the navigation depending on what page the user is on.
mainNavItems = [
    {"text": "Dashboard", "url": "/dashboard"},
    {"text": "Pre-Survey", "url": "/pre-survey"},
    {"text": "Survey", "url": "/survey"},
    {"text": "Submit", "url": "/validate_details"},
]

projectNavItems = [
    {"text": "Survey", "url": "/survey"},
    {"text": "Details", "url": "/pre-survey/project"},
    {"text": "Technical Contact", "url": "/survey/contact_tech"},
    {"text": "Delivery Contact", "url": "/survey/contact_manager"},
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

    # Injecting the user's email into the header and sorting navigation
    # based on the current page.
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
    # This is the login page. If there is URL/code=<code> then it will
    # attempt exchange the code for tokens (ID and refresh).
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

    return render_template("index.html", items=items_none, CLIENT_ID=AWS_COGNITO_CLIENT_ID)


# Basic sign out
@app.route("/sign-out", methods=["GET"])
def sign_out():
    session.clear()
    flash("You have successfully logged out")
    return redirect(url_for("home"))


# Make a GET request to '/autocomplete/<search>.json' and returned with
# a JSON list of whatever you searched for.
@app.route("/autocomplete/<search>.json", methods=["GET"])
def autocomplete(search):
    array_data = read_auto_complete_data()
    if search in array_data:
        # Formats the data into a list of dictionaries with the key 'en' and
        # the value of the search result. This is the format needed for ONS autosuggest.
        result = [{"en": language.capitalize()} for language in array_data[search]]
        return json.dumps(result)
    else:
        abort(404, description=f"No autocomplete data found for type: {search}")


def exchange_code_for_tokens(code):
    # Hit AWS Cognito auth endpoint with specific payload for exchange tokens.
    # This is the endpoint for the AWS Cognito user pool. It will not change.
    token_url = (
        "https://keh-tech-audit-tool.auth.eu-west-2.amazoncognito.com/oauth2/token"
    )
    payload = {
        "grant_type": "authorization_code",
        "code": f"{code}",
        "redirect_uri": REDIRECT_URI,
    }

    # For apps with secrets, secret has to be included in auth headers.
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    auth = (AWS_COGNITO_CLIENT_ID, AWS_COGNITO_CLIENT_SECRET)

    response = requests.post(token_url, data=payload, headers=headers, auth=auth)
    response_json = response.json()
    if response.status_code != HTTPStatus.OK:
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
        if user_request.status_code != HTTPStatus.OK:
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
    try:
        if projects["message"] is None:
            flash("Project not found. Please try again.")
            return redirect(url_for("dashboard"))
    except Exception:
        return render_template("view_project.html", project=projects)

# Improved readibility of the form data
def map_form_data(form):
    keys = [
        "user",
        "project",
        "developed",
        "source_control",
        "hosting",
        "database",
        "languages",
        "frameworks",
        "integrations",
        "infrastructure",
        "stage",
    ]
    return {key: json.loads(form[key]) for key in keys}


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

    # Improved readibility of the form data
    form_data = map_form_data(request.form)

    developed_company = ""
    if form_data["developed"]["developed"] == "Outsourced":
        developed_company = form_data["developed"]["outsource_company"]
    elif form_data["developed"]["developed"] == "Partnership":
        developed_company = form_data["developed"]["partnership_company"]

    data = {
        "user": [u for u in form_data["user"]],
        "details": [
            {
                "name": form_data["project"]["project_name"],
                "short_name": form_data["project"]["project_short_name"],
                "documentation_link": [form_data["project"]["doc_link"]],
                "project_description": form_data["project"]["project_description"],
            }
        ],
        "developed": [form_data["developed"]["developed"], [developed_company]],
        "source_control": form_data["source_control"],
        "architecture": {
            "hosting": form_data["hosting"],
            "database": form_data["database"],
            "languages": form_data["languages"],
            "frameworks": form_data["frameworks"],
            "CICD": form_data["integrations"],
            "infrastructure": form_data["infrastructure"],
        },
        "stage": form_data["stage"],
    }
    try:
        projects = requests.post(
            f"{API_URL}/api/projects",
            json=data,
            headers=headers,
        )
    except Exception:
        try:
            logger.error(f"Request was not blocked but returned: {projects.json()}")
        except Exception as second_error:
            logger.error(f"{second_error.__class__.__name__}: {second_error}")

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


@app.route("/survey/contact_tech", methods=["GET"])
def contact_tech():
    return render_template("/section_project/contact_tech.html")


@app.route("/survey/contact_manager", methods=["GET"])
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


class Stage(Enum):
    INITIAL = "1"
    SELECT = "2"

@app.route("/survey/source_control", methods=["GET"])
def source_control():
    stage = request.args.get("stage")
    if stage == Stage.SELECT.value:
        return render_template("/section_code/source_control_select.html")
    return render_template("/section_code/source_control.html")


@app.route("/survey/hosting", methods=["GET"])
def hosting():
    stage = request.args.get("stage")
    if stage == Stage.SELECT.value:
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
