import json
import logging
import os
import re
from enum import Enum
from http import HTTPStatus

import boto3
import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv
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

load_dotenv()
# Basic logging information
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# AWS S3 bucket settings
api_bucket_name = os.getenv("API_BUCKET_NAME")
region_name = "eu-west-2"
s3 = boto3.client("s3", region_name=region_name)

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# Standard flask initialisation
app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY")
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")


# GET auto complete data from S3 bucket using boto3
def read_auto_complete_data():
    try:
        response = s3.get_object(Bucket=api_bucket_name, Key="array_data.json")
        array_data = json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            array_data = {}
        else:
            abort(500, description=f"Error reading client keys: {e}")
    return array_data


# GET secrets from AWS Secrets Manager using boto3
def get_secret(env):
    secret_name = os.getenv(env)
    region_name = "eu-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    try:
        secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    secret = secret_value_response.get("SecretString", "")

    return secret


# SETTING OF API URL: Change if moving to production
ui_secret = json.loads(get_secret("UI_SECRET_NAME"))
if os.getenv("LOCALHOST", "false").lower() == "true":
    REDIRECT_URI = "http://localhost:8000"  # USED DURING DEVELOPMENT
    API_URL = "http://localhost:5000"
else:
    REDIRECT_URI = ui_secret["REDIRECT_URI"]  # USED DURING PRODUCTION
    API_URL = ui_secret["API_URL"]

# Standard flask initialisation
app = Flask(__name__)
app.secret_key = json.loads(get_secret("UI_SECRET_NAME"))["APP_SECRET_KEY"]
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")


# SET client keys from S3 bucket using boto3
cognito_settings = json.loads(get_secret("API_SECRET_NAME"))
AWS_COGNITO_CLIENT_ID = cognito_settings["COGNITO_CLIENT_ID"]
AWS_COGNITO_CLIENT_SECRET = cognito_settings["COGNITO_CLIENT_SECRET"]

# For the _template.njk to load info into the header of the page.
# Automatically loads the user's email into the header.
items = [{"text": "", "iconType": "person"}, {"text": "Sign Out", "url": "/sign-out"}]
items_none = []

# For the _template.njk to load info into the header of the page.
# Automatically loads the navigation depending on what page the user is on.
mainNavItems = [
    {"text": "Dashboard", "url": "/dashboard"},
    {"text": "Information", "url": "/pre-survey"},
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
    {"text": "Build and Deployment", "url": "/survey/integrations"},
    {"text": "Infrastructure", "url": "/survey/infrastructure"},
    {"text": "Summary", "url": "/survey/tech_summary"},
]

supportingNavItems = [
    {"text": "Survey", "url": "/survey"},
    {"text": "Details", "url": "/pre-survey/supporting_tools"},
    {"text": "Code Editors", "url": "/survey/code_editors"},
    {"text": "User Interface", "url": "/survey/user_interface"},
    {"text": "Diagrams", "url": "/survey/diagrams"},
    {"text": "Project Tracking", "url": "/survey/project_tracking"},
    {"text": "Documentation", "url": "/survey/documentation"},
    {"text": "Communication", "url": "/survey/communication"},
    {"text": "Collaboration", "url": "/survey/collaboration"},
    {"text": "Incident Management", "url": "/survey/incident_management"},
    {"text": "Miscellaneous", "url": "/survey/miscellaneous"},
    {"text": "Summary", "url": "/survey/supporting_tools_summary"},
]


def get_id_token():
    try:
        headers = {"Authorization": f"{session['id_token']}"}
    except KeyError:
        return redirect(url_for("home"))
    return headers


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
    elif current_url in [item["url"] for item in supportingNavItems]:
        navItems = supportingNavItems
    else:
        navItems = []

    return dict(items=injected_items, currentPath=[current_url], navItems=navItems)


@app.route("/", methods=["GET"])
def home():
    # This is the login page. If there is URL/code=<code> then it will
    # attempt exchange the code for tokens (ID and refresh).
    code = request.args.get("code")
    AWS_ENV = os.getenv("AWS_ACCOUNT_NAME")

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

    CLIENT_ID = AWS_COGNITO_CLIENT_ID
    return render_template(
        "index.html",
        items=items_none,
        CLIENT_ID=CLIENT_ID,
        REDIRECT_URI=REDIRECT_URI,
        AWS_ENV=AWS_ENV,
    )


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
    AWS_ENV = os.getenv("AWS_ACCOUNT_NAME")
    token_url = f"https://tech-audit-tool-api-{AWS_ENV}.auth.eu-west-2.amazoncognito.com/oauth2/token"
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
            f"{API_URL}/api/v1/user",
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
    headers = get_id_token()
    projects = requests.get(
        f"{API_URL}/api/v1/projects",
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
    # Sanitise project name to prevent attacks
    if not project_name or not re.match(r"^[a-zA-Z0-9_ -]+$", project_name):
        flash(
            "Invalid project name. Project names can only contain letters, numbers, hyphens and underscores."
        )
        return redirect(url_for("dashboard"))

    headers = get_id_token()

    user_email = session.get("email", "No email found")

    projects = requests.get(
        f"{API_URL}/api/v1/projects/{project_name}",
        headers=headers,
    )
    if projects.status_code != HTTPStatus.OK:
        flash("Project does not exist")
        return redirect(url_for("dashboard"))

    try:
        projects = projects.json()
    except Exception:
        flash("Something went wrong. Please try again.")
        return redirect(url_for("dashboard"))

    edit = False  # Boolean to check if the user can edit the project
    for user in projects["user"]:
        if user["email"] == user_email:
            edit = True
            break
    try:
        # message is only returned if there is an error. so if it is not None, there is an error
        if projects["message"]:
            flash(f"Project not found. Please try again. {projects['message']}")
            return redirect(url_for("dashboard"))
    except KeyError:
        return render_template("view_project.html", project=projects, edit=edit)
    except Exception as e:
        logger.error(f"Error: {e}")
        flash("Something went wrong. Please try again.")
        return redirect(url_for("dashboard"))


@app.route("/project/<project_name>/edit", methods=["GET"])
def edit_project(project_name):
    headers = get_id_token()
    # Sanitise project name to prevent attacks
    if not project_name or not re.match(r"^[a-zA-Z0-9_ -]+$", project_name):
        flash(
            "Invalid project name. Project names can only contain letters, numbers, hyphens and underscores."
        )
        return redirect(url_for("dashboard"))
    project = requests.get(f"{API_URL}/api/v1/projects/{project_name}", headers=headers)

    project = project.json()

    user_email = session.get("email", "No email found")
    users = [user["email"] for user in project["user"]]

    if user_email not in users:
        flash("You do not have permission to edit this project.")
        return redirect(url_for("dashboard"))

    edit = True

    return render_template(
        "validate_details.html", project=project, edit=edit, project_name=project_name
    )


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
        "code_editors",
        "user_interface",
        "diagrams",
        "project_tracking",
        "documentation",
        "communication",
        "collaboration",
        "incident_management",
        "miscellaneous",
        "project_name",
    ]
    for key in keys:
        if key == "miscellaneous":
            print(form[key])
    try:
        final_dict = {key: json.loads(form[key]) for key in keys}
    except Exception:
        keys.pop()
        final_dict = {key: json.loads(form[key]) for key in keys}
    return final_dict


@app.route("/survey", methods=["GET", "POST"])
def survey():
    if request.method == "GET":
        return render_template("survey.html")

    try:
        headers = {
            "Authorization": f"{session['id_token']}",
            "content-type": "application/json",
        }
    except KeyError:
        return redirect(url_for("home"))

    # Map form data
    form_data = map_form_data(request.form)
    # If developed is not empty, or fallback
    developed_company = ""
    form_data_developed = form_data.get("developed", ["", ""])
    if form_data_developed[0] == "In House":
        developed_data = ["In House", ""]
    elif form_data_developed[0] == "Outsourced":
        developed_company = form_data_developed[1]
        developed_data = [form_data_developed[0], developed_company]
    elif form_data_developed[0] == "Partnership":
        developed_company = form_data_developed[1]
        developed_data = [form_data_developed[0], developed_company]
    else:
        developed_data = ["", ""]
    try:
        previous_users = json.loads(
            request.form["project_users"]
        )  # checks if projects users gets sent through
    except Exception:
        previous_users = []

    new_users = []
    for user in form_data["user"]:
        if "Technical Contact" in user["roles"] or "Delivery Manager" in user["roles"]:
            new_users.append(user)  # append the technical contact and delivery manager
    for user in previous_users:
        if "Technical Contact" in user["roles"] and "Delivery Manager" in user["roles"]:
            break
        if (
            user not in new_users
        ):  # append the rest of the users if not found in new_users
            new_users.append(user)

    documentation_link = form_data["project"].get("documentation_link", "")
    if isinstance(documentation_link, str):
        try:
            # Try to parse as JSON string that might contain a list
            documentation_link = json.loads(documentation_link)
        except json.JSONDecodeError:
            # If it's a plain string, wrap it in a list
            documentation_link = [documentation_link]

    data = {
        "user": new_users,
        "details": [
            {
                "name": form_data["project"].get("name", ""),
                "short_name": form_data["project"].get("short_name", ""),
                "documentation_link": documentation_link,
                "project_description": form_data["project"].get(
                    "project_description", ""
                ),
                "programme_name": form_data["project"].get("programme_name", ""),
                "programme_short_name": form_data["project"].get(
                    "programme_short_name", ""
                ),
            }
        ],
        "developed": developed_data,
        "source_control": (
            form_data.get("source_control", {}).get("source_control", "")
            if isinstance(form_data.get("source_control"), dict)
            else form_data.get("source_control", "")
        ),
        "architecture": {
            "hosting": form_data.get("hosting", ""),
            "database": form_data.get("database", ""),
            "languages": form_data.get("languages", ""),
            "frameworks": form_data.get("frameworks", ""),
            "cicd": form_data.get("integrations", ""),
            "infrastructure": form_data.get("infrastructure", ""),
        },
        "stage": form_data.get("stage", ""),
        "supporting_tools": {
            "code_editors": form_data.get("code_editors", ""),
            "user_interface": form_data.get("user_interface", ""),
            "diagrams": form_data.get("diagrams", ""),
            "project_tracking": form_data.get("project_tracking", ""),
            "documentation": form_data.get("documentation", ""),
            "communication": form_data.get("communication", ""),
            "collaboration": form_data.get("collaboration", ""),
            "miscellaneous": form_data.get("miscellaneous", ""),
            "incident_management": form_data.get("incident_management", ""),
            "miscellaneous": (
            form_data.get("miscellaneous", {}).get("miscellaneous", "")
            if isinstance(form_data.get("miscellaneous"), dict)
            else form_data.get("miscellaneous", "")
        )
        },
    }

    try:
        if form_data.get("project_name"):
            requests.put(
                f"{API_URL}/api/v1/projects/{form_data['project_name']}",
                json=data,
                headers=headers,
            )
            flash("Project updated successfully!")
            return redirect(
                url_for("view_project", project_name=form_data["project_name"])
            )
        else:
            # This is a new project creation
            requests.post(
                f"{API_URL}/api/v1/projects",
                json=data,
                headers=headers,
            )
    except Exception as e:
        logger.error(f"Request was not blocked but returned: {e}")
        flash("An error occurred while saving the project")
        return redirect(url_for("dashboard"))

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


@app.route("/pre-survey/supporting_tools", methods=["GET"])
def supporting_tools_pre_survey():
    return render_template("/pre_survey/pre-survey-supporting-tools.html")


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
# SUPPORTING TOOLS SECTION RENDERING
# ------------------------


@app.route("/survey/code_editors", methods=["GET"])
def code_editors():
    return render_template("/section_supporting_tools/code_editors.html")


@app.route("/survey/user_interface", methods=["GET"])
def user_interface():
    return render_template("/section_supporting_tools/user_interface.html")


@app.route("/survey/diagrams", methods=["GET"])
def diagramming_tools():
    return render_template("/section_supporting_tools/diagrams.html")


@app.route("/survey/project_tracking", methods=["GET"])
def project_tracking():
    return render_template("/section_supporting_tools/project_tracking.html")


@app.route("/survey/documentation", methods=["GET"])
def documentation():
    return render_template("/section_supporting_tools/documentation.html")


@app.route("/survey/communication", methods=["GET"])
def communication():
    return render_template("/section_supporting_tools/communication.html")

@app.route("/survey/collaboration", methods=["GET"])
def collaboration():
    return render_template("/section_supporting_tools/collaboration.html")

@app.route("/survey/incident_management", methods=["GET"])
def incident_management():
    return render_template("/section_supporting_tools/incident_management.html")

@app.route("/survey/miscellaneous", methods=["GET"])
def miscellaneous():
    return render_template("/section_supporting_tools/miscellaneous.html")

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


@app.route("/survey/supporting_tools_summary")
def supporting_tools_summary():
    return render_template("chapter_summaries/supporting_tools_summary.html")


# ------------------------
# SUBMIT PROJECT PAGE RENDERING
# ------------------------


@app.route("/validate_details", methods=["GET"])
def validate_details():
    return render_template("validate_details.html")


if __name__ == "__main__":
    app.run(debug=False)
