from flask import Flask, render_template
import pandas as pd
import fastf1 as ff1
import numpy as np
import json


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
        {"latitude": 23.634501, "longitude": -102.552784},
    ]
    return data


# Code snippet from fastf1 api docs: https://docs.fastf1.dev/examples_gallery/plot_annotate_corners.html
def rotate(xy, *, angle):
    rot_mat = np.array(
        [[np.cos(angle), np.sin(angle)], [-np.sin(angle), np.cos(angle)]]
    )
    return np.matmul(xy, rot_mat)


# Heavily inspired by fastf1 api docs: https://docs.fastf1.dev/examples_gallery/plot_annotate_corners.html
def get_circuit_data():
    session = ff1.get_session(2023, "Monza", "R")
    session.load()

    lap = session.laps.pick_fastest()
    pos = lap.get_pos_data()

    # Get an array of shape [n, 2] where n is the number of points and the second
    # axis is x and y.
    track = pos.loc[:, ("X", "Y")].to_numpy()

    circuit_info = session.get_circuit_info()
    circuit_info
    # Convert the rotation angle from degrees to radian.
    track_angle = circuit_info.rotation / 180 * np.pi

    # Rotate and plot the track map.
    rotated_track = rotate(track, angle=track_angle)
    return pd.DataFrame(rotated_track, columns=["X", "Y"]).to_json()


def dev_circuit_data():
    # Temp development solution
    df_circuits = pd.read_parquet("./static/data/all_tracks.parquet")
    #df_circuits.loc[:,["x","y"]] = df_circuits.loc[:,["x","y"]].round(0).astype("Int16")
    return df_circuits.to_json(orient="records")
    """     all_circuits = []
    for event_name, group in df_track_data.groupby("event_name"):
        driver_data = {
            "event_name": event_name,
            "track_points": group[["x", "y"]].to_dict(orient="records"),
        }
        all_circuits.append(driver_data)

    return json.dumps(all_circuits) """



def dev_driver_pos():
    df_drivers = pd.read_parquet(
        "static/data/all_driver_pos.parquet"
      #  "/Users/max/Library/Mobile Documents/com~apple~CloudDocs/100 Hochschule/110 TU Wien/SoSe 24/InfoVis/InfoViz/E3/static/data/all_driver_pos.parquet"
    )

    df_drivers = df_drivers.replace({"TSU": None}).dropna()
    drivers = []
    for driver, group in df_drivers.groupby("driver"):
        driver_data = {
            "driver": driver,
            "team": group["team"].iloc[0],
            "color": group["color"].iloc[0],
            "positions": group[["X", "Y"]].to_dict(orient="records"),
        }
        drivers.append(driver_data)

    return json.dumps(drivers)


# the route leads to the main and the only page we are using for the project
@app.route("/")
# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():

    return render_template(
        "index_max.html",
        globe_data=get_globe_data(),
        circuit_data=dev_circuit_data(),
        driver_pos_data=dev_driver_pos(),
    )


# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
