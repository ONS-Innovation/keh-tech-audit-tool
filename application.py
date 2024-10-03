from flask import Flask, render_template, request, url_for, redirect, session, flash
from jinja2 import ChainableUndefined

app = Flask(__name__)
app.secret_key = "lsdbfnhjldfbvjlhdsblhjsd"
app.jinja_env.undefined = ChainableUndefined


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

    return render_template("dashboard.html", email=session["email"], password=session["password"])



if __name__ == "__main__":
    app.run(debug=True)
