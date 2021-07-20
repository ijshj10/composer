import flask
import sys, os
from flask import Flask
from flask import request, Response
from flask_cors import CORS
from .qiskit_sim import run


app = Flask(__name__)
CORS(app)

@app.route('/api/', methods=["POST", "GET"])
def hello():
    if request.method == 'POST':
        result = run(request.json)
        return result, 200
    return 'hello'

if __name__ == '__main__':
    app.run()