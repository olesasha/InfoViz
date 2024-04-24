from flask import Flask, render_template
import json
import pandas as pd
from sklearn import decomposition,preprocessing

app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True


df_teams_agg = pd.read_csv("E2/static/data/agg_teams.csv")
df_player_scoring = pd.read_csv("E2/static/data/agg_player_scoring_stats.csv")
df_data_post_3_point_line = pd.read_csv("E2/static/data/data_post_3_point_line.csv")

scaler = preprocessing.StandardScaler()
scaler.fit(df_teams_agg)




@app.route('/')
def data():
    # replace this with the real data
    testData = ["hello", "infovis", "2024"]

    # return the index file and the data
    return render_template("index.html", data=json.dumps(testData))


if __name__ == '__main__':
    app.run()
