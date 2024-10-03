from flask import Flask, render_template
from jinja2 import ChainableUndefined

app = Flask(__name__)
app.jinja_env.undefined = ChainableUndefined


@app.route("/")
def hello_world():
    return render_template("index.html", param="Hello world")


if __name__ == "__main__":
    app.run(debug=True)
