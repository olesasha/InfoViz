from flask import Flask, render_template
import pandas as pd
from sklearn import decomposition, preprocessing
import numpy as np

app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["TEMPLATES_AUTO_RELOAD"] = True


def get_heatmapdata():
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"]
    )
    df_agg_team = df_agg_team[df_agg_team["Team Name"] != "retired"]
    heatmap_data = pd.melt(df_agg_team, id_vars=["Team Name"], var_name="metric")
    # Convert DataFrame to JSON and return
    heatmap_data = heatmap_data.to_json(orient="records")
    return heatmap_data


def get_scatterplot_data():
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"]
    )

    df_agg_team = df_agg_team[df_agg_team["Team Name"] != "retired"]

    df_pca_team = df_agg_team.set_index("Team Name", drop=True)
    df_pca_team = df_pca_team.select_dtypes("number")

    scaler = preprocessing.StandardScaler()
    scaled_team_data = scaler.fit_transform(df_pca_team)

    pca = decomposition.PCA(n_components=2)
    pca_team_data = pca.fit_transform(scaled_team_data)

    df_pca_team_components = pd.DataFrame(
        pca_team_data, index=df_pca_team.index, columns=["x", "y"]
    ).reset_index()

    # Convert DataFrame to JSON and return
    scatterplot_data = df_pca_team_components.to_json(orient="records")

    return scatterplot_data


def get_lineplotdata():

    df_cleaned_player_stats = pd.read_csv(
        "./static/data/cleaned_df_player_stats.csv"
    ).drop(
        columns=[
            "Unnamed: 0",
            "level_0",
            "index",
            "teams",
            "player_id",
            "player_url",
            "retired",
            "position",
            "games_started",
            "full_name",
            "current_team_id",
        ]
    )

    dict_agg = {
        "name": [lambda x: len(np.unique(x))],
        "weight": ["mean"],
        "height": ["mean"],
        "birth_place": [lambda x: len(np.unique(x))],
        "total_games": ["sum"],
        "minutes_played": ["sum"],
        "fg3": ["mean"],
        "fg2": ["mean"],
        "fg": ["mean"],
        "fg3a": ["mean"],
        "fg2a": ["mean"],
        "fg3p": ["mean"],
        "fg2p": ["mean"],
        "ft": ["mean"],
        "fta": ["mean"],
        "ftp": ["mean"],
        "orb": ["mean"],
        "drb": ["mean"],
        "trb": ["mean"],
        "ast": ["mean"],
        "stl": ["mean"],
        "blk": ["mean"],
        "tov": ["mean"],
        "pts": ["mean"],
    }

    df_cleaned_player_stats = df_cleaned_player_stats[
        df_cleaned_player_stats["team_name"] != "retired"
    ]
    team_summary = (
        df_cleaned_player_stats.groupby(["team_name", "season"])
        .agg(dict_agg)
        .reset_index()
    )

    team_summary['total_games'] = team_summary.groupby(['team_name'])['total_games'].cumsum()
    team_summary['minutes_played'] = team_summary.groupby(['team_name'])['minutes_played'].cumsum()
    
    team_summary[["fg3p", "fg2p", "ftp"]] = team_summary[["fg3p", "fg2p", "ftp"]].apply(lambda x: round(x*100, 2))
    
    team_summary.columns = team_summary.columns.get_level_values(0)

    team_summary = team_summary.rename(columns={"name": "Number of players",
                                                "weight" : "Avg weight of a player in lbs",
                                                "height": "Avg height of a player in inches",
                                                "birth_place" : "Number of unique birth places",
                                                "total_games": "Total Games",
                                                "minutes_played": "Total minutes played",
                                                "fg3": "Avg number of 3pt per player",
                                                "fg2": "Avg number of 2pt per player",
                                                "fg": "Avg number of field goals per player",
                                                "fg3a": "Avg number of 3pt attempts per player",
                                                "fg2a": "Avg number of 2pt attempts per player",
                                                "fg3p": "Avg percent of successful 3pt per player",
                                                "fg2p": "Avg percent of successful 2pt per player",
                                                "ft": "Avg number of free throws per player",
                                                "fta": "Avg number of free throw attempts per player",
                                                "ftp": "Avg percent of successful free throws per player",
                                                "orb": "Avg number of offensive rebounds per player",
                                                "drb": "Avg number of defensive rebounds per player",
                                                "trb": "Avg number of total rebounds per player",
                                                "ast": "Avg number of assists per player",
                                                "stl": "Avg number of steals per player",
                                                "blk": "Avg number of blocks per player",
                                                "tov": "Avg number of turonvers per player",
                                                "pts": "Avg points per player"
                                                })

    team_summary["year"] = team_summary["season"].str.split("-").str[1]
    team_summary["year"] = team_summary["year"].astype(int)
    team_summary["year"] = team_summary["year"].apply(
        lambda x: 1900 + x if x > 2024 % 100 else 2000 + x
    )
    team_summary.drop(columns=["season"], inplace=True)

    cols_to_move = ["team_name", "year"]
    team_summary = team_summary[
        cols_to_move + [col for col in team_summary.columns if col not in cols_to_move]
    ]

    # Convert DataFrame to JSON and return
    lineplot_data = team_summary.to_json(orient="records")
    return lineplot_data


@app.route("/")
def index():
    return render_template(
        "index.html",
        heatmap_data=get_heatmapdata(),
        scatterplot_data=get_scatterplot_data(),
        lineplot_data=get_lineplotdata(),
    )


if __name__ == "__main__":
    app.run(debug=True)
