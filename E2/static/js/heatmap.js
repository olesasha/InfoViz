// import and export of the functions to enable dynamic interactions between plots
import { highlightDot, removeDotHighlight, colorDots } from "./scatterplot.js"
export { highlightColumn, highlightRow, removeHighlights, init_heatmap }

// initialize the heatmap with the heatmap data
function init_heatmap(heatmap_data) {
  render_heatmap(heatmap_data)
}

// set the plot dimensions
var margin = { top: 20, right: 50, bottom: 100, left: 150 },
  width = 700 - margin.left - margin.right,
  height = 570 - margin.top - margin.bottom

function render_heatmap(heatmap_data) {

  var svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")

  // labels for the rows and columns
  var parameters = new Set(d3.map(heatmap_data, (d) => d["metric"]))
  var team_names = new Set(d3.map(heatmap_data, (d) => d["Team Name"]))

  // create the scale for the x axis 
  var x = d3.scaleBand()
    .range([0, width])
    .domain(team_names)
    .padding(0.02)

  // append the x axis on the bottom of the plot
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
      .tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")

  // create the scale for the y axis
  var y = d3.scaleBand()
    .range([height, 0])
    .domain(parameters)
    .padding(0.02)

  // append the y axis on the left side of the plot
  svg.append("g")
    .call(d3.axisLeft(y)
      .tickSizeOuter(0)) // the highest value on the y axis is not written on the axis

  // append the tooltip for the team name and the metric
  d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "style_tooltip")

  d3.select("#tooltip")
    .append("div")
    .attr("id", "tooltip_team_name")

  d3.select("#tooltip")
    .append("div")
    .attr("id", "tooltip_metric")

  // build separate color scale for each metric
  // the gradients of the heatmap must be generated within each variable to allow comparison
  var colorScales = {}
  parameters.forEach(param => {
    let min_colorscale = d3.min(heatmap_data.filter(d => d["metric"] === param), d => d["value"])
    let max_colorscale = d3.max(heatmap_data.filter(d => d["metric"] === param), d => d["value"])
    colorScales[param] = d3.scaleLinear()
      .domain([min_colorscale, max_colorscale])
      .range(["#defbe6", "#198038"]) // set the color range between light green and dark green
  })

  // drawing function for the heatmap
  function drawData(data) {

    svg.selectAll("rect")
      .data(data, function (d) { return d["Team Name"] + ":" + d["metric"] })
      .enter()
      .append("rect")
      .attr("x", function (d) { return x(d["Team Name"]) }) // x axis with the team names
      .attr("y", function (d) { return y(d["metric"]) })    // y axis with the metrics
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("class", "square")
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", function (d) { return colorScales[d["metric"]](d["value"]) }) // fill the rectangles based on the value according to the color scale
      .on("mouseover", function (_, d) { // to do when the mouse hovers over
        highlightDot(d["Team Name"])
        //  filter the data to only send the relevant data to the colorDots function 
        let filtered_data = heatmap_data.filter(function (data) { return data.metric === d["metric"] })
        // color the scatterplot
        colorDots(colorScales[d["metric"]], filtered_data) 
        // show the tooltip information
        showInfoToolTip(d["Team Name"], d["metric"], d["value"])
      })
      .on("mouseleave", function () { // remove the highlights when the mouse is moved from the heatmap
        removeDotHighlight()
        removeHighlights()
      })
      .on("mousemove", function (event) { // move the tooltip
        moveToolTip(event)
      })

  }

  // draw the heatmap
  drawData(heatmap_data)

}



// the function to highlight the columns of the heatmap
function highlightColumn(teamName) {

  // select the heatmap SVG
  var svg = d3.select("#heatmap").select("g")

  // filter the rectangles to find those associated with the given teamName
  var rect_to_border = svg.selectAll("rect.square")
    .filter(function (d) { return d["Team Name"] === teamName })

  // get the x coordinate of the first rectangle and calculate the total height
  var x = rect_to_border.attr("x")
  var width_box = rect_to_border.attr("width")

  svg.append("rect")  // draw the highlight frames around the rectangles 
    .attr("x", x)
    .attr("y", 1)
    .attr("width", width_box)  // adjust the width as needed
    .attr("height", height - 1)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("class", "highlightHeatmap")
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)

  svg.selectAll("g.tick")
    .filter(function (d) { return d == teamName })
    .style("font-weight", "bold")
    .style("font-size", "110%")
    .classed("bold_tick", true)

}

// the function to remove the highlights from the heatmap
function removeHighlights() {
  d3.selectAll("rect.highlightHeatmap").remove()
  d3.selectAll("g.tick.bold_tick")
    .style("font-weight", "normal")
    .style("font-size", "100%")
    .classed("bold_tick", false)
// hide the tooltip
  d3.select("#tooltip").style("visibility", "hidden")

}

// the function to highlight the row in the heatmap
function highlightRow(metric) {

  // select the heatmap SVG
  var svg = d3.select("#heatmap").select("g")

  // filter the rectangles to find those associated with the given teamName
  var rect_to_border = svg.selectAll("rect.square")
    .filter(function (d) { return d["metric"] === metric })

  // get the x coordinate of the first rectangle and calculate the total height
  var y = rect_to_border.attr("y")
  var height_box = rect_to_border.attr("height")

  svg.append("rect")
    .attr("x", 0)
    .attr("y", y)
    .attr("width", width - 1)  // adjust the width as needed
    .attr("height", height_box)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("class", "highlightHeatmap")
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)

  svg.selectAll("g.tick")
    .filter(function (d) { return d == metric })
    .style("font-weight", "bold")
    .style("font-size", "110%")
    .classed("bold_tick", true)

}

// generate information for the tooltip about the team name, the selected metric and the value
function showInfoToolTip(teamName, metric, value) {
  highlightColumn(teamName)
  highlightRow(metric)
  let text_metric = `${metric}: ${value}`
  d3.select("#tooltip").style("visibility", "visible")
  d3.select("#tooltip_team_name").text(teamName)
  d3.select("#tooltip_metric").text(text_metric)
}

// the function for moving the tooltip
function moveToolTip(event) {
  d3.select("#tooltip")
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 15) + "px")
}

