from flask import Flask, render_template
import pandas as pd
from sklearn import decomposition, preprocessing
import numpy as np

app = Flask(__name__)

# prevent caching the elements in the browser
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
# show changes without restarting the Flask server
app.config["TEMPLATES_AUTO_RELOAD"] = True


def get_heatmapdata(): 
    
    # drop columns which do not make sense in a heatmap
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"]
    )

    # remove the category "retired" because it not a team 
    df_agg_team = df_agg_team[df_agg_team["Team Name"] != "retired"]

    # transform the data from wide format to long and convert to json to satisfy the D3 heatmap requirements
    heatmap_data = pd.melt(df_agg_team, id_vars=["Team Name"], var_name="metric")
    heatmap_data = heatmap_data.to_json(orient="records")
    
    return heatmap_data


def get_scatterplot_data():

    # drop the index columns
    df_agg_team = pd.read_csv("./static/data/df_agg_team.csv").drop(
        columns=["Unnamed: 0", "Team ID"]
    )

    # remove "retired" because it is not a team
    df_agg_team = df_agg_team[df_agg_team["Team Name"] != "retired"]


    # set the index for the data frame to team and only select numerical values for PCA
    df_pca_team = df_agg_team.set_index("Team Name", drop=True)
    df_pca_team = df_pca_team.select_dtypes("number")

    # scale the data to the standard normal distribution
    scaler = preprocessing.StandardScaler()
    scaled_team_data = scaler.fit_transform(df_pca_team)

    # perform PCA with 2 components
    pca = decomposition.PCA(n_components=2)
    pca_team_data = pca.fit_transform(scaled_team_data)

    # prepare the data for the scatterplot by resetting the index and renaming the component columns
    df_pca_team_components = pd.DataFrame(
        pca_team_data, index=df_pca_team.index, columns=["x", "y"]
    ).reset_index()
    scatterplot_data = df_pca_team_components.to_json(orient="records")

    return scatterplot_data


def get_lineplotdata():

    # drop the columns irrelevant for the lineplot
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

    # specify the aggregation function for each column
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

    # removed observations for retired players to match the teams data
    df_cleaned_player_stats = df_cleaned_player_stats[
        df_cleaned_player_stats["team_name"] != "retired"
    ]

    # aggregate the data by team name and season
    team_summary = (
        df_cleaned_player_stats.groupby(["team_name", "season"])
        .agg(dict_agg)
        .reset_index()
    )

    # important: drop the newly created additonal levels as these lead to failure of the following functions
    team_summary.columns = team_summary.columns.get_level_values(0)

    #  calculate the cummulative sum of the total games and minutes played (this value is also used in the heatmap)
    team_summary["total_games"] = team_summary.groupby(["team_name"])[
        "total_games"
    ].cumsum()

    team_summary["minutes_played"] = team_summary.groupby(["team_name"])[
        "minutes_played"
    ].cumsum()

    # convert the metrics to percentages
    team_summary[["fg3p", "fg2p", "ftp"]] = team_summary[["fg3p", "fg2p", "ftp"]].apply(
        lambda x: round(x * 100, 2)
    )

    # rename the columns for easier metric selection 
    team_summary = team_summary.rename(
        columns={
            "name": "Number of players",
            "weight": "Avg weight of a player in lbs",
            "height": "Avg height of a player in inches",
            "birth_place": "Number of unique birth places",
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
            "pts": "Avg points per player",
        }
    )

    # format seasons as years like "1997-98" -> "1998" and "1999-00" -> "2000"
    team_summary["year"] = team_summary["season"].str.split("-").str[1]
    team_summary["year"] = team_summary["year"].astype(int)
    team_summary["year"] = team_summary["year"].apply(
        lambda x: 1900 + x if x > 2024 % 100 else 2000 + x
    )
    team_summary.drop(columns=["season"], inplace=True) # drop the old column season

    # rearrange the columns
    cols_to_move = ["team_name", "year"]
    team_summary = team_summary[
        cols_to_move + [col for col in team_summary.columns if col not in cols_to_move]
    ]

    # convert data to json
    lineplot_data = team_summary.to_json(orient="records")
    return lineplot_data


# the route leads to the main and the only page we are using for the project
@app.route("/")

# define the index function which will render the html file
# the function fetches the data on the server using the getter functions defined above
def index():

    return render_template(
        "index.html",
        heatmap_data=get_heatmapdata(),
        scatterplot_data=get_scatterplot_data(),
        lineplot_data=get_lineplotdata(),
    )

# initiate the server in debug mode
if __name__ == "__main__":
    app.run(debug=True)
