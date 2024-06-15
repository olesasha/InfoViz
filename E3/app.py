from flask import Flask, render_template, jsonify
import pandas as pd
import polars as pl
import numpy as np
import json 

app = Flask(__name__)

# Global variable to speed up queries
global_lap_data = None
# Prevent caching the elements in the browser
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
# Show changes without restarting the Flask server
app.config["TEMPLATES_AUTO_RELOAD"] = True

# load data once at startup
# Code snippet from fastf1 api docs: https://docs.fastf1.dev/examples_gallery/plot_annotate_corners.html
def rotate(xy, *, angle):
    rot_mat = np.array(
        [[np.cos(angle), np.sin(angle)], [-np.sin(angle), np.cos(angle)]]
    )
    return np.matmul(xy, rot_mat)

def get_circuit_data():
    # Temp development solution
    df_circuits = pd.read_parquet("./static/data/all_tracks_new.parquet")
    return df_circuits.to_json(orient="records")

def get_world_data():
    with open('static/data/world.json', 'r') as file:
        data = file.read()
    return data

def get_circuit_geo_data(season):
    circuit_geo_data = pd.read_csv("static/data/circuit_data.csv")
    data = circuit_geo_data.loc[circuit_geo_data["year"] == season]
    data_json = data.to_json(orient="records")
    return data_json

# update functions through endpoints

@app.route("/update_circuit_geo_data/<int:season>")
def update_circuit_geo_data(season):
    return get_circuit_geo_data(season)

@app.route("/update_race_data/<int:year>/<int:round_number>")
def update_race_data(year, round_number):
    global global_lap_data

    df_race_data = pl.scan_parquet("./static/data/race_data.parquet")
    df_driver_data = pl.scan_parquet("./static/data/all_driver_data.parquet")
    df_lap_data = pl.scan_parquet("./static/data/all_laps.parquet")

    df_lap_data = df_lap_data.filter(
        (pl.col("year") == year) & (pl.col("round_number") == round_number)
    )

    df_race_data = df_race_data.filter(
        (pl.col("year") == year) & (pl.col("round_number") == round_number)
    )

    df_driver_data = df_driver_data.filter(
        (pl.col("year") == year) & (pl.col("round_number") == round_number)
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

    # Convert columns to string for grouping
    df_race_data = df_race_data.with_columns(
        [
            pl.col("driver_number").cast(pl.Utf8),
            pl.col("year").cast(pl.Utf8),
            pl.col("round_number").cast(pl.Utf8),
        ]
    )

    # Group by the required columns
    grouped = df_race_data.group_by(["driver_number", "year", "round_number"]).agg(
        [
            pl.col("Abbreviation").first().alias("abbreviation"),
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
def get_lap_data(year, round_number, lap):
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

    df_lap_data = df_lap_data.filter((pl.col("year") == year) & (pl.col("round_number") == round_number) & (pl.col("LapNumber") <= lap))
    df_driver_data = df_driver_data.select(["round_number", "year", "DriverNumber", "TeamColor", "TeamName", "Abbreviation", "FirstName", "LastName"])
    df_lap_data = df_lap_data.join(df_driver_data, on=["round_number", "year", "DriverNumber"]).drop_nulls(subset="Position")

    grouped_lap_data = df_lap_data.groupby('DriverNumber').agg([
        pl.col('Driver').first().alias('Driver'),
        pl.col('LapNumber').alias('lap'),
        pl.col('Position').alias('pos'),
        pl.col("TeamColor").first(),
        pl.col("TeamName").first(),
        pl.col("FirstName").first(),
        pl.col("LastName").first(),
        pl.col("Abbreviation").first().alias('Abbreviation')
    ])

    output_dict = {}

    max_len = lap

    # Create the output dictionary from the grouped_lap_data DataFrame
    for row in grouped_lap_data.collect().rows():
        driver_number, driver_name, lap_numbers, positions, team_color, team_name, first_name, last_name, abbreviation = row

        # Get the last lap number and position for padding
        last_position = positions[-1]
        last_lap = lap_numbers[-1]

        # Extend lap_numbers and positions arrays to ensure they have the same length
        lap_numbers.extend([last_lap] * (max_len - len(lap_numbers)))
        positions.extend([last_position] * (max_len - len(positions)))

        output_dict[driver_number] = {
            "driver": driver_name,
            "first_name": first_name,
            "last_name": last_name,
            "team_name": team_name,
            "abbr": abbreviation,
            "values": [{"lap": x, "pos": y} for x, y in zip(lap_numbers, positions)],
            "color": f"#{team_color}"
        }

    return jsonify(output_dict)

@app.route("/get_tyre_data/<int:year>/<int:round_number>/<int:lap>")
def get_tyre_data(year, round_number, lap):

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
            "Stint",
            "Position",
        ]
    )

    df_lap_data = df_lap_data.filter((pl.col("year") == year) & (pl.col("round_number") == round_number) & (pl.col("LapNumber") <= lap))

    df_lap_data = df_lap_data.drop_nulls(subset="Compound")

    df_driver_data = df_driver_data.select(["round_number", "year", "DriverNumber", "TeamColor"])

    df_tyre_data = df_lap_data.join(df_driver_data, on=["round_number", "year", "DriverNumber"]).drop_nulls(subset="Position")

    grouped_lap_data = df_tyre_data.group_by(["Driver","Stint"]).agg([
        pl.col("LapNumber").min().alias("first_lap_stint"),
        pl.col("LapNumber").max().alias("last_lap_stint"),
        pl.col("Compound").last().alias("compound")
    ])

    output_dict = grouped_lap_data.collect().to_dicts()
    
    return jsonify(output_dict)

#if __name__ == "__main__":
#    app.run(debug=True)

# main page
@app.route("/")
def index():
    globe_data = get_world_data()
    circuit_geo_data = get_circuit_geo_data(2020)  # Initial data for the default season
    
    return render_template("index.html",
                        globe_data=globe_data,
                        circuit_geo_data=circuit_geo_data,
                        circuit_data=get_circuit_data())

# Initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
