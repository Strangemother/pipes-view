"""Frontend serves the endpoint for website interfacing.
"""
from flask import Flask, render_template

app = Flask(__name__)


def main():
    app.run(debug=True, port=6005)


@app.route("/")
def hello_world():
    return render_template('index.html')

@app.route("/winbox/")
def winbox_view():
    return render_template('index-winbox.html')

@app.route("/drag-pan-zoom/")
def drag_pan_zoom():
    return render_template('index-dragsolo-infinitedrag.html')


if __name__ == '__main__':
    main()