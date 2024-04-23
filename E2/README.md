#InfoVis UE - Exercise 2: Linked View with d3
Scaffold for building multiple coordinated views using d3 with a Python backend using Flask.

##Project setup using PyCharm:


1. Create new PyCharm project from this folder
2. Creating Virtual Environment:
Ctrl+Alt+S to open Settings
--> Project
--> Project Interpreter
--> select the gear symbol next to "Project Interpreter"
--> Add...
--> "Virtualenv Environment
--> New environment
--> OK
3. Install required packages:
open requirements.txt
--> click on "Install requirements" from bar on the top
Alternatively, you can install the requirements individually from the Project Interpreter menu (select "+")
4. Set Working Directory:
in order to load data on the server, you might need to set your Working Directory on PyCharm, otherwise you might get
the error "No such file or directory" when attemping to load data.
To do that, open Run
--> Edit Configurations...
set your Working Directory to the root directory (i.e. where "app.py" and the "static" folder are located)


##Files:

* app.py: Flask server
* templates/index.html: our single HTML page, including the main JavaScript code
* static/js/: folder where your JavaScript files should go
* static/data/: the data to work with
* static/styles/style.css: CSS styles

You may modify all files, and use your own files from exercise 1. You may (and actually should) add JavaScript files to static/js.

# Internal Information

not for students


Organize this project: 

PyCharm: new Flask project
Terminal --> pip freeze --> copy content to requirements.txt

In PyCharm: 
Ctrl+Alt+S (Settings) --> Project --> Project Interpreter --> [+] to install packages

===================================

Instructions for students: 

Py Charm: Ctrl+Alt+S --> Project --> Project Interpreter --> gear next to project interpretr --> virtualenv Environment --> New environment 
requirements.txt --> Install requirements

===================================

https://benalexkeen.com/creating-graphs-using-flask-and-d3/

===================================

Map: 
https://gist.githubusercontent.com/bquast/944781aa6dcc257ebf9aeee3c098b637/raw/871039f36e7b277a20d34619d72ec6b62957fe28/world-topo.json

https://gist.github.com/bquast/944781aa6dcc257ebf9aeee3c098b637#file-world-topo-json

===================================


TASKS: 
*) On the server, load the data using pandas and return it to the client 
https://flask.palletsprojects.com/en/1.1.x/quickstart/#rendering-templates
Template engine: Jinja 2


*) Obtain the data on the client side
https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.to_json.html

*) Fill all countries for which we have data

*) Render the biplot 

*) Synchronized highlighting of countries between map and biplot 

*) selection of indicator to show as choropleth map 

*) details on demand 

===================================

For comparison, plot biplot in R: 
> oecdData = read.csv(<url>, header=TRUE, row.names="Country")
> biplot(prcomp(oecdData, scale=T))

===================================

Render arrows in d3: 
https://stackoverflow.com/questions/46906751/adding-arrow-ends-to-d3-js-lines