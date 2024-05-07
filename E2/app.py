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
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"]
    )
    df_agg_player = pd.read_csv("./static/data/df_agg_player.csv").drop(
        columns=["Unnamed: 0"]
    )

    df_cleaned_player_stats = pd.read_csv("./static/data/cleaned_df_player_stats.csv").drop(
        columns=["Unnamed: 0"]
    
)
    

    df_agg_player = df_agg_player[df_agg_player["Team Name"]!="retired"]
    df_agg_team = df_agg_team[df_agg_team["Team Name"]!="retired"]


    df_pca_team = df_agg_team.set_index("Team Name", drop=True)
    df_pca_team = df_pca_team.select_dtypes("number")

    scaler = preprocessing.StandardScaler()
    scaled_team_data = scaler.fit_transform(df_pca_team)

    pca = decomposition.PCA(n_components=2)
    pca_team_data = pca.fit_transform(scaled_team_data)

    df_pca_team_components = pd.DataFrame(pca_team_data, index=df_pca_team.index, columns=["x", "y"])
    
    scaled_with_labels = pd.DataFrame(scaled_team_data,columns=df_pca_team.columns, index=df_pca_team.index)
    scaled_with_labels = scaled_with_labels.reset_index()
    
    return render_template("index.html")

    
@app.route('/data')
def get_data():
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"])
    chart_data = pd.melt(df_agg_team, id_vars=["Team Name"])
    # Convert DataFrame to JSON and return
    chart_data = chart_data.to_json(orient='records')
    #chart_data = json.dumps(chart_data)
    data = chart_data
    return data


if __name__ == '__main__':
    app.run(debug=True)