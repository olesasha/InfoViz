// import and export of the functions to enable dynamic interactions between plots
export { setTeam, init_lineplot }

// declare global variables and defaults
var global_lineplot_data
var line
var y
var x
var selectedTeam = null
var selectedMetric = "--"

// set the dimensions and margins of the plot
var margin = { top: 100, right: 50, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom

// initialize the lineplot using the lineplot data and the metric chosen by the select button 
function init_lineplot(lineplot_data) {
    render_lineplot(lineplot_data)
    global_lineplot_data = lineplot_data
    setMetric()
}

function render_lineplot(lineplot_data) {

    // append the svg object to the body of the page
    var svg = d3.select("#lineplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")

    // list of the metrics to choose from 
    var allMetrics = Object.keys(lineplot_data[0]).slice(2)

    // add the options to the button
    d3.select("#selectButton")
        .selectAll("myOptions")
        .data(allMetrics)
        .enter()
        .append("option")
        .text(function (d) { return d }) // text showed in the menu
        .attr("value", function (d) { return d }) // corresponding value returned by the button
        .style("top", "10px")
        .style("left", "10px")

    // scale the x axis between the min and max year available in the data
    x = d3.scaleLinear()
        .domain([1990, 2020])
        .range([0, width])

    // create the default title for the lineplot
    svg.append("text")
        .attr("class", "title")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2 - 13))
        .attr("text-anchor", "middle")
        .text("Select indicator and hover over a team in the scatterplot")

    // append the x axis
    svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")) // format the years stores as integers to show like "2,000" -> "2000"
        )

    // scale y axis
    y = d3.scaleLinear()
        .range([height, 0])

    // append y axis
    svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y)
            .tickSizeOuter(0))

    // initialize the line
    line = svg
        .append("g")
        .append("path")
        .datum(lineplot_data)
        .attr("stroke", "none")
        .style("stroke-width", 2)
        .style("fill", "none")
}

// function to set the global variable team 
function setTeam(teamName) {
    selectedTeam = teamName
    updateSelect()
}

// function to update the displayed metric
function setMetric() {
    d3.select("#selectButton").on("change", function (d) {
        selectedMetric = d3.select(this).property("value")
        updateSelect()
    })
}

// function that updates the chart
function updateSelect() {

    var svg = d3.select("#lineplot").select("g")

    var dataFilter = global_lineplot_data.filter(function (d) {
        return d["team_name"] === selectedTeam     // filter the data to only show the team that was selected on the scatterplot
    }).map(function (d) {
        return {
            year: d["year"],
            value: d[selectedMetric]
        }
    })

    // adjust the y axis to the specific metric
    y.domain([0, d3.max(global_lineplot_data, function (d) { return d[selectedMetric] })])
        .range([height, 0])

    // append the y axis
    svg.select(".yAxis")
        .transition()   // add transition for smooth change of the axis 
        .duration(300)
        .call(d3.axisLeft(y)
            .tickSizeOuter(0))

    // adjust the x axis to show only the years that have available data for the team
    x.domain(d3.extent(dataFilter, function (d) { return d["year"] }))

    // append the x axis
    svg.select(".xAxis")
        .transition()   // add transition for smooth change of the axis
        .duration(300)
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")))    // format the years

    // adjust the title of the lineplot for the selected metric and team
    svg.select(".title")
        .text(selectedMetric + " for team " + selectedTeam)


    // show an empty lineplot contained if no team or metric is selected
    if ((selectedMetric == "--") | (selectedTeam == null)) {
        
        svg.select(".title")
            .text("Select indicator and hover over a team in the scatterplot")

        y.domain(d3.extent([0, 1]))

        svg.select(".yAxis")
            .transition()
            .duration(300)
            .call(d3.axisLeft(y)
                .tickSizeOuter(0))

        x.domain([1999, 2020])

        svg.select(".xAxis")
            .transition()
            .duration(300)
            .call(d3.axisBottom(x)
                .tickSizeOuter(0)
                .tickFormat(d3.format("d")))
    }

    // update the line when another indicator or team is selected
    line
        .datum(dataFilter)
        .transition()   // transition for smooth line change
        .duration(300)
        .attr("d", d3.line()
            .x(function (d) { return x(d["year"]) })
            .y(function (d) { return y(d["value"]) })
        )
        .attr("stroke", "#42be65")
}


