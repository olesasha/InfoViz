from flask import Flask, render_template
import pandas as pd
from sklearn import decomposition, preprocessing
import numpy as np

app = Flask(__name__)

# prevent caching the elements in the browser
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
# show changes without restarting the Flask server
app.config["TEMPLATES_AUTO_RELOAD"] = True

# the route leads to the main and the only page we are using for the project
@app.route("/")

# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():

    return render_template(
        "index.html"
    )

# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
