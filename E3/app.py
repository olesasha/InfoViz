from flask import Flask, render_template
import pandas as pd
from sklearn import decomposition, preprocessing
import numpy as np

app = Flask(__name__)

# prevent caching the elements in the browser
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
# show changes without restarting the Flask server
app.config["TEMPLATES_AUTO_RELOAD"] = True

def get_globe_data():
    data = [
    {"latitude": 22, "longitude": 88},
    {"latitude": 12.61315, "longitude": 38.37723},
    {"latitude": -30, "longitude": -58},
    {"latitude": -14.270972, "longitude": -170.132217},
    {"latitude": 28.033886, "longitude": 1.659626},
    {"latitude": 40.463667, "longitude": -3.74922},
    {"latitude": 35.907757, "longitude": 127.766922},
    {"latitude": 23.634501, "longitude": -102.552784}
    ]
    return data

# the route leads to the main and the only page we are using for the project
@app.route("/")
# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():

    return render_template(
        "index.html",
        globe_data=get_globe_data()
    )

# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
