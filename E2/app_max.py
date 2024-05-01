from flask import Flask, render_template
import json
import pandas as pd
from sklearn import decomposition, preprocessing

app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["TEMPLATES_AUTO_RELOAD"] = True


df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
    columns=["Unnamed: 0", "Team ID"]
)
df_agg_player = pd.read_csv("./static/data/df_agg_player.csv").drop(
    columns=["Unnamed: 0"]
)
df_cleaned_player_stats = pd.read_csv("./static/data/cleaned_df_player_stats.csv").drop(
    columns=["Unnamed: 0"]
)

df_pca_team = df_agg_team.set_index("Team Name", drop=True)
df_pca_team = df_pca_team.drop(index=["retired"]).select_dtypes("number")

scaler = preprocessing.StandardScaler()
scaled_team_data = scaler.fit_transform(df_pca_team)

pca = decomposition.PCA(n_components=2)
pca_team_data = pca.fit_transform(scaled_team_data)

df_pca_team = pd.DataFrame(pca_team_data, index=df_pca_team.index, columns=["x", "y"])


@app.route("/")
def data():

    # return the index file and the data
    return render_template(
        "index_max.html",
        data_team_pca=json.dumps(df_pca_team.to_json()),
        data_agg_team=json.dumps(df_agg_team.to_json()),
        data_agg_player=json.dumps(df_agg_player.to_json()),
        data_player_stats=json.dumps(df_cleaned_player_stats.to_json()),

    )


if __name__ == "__main__":
    app.run(debug=True)
