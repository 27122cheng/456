from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route("/")
def index():
    return send_from_directory(os.path.dirname(__file__), "stock_detector.html")

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
