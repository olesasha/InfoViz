from flask import Flask, render_template, jsonify
import pandas as pd
from sklearn import decomposition, preprocessing
import numpy as np
import fastf1
from fastf1.ergast import Ergast

ergast = Ergast()   # connection to Ergast API 
app = Flask(__name__)

# prevent caching the elements in the browser
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
# show changes without restarting the Flask server
app.config["TEMPLATES_AUTO_RELOAD"] = True

def get_world_data():
    with open('static/data/world.json', 'r') as file:
        data = file.read()
    return data

def get_circuit_data(season):
    data = ergast.get_circuits(season=season, result_type='pandas')  
    data = data.to_json(orient="records")
    return data

@app.route("/update_circuit_data/<int:season>")
def update_circuit_data(season):
    data = ergast.get_circuits(season=season, result_type='pandas')
    return jsonify(data.to_dict(orient="records"))


# the route leads to the main and the only page we are using for the project
@app.route("/")
# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():
    globe_data = get_world_data()
    circuit_data = get_circuit_data(2023)  # Initial data for the default season
    return render_template("index.html", globe_data=globe_data, circuit_data=circuit_data)

# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
