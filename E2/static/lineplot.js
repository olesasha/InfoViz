import { highlightDot, removeDotHighlight, colorDots } from "./scatterplot.js";
import { highlightColumn, removeHighlights } from './heatmap.js'

d3.json("/lineplot_data").then(function(lineplot_data) {
    // set the dimensions and margins of the graph
    var margin = { top: 60, right: 60, bottom: 100, left: 120 },
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;    

    // append the svg object to the body of the page
    var svg = d3.select("#lineplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    var title =  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px");

    // List of groups 
    var allGroups = ['total_games', 'games_started', 'minutes_played',
    'fg', 'fga', 'fgp', 'fg3', 'fg3a', 'fg3p', 'fg2', 'fg2a', 'fg2p', 'ft',
    'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'stl', 'blk', 'tov', 'pf',
    'pts']

    var allTeams = [...new Set(lineplot_data.map(d => d.team_name))];

    // add the options to the button
    d3.select("#selectButton")
    .selectAll('myOptions')
        .data(allGroups)
    .enter()
        .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    .style("top", "10px")
    .style("left", "10px");

    var x = d3.scaleLinear()
    .domain([1999,2020])
    .range([ 0, width ]);

    svg.append("text")
    .attr("class","title")

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain(d3.extent(lineplot_data, function(d) { return +d.total_games; }))
        .range([ height, 0 ]);

    var yAxis = d3.axisLeft().scale(y);

    svg.append("g")
    .attr("class","yAxis")
    .call(d3.axisLeft(y))


    // Initialize line with group a
    var line = svg
    .append("g")
    .attr("class", "yAxis")
    .append("path")
        .datum(lineplot_data)
        .attr("d", d3.line()
        .x(function(d) { return x(+d.year) })
        .y(function(d) { return y(+d.total_games) })
        )
        .attr("stroke", "green")
        .style("stroke-width", 2)
        .style("fill", "none")

    
    // A function that update the chart
    function updateSelect(selectedGroup) {

    // Create new data with the selection?
    //var dataFilter = lineplot_data.map(function(d){return {year: d.year, value:d[selectedGroup]} })
    var dataFilter = lineplot_data.map(function(d) {
        return { year: d.year, value: +d[selectedGroup]}; 
    });
    
    y.domain(d3.extent(lineplot_data, function(d) { return +d[selectedGroup]; }))
    .range([ height, 0 ]);

    svg.select(".yAxis")
    .call(d3.axisLeft(y));

    svg.select(".title")
    .attr("x", (width / 2))
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .attr("font-family", "sans-serif")
    .text( selectedGroup + " for Team X");

    // Give these new data to update line
    line
        .datum(dataFilter)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return x(+d.year) })
            .y(function(d) { return y(+d.value) })
        )
    }
    
    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        updateSelect(selectedOption);
    })
});  