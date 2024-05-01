from flask import Flask, render_template
import pandas as pd
import json

app = Flask(__name__)

@app.route("/")
def index():
    df = pd.read_csv("E2/static/data/df_agg_team.csv").drop(columns=["Unnamed: 0", "Team ID"])    
    df = df[["Team Name", "3pt", "Free Throws"]]
    chart_data = df.to_dict(orient='records')
    chart_data = json.dumps(chart_data)
    data = {'chart_data': chart_data}
    return render_template("index.html", data=data)

if __name__ == '__main__':
    app.run(debug=True)