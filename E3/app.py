from flask import Flask, render_template
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

def get_circuit_data():
    data = ergast.get_circuits(season=2023, result_type='raw')  
    return data

# the route leads to the main and the only page we are using for the project
@app.route("/")
# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():

    return render_template(
        "index.html",
        globe_data = get_world_data(),
        circuit_data = get_circuit_data()
    )

# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
