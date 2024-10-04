from flask import Flask, render_template, request, url_for, redirect, session, flash
from jinja2 import ChainableUndefined

app = Flask(__name__)
app.secret_key = "lsdbfnhjldfbvjlhdsblhjsd"
app.jinja_env.undefined = ChainableUndefined

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

@app.route("/dashboard")
def dashboard():
    # api call here in place of dummy projects dict

    projects = [project for project in project_dict.values()]
    return render_template("dashboard.html", email=session["email"], password=session["password"], projects=projects)

@app.route("/project/<project_name>", methods=["GET"])
def view_project(project_name):
    # we make api call here innit
    pass


if __name__ == "__main__":
    app.run(debug=True)
