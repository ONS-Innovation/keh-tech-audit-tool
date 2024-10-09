from flask import Flask, render_template, request, url_for, redirect, session, flash
from jinja2 import ChainableUndefined

import requests

app = Flask(__name__)
app.secret_key = "lsdbfnhjldfbvjlhdsblhjsd"
app.jinja_env.undefined = ChainableUndefined
app.jinja_env.add_extension("jinja2.ext.do")

project_dict = {
        "project1": {
            "name": "project1",
            "description": "This is the first project"
        },
        "project2": {
            "name": "project2",
            "description": "This is the second project"
        },
        "project3": {
            "name": "project3",
            "description": "This is the third project"
        }
    }

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/", methods=["POST"])
def login():
    email = request.form["email"]
    password = request.form["password"]

    if password == "":
        flash("Password cannot be empty")
        return redirect(url_for("home"))

    session["email"] = email
    session["password"] = password

    flash("You have successfully logged in")
    return redirect(url_for("dashboard"))

@app.route("/dashboard", methods=["GET"])
def dashboard():
    # api call here in place of dummy projects dict
    projects = requests.get("http://127.0.0.1:8000/api/projects", params={"owner_email": "seb@ons.gov.uk"}).json()

    # projects = [project for project in project_dict.values()]

    return render_template("dashboard.html", email=session["email"], password=session["password"], projects=projects)

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

    print(project_name, project_long_name, contact_email, owner_email, doc_link, langframe_arr, ide_arr, misc_arr)

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
    # we make api call here innit
    project = requests.get(f"http://127.0.0.1:8000/api/projects/{project_name}", params={"owner_email": "seb@ons.gov.uk"}).json()
    print(project)
    return render_template("view_project.html", project=project)

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
