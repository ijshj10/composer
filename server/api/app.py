import flask
import sys, os
from flask import Flask
from flask import request, Response
from flask_cors import CORS
from .qiskit_sim import run


app = Flask(__name__)
CORS(app)

experiments = []

# Submit experiment
# Client get experiment id for result retrieve
@app.route('/api/experiments', methods=["POST"])
def add_experiment():
    experiments.append({"done": False})

    # This code should run in background
    result = run(request.json)
    experiments[-1]["result"] = result
    experiments[-1]["done"] = True

    return {"id": len(experiments) -1 }, 200

@app.route('/api/experiments/<int:id>', methods=["GET"])
def get_experiment(id):
    return experiments[id]

if __name__ == '__main__':
    app.run()