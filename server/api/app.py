import flask
import sys
from flask import Flask
from flask import request, Response
from flask_cors import CORS
from qiskit_sim import run


app = Flask(__name__)
CORS(app)

@app.route('/api/', methods=["POST"])
def hello():
    return run(request.json['code'])

if __name__ == '__main__':    
    app.run(host='0.0.0.0')


