from flask import Flask, render_template, jsonify
from polars import col as c
import pandas as pd
import fastf1 as ff1
import numpy as np
import polars as pl
import json


app = Flask(__name__)

# Global variable to speed up queries
global_lap_data = None

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
    df_circuits = pd.read_parquet("./static/data/all_tracks_new.parquet")
    return df_circuits.to_json(orient="records")

    """     all_circuits = []
    for gp_name, group in df_track_data.groupby("gp_name"):
        driver_data = {
            "gp_name": gp_name,
            "track_points": group[["x", "y"]].to_dict(orient="records"),
        }
        all_circuits.append(driver_data)

    return json.dumps(all_circuits) """


@app.route("/update_race_data/<int:year>/<int:round_number>")
def update_race_data(year, round_number):
    global global_lap_data

    df_race_data = pl.scan_parquet("./static/data/race_data.parquet")
    df_driver_data = pl.scan_parquet("./static/data/all_driver_data.parquet")

    df_lap_data = pl.scan_parquet("./static/data/all_laps.parquet")
    df_lap_data = df_lap_data.filter(
        c("year") == year, c("round_number") == round_number
    )

    df_race_data = df_race_data.filter(
        pl.col("year") == year, pl.col("round_number") == round_number
    )

    df_driver_data = df_driver_data.filter(
        pl.col("year") == year, pl.col("round_number") == round_number
    )

    df_driver_data = df_driver_data.select(
        [
            "round_number",
            "year",
            "DriverNumber",
            "Abbreviation",
            "TeamName",
            "TeamColor",
            "TeamId",
        ]
    )

    df_lap_data = df_lap_data.select(
        "round_number", "year", "DriverNumber", "LapNumber", "Position"
    )

    df_race_data = df_race_data.join(
        df_driver_data,
        left_on=["round_number", "year", "driver_number"],
        right_on=["round_number", "year", "DriverNumber"],
    )

    df_race_data = df_race_data.join(
        df_lap_data,
        left_on=["round_number", "year", "driver_number", "LapNumber"],
        right_on=["round_number", "year", "DriverNumber", "LapNumber"],
        how="left",
    )

    df_race_data = df_race_data

    # Convert columns to string for grouping
    df_race_data = df_race_data.with_columns(
        [
            pl.col("driver_number").cast(pl.Utf8),
            pl.col("year").cast(pl.Utf8),
            pl.col("round_number").cast(pl.Utf8),
        ]
    )

    # Group by the required columns
    grouped = df_race_data.groupby(["driver_number", "year", "round_number"]).agg(
        [
            pl.col("TeamName").first().alias("team_name"),
            pl.col("TeamColor").first().alias("team_color"),
            pl.struct(["x", "y"]).alias("positions"),
            pl.struct(["LapNumber"]).alias("lap"),
            pl.struct(["Position"]).alias("pos"),
        ]
    )

    # Convert to dictionary
    drivers = grouped.collect().to_dicts()

    # Convert to JSON
    drivers_json = json.dumps(drivers)

    return drivers_json


@app.route("/get_lap_data/<int:year>/<int:round_number>/<int:lap>")
def get_lap_data(year, round_number,lap):

    df_lap_data = pl.scan_parquet("./static/data/all_laps.parquet")
    df_lap_data = pl.scan_parquet("./static/data/all_laps.parquet")
    df_driver_data = pl.scan_parquet("./static/data/all_driver_data.parquet")

    df_lap_data = df_lap_data.select(
        [
            "round_number",
            "year",
            "Driver",
            "DriverNumber",
            "LapTime",
            "LapNumber",
            "IsPersonalBest",
            "Compound",
            "Position",
        ]
    )

    df_lap_data = df_lap_data.filter(c("year")==year, c("round_number")==round_number, c("LapNumber") <= lap)

    df_driver_data = df_driver_data.select(["round_number","year","DriverNumber","TeamColor"])

    df_lap_data = df_lap_data.join(df_driver_data, on=["round_number","year","DriverNumber"]).drop_nulls(subset="Position")

    grouped_lap_data = df_lap_data.group_by('DriverNumber').agg([
    pl.col('LapNumber').alias('lap'),
    pl.col('Position').alias('pos'),
    pl.col("TeamColor").first()

    ])

    output_dict = {}

    max_len = lap

    # Create the output dictionary from the grouped_lap_data DataFrame
    for row in grouped_lap_data.collect().rows():
        driver, lap_numbers, positions,team_color = row
    # Get the last lap number and position for padding

        last_position = positions[-1]
        last_lap = lap_numbers[-1]

        # Extend lap_numbers and positions arrays to ensure they have the same length
        lap_numbers.extend([last_lap] * (max_len - len(lap_numbers)))
        positions.extend([last_position] * (max_len - len(positions)))

        
        output_dict[driver] = {
            "values": [{"lap": x, "pos": y} for x, y in zip(lap_numbers, positions)],
            "color": f"#{team_color}"
    }

    return jsonify(output_dict)


@app.route("/")
def index():

    return render_template(
        "index_max.html", globe_data=get_globe_data(), circuit_data=dev_circuit_data()
    )


# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
