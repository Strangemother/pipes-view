"""Frontend serves the endpoint for website interfacing.
"""
from flask import Flask, render_template

app = Flask(__name__)


def main():
    app.run(debug=True, port=6005)


@app.route("/")
def hello_world():
    return render_template('index.html')

@app.route("/dist/")
def dist_version():
    return render_template('index-dist.html')


if __name__ == '__main__':
    main()