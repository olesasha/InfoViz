from flask import Flask, render_template
import pandas as pd
import json
from sklearn import decomposition, preprocessing

app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/")
def index():
    df_agg_team = pd.read_csv("E2/static/data/df_agg_team.csv").drop(columns=["Unnamed: 0", "Team ID"])    
    df_agg_team = df_agg_team[['Team Name','Number of Players', 'Height',
       'Weight', 'Number of Birth Places', 'Total Games',
       'Total Minutes Played', 'Field Goals', 'Field Goals Attempted',
       'Field Goal %', '3pt', '3pt Attempted', '3pt %', '2pt', '2pt Attempted',
       '2pt %', 'Free Throws', 'Free Throws Attempted', 'Free Throws %',
       'Offensive Rebounds', 'Defensive Rebounds', 'Total Rebounds', 'Assists',
       'Steals', 'Blocks', 'Turnovers', 'Personal Fouls', 'Points']]
    
    df_pca_team = df_agg_team.set_index("Team Name", drop=True)
    df_pca_team = df_pca_team.drop(index=["retired"]).select_dtypes("number")

    scaler = preprocessing.StandardScaler()
    scaled_team_data = scaler.fit_transform(df_pca_team)

    pca = decomposition.PCA(n_components=2)
    pca_team_data = pca.fit_transform(scaled_team_data)

    df_pca_team_components = pd.DataFrame(pca_team_data, index=df_pca_team.index, columns=["x", "y"])
    
    scaled_with_labels = pd.DataFrame(scaled_team_data,columns=df_pca_team.columns, index=df_pca_team.index)
    scaled_with_labels = scaled_with_labels.reset_index()
    
    chart_data = pd.melt(df_agg_team, id_vars=["Team Name"])
    chart_data = chart_data.to_dict(orient='records')
    chart_data = json.dumps(chart_data)
    data = {'chart_data': chart_data}
    return render_template("index.html", data=data)

if __name__ == '__main__':
    app.run(debug=True)