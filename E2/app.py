from flask import Flask, render_template
import pandas as pd
import json

app = Flask(__name__)

@app.route("/")
def index():
    df = pd.read_csv("E2/static/data/df_agg_team.csv").drop(columns=["Unnamed: 0", "Team ID"])    
    df = df[['Team Name','Number of Players', 'Height',
       'Weight', 'Number of Birth Places', 'Total Games',
       'Total Minutes Played', 'Field Goals', 'Field Goals Attempted',
       'Field Goal %', '3pt', '3pt Attempted', '3pt %', '2pt', '2pt Attempted',
       '2pt %', 'Free Throws', 'Free Throws Attempted', 'Free Throws %',
       'Offensive Rebounds', 'Defensive Rebounds', 'Total Rebounds', 'Assists',
       'Steals', 'Blocks', 'Turnovers', 'Personal Fouls', 'Points']]
    df = pd.melt(df, id_vars=["Team Name"])
    chart_data = df.to_dict(orient='records')
    chart_data = json.dumps(chart_data)
    data = {'chart_data': chart_data}
    return render_template("index.html", data=data)

if __name__ == '__main__':
    app.run(debug=True)