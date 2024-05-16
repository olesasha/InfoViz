import { highlightDot } from "./scatterplot.js";
export { setTeam, init_lineplot }


// Declare global variables
var global_lineplot_data
var line
var y
var x
var selectedTeam = null
var selectedMetric = null

var margin = { top: 60, right: 60, bottom: 100, left: 120 },
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

function init_lineplot(lineplot_data) {
    console.log(lineplot_data)
    render_lineplot(lineplot_data)
    global_lineplot_data = lineplot_data
    setMetric()
    // TODO: Decide what should be the default state. If by default the plot should be empty remove this line
    updateSelect()
}


function render_lineplot(lineplot_data) {


    // append the svg object to the body of the page
    var svg = d3.select("#lineplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var title = svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px");

    // List of groups 
    var allMetrics = Object.keys(lineplot_data[0]).slice(2)

    // add the options to the button
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allMetrics)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
        .style("top", "10px")
        .style("left", "10px");

    x = d3.scaleLinear()
        .domain([1999, 2020])
        .range([0, width]);

    svg.append("text")
        .attr("class", "title")

    svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
        .tickSizeOuter(0)
        .tickFormat(d3.format("d"))
    );

    // Add Y axis
    y = d3.scaleLinear()
        .domain(d3.extent(lineplot_data, function (d) { return +d.total_games; }))
        .range([height, 0]);

    svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y)
            .tickSizeOuter(0))

    // Initialize line with group a
    line = svg
        .append("g")
        .attr("class", "yAxis")
        .append("path")
        .datum(lineplot_data)
        .attr("d", d3.line()
            .x(function (d) { return x(+d["year"]) })
            .y(function (d) { return y(+d.total_games) })
        )
        .attr("stroke", "none")
        .style("stroke-width", 2)
        .style("fill", "none")
}


function setTeam(teamName) {
    selectedTeam = teamName
    updateSelect();
}

function setMetric() {
    d3.select("#selectButton").on("change", function (d) {
        selectedMetric = d3.select(this).property("value")
        updateSelect();
    });
}


// A function that update the chart
function updateSelect() {

    if (selectedTeam === null) {
        selectedTeam = "Atlanta Hawks"; //default
    }
    if (selectedMetric === null) {
        selectedMetric = "Number of players"; //default
    }

    var svg = d3.select("#lineplot").select("g")

    var dataFilter = global_lineplot_data.filter(function (d) {
        return d["team_name"] === selectedTeam;
    }).map(function(d) {
        return {
            year: d["year"],
            value: d3.format(".0f")(+d[selectedMetric]) 
        };
    });


    y.domain(d3.extent(global_lineplot_data, function (d) { return +d[selectedMetric]; }))
        .range([height, 0]);

    svg.select(".yAxis")
        .call(d3.axisLeft(y)
        .tickSizeOuter(0));

    svg.select(".title")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2 - 13))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .attr("font-family", "sans-serif")
        .text(selectedMetric + " for team " + selectedTeam);

    // Give these new data to update line
    line
        .datum(dataFilter)
        .transition()
        .duration(100)
        .attr("d", d3.line()
            .x(function (d) { return x(+d["year"]) })
            .y(function (d) { return y(+d["value"]) })
        )
        .attr("stroke", "#42be65")
}


