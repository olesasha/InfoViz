Full data from GitHub is necessary to ensure the best dashboard experience. We are using git lfs to store it on GitHub. 
The following steps must be carried out to be able to run the project locally.

1. Installation of git lfs (https://git-lfs.com/) 

```
git lfs install
```

2. Clone the repository (https://github.com/olesasha/InfoViz.git)
3. Go to the E3 directory. 
4. Install the required libraries using requirements.txt
```
python3 -m venv f1venv
source venv/bin/activate
pip install -r requirements.txt
```
5. Fetch all data files from github
```
git lfs pull
```
6. Run the flask app from E3
``` 
cd E3
flask --app app.py run --debug 
```

Data sources: 
- https://ergast.com/
- https://github.com/theOehrly/Fast-F1
- https://observablehq.com/@michael-keith/draggable-globe-in-d3

Note: if there is an unexpected behaviour in the dashboard, please try running it in a different browser. We tested the application in Chrome, Firefox and Safari, other browsers might render elements differently, which possibly impacts perfromance. 