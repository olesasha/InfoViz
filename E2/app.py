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
    return render_template("index.html")

    
@app.route('/heatmap_data')
def get_heatmapdata():
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"])
    df_agg_team = df_agg_team[df_agg_team["Team Name"]!="retired"]
    heatmap_data = pd.melt(df_agg_team, id_vars=["Team Name"])
    # Convert DataFrame to JSON and return
    heatmap_data = heatmap_data.to_json(orient='records')
    return heatmap_data

@app.route('/scatterplot_data')
def get_pcadata():
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"])
    
    df_agg_team = df_agg_team[df_agg_team["Team Name"]!="retired"]

    df_pca_team = df_agg_team.set_index("Team Name", drop=True)
    df_pca_team = df_pca_team.select_dtypes("number")

    scaler = preprocessing.StandardScaler()
    scaled_team_data = scaler.fit_transform(df_pca_team)

    pca = decomposition.PCA(n_components=2)
    pca_team_data = pca.fit_transform(scaled_team_data)

    df_pca_team_components = pd.DataFrame(pca_team_data, index=df_pca_team.index, columns=["x", "y"]).reset_index()

    # Convert DataFrame to JSON and return
    scatterplot_data = df_pca_team_components.to_json(orient='records')
    return scatterplot_data

@app.route('/lineplot_data')
def get_lineplotdata():
    df_cleaned_player_stats = pd.read_csv("./static/data/cleaned_df_player_stats.csv").drop(
        columns=["Unnamed: 0", "level_0", "index"])
    df_cleaned_player_stats = df_cleaned_player_stats[df_cleaned_player_stats["team_name"]!="retired"]
    # Convert DataFrame to JSON and return
    lineplot_data = df_cleaned_player_stats.to_json(orient='records')
    return lineplot_data

    
if __name__ == '__main__':
    app.run(debug=True)