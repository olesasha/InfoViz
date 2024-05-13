import { highlightDot, removeDotHighlight, colorDots } from "./scatterplot.js";
export { highlightColumn, removeHighlights };

var margin = { top: 50, right: 50, bottom: 150, left: 150 },
  width = 700 - margin.left - margin.right,
  height = 650 - margin.top - margin.bottom;

d3.json("/heatmap_data").then(function (heatmap_data) {

  var graphData = heatmap_data;
  var svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Labels of row and columns

  var team_names = [...new Set(graphData.map(item => item['Team Name']))]
  var parameters = [...new Set(graphData.map(item => item['variable']))]

  // Build X scales and axis:
  var x = d3.scaleBand()
    .range([0, width])
    .domain(team_names)
    .padding(0.02)

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
      .tickSizeOuter(0)) // This will remove the outer ticks
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")

  // Build Y scales and axis:
  var y = d3.scaleBand()
    .range([height, 0])
    .domain(parameters)
    .padding(0.02)
  svg.append("g")
    .call(d3.axisLeft(y)
      .tickSizeOuter(0));


  d3.select('body')
    .append('div')
    .attr('id', 'tooltip')

  // Build color scale
  var colorScales = {};
  parameters.forEach(param => {
    let min_colorscale = d3.min(heatmap_data.filter(d => d['variable'] === param), d => d.value)
    let max_colorscale = d3.max(heatmap_data.filter(d => d['variable'] === param), d => d.value)
    colorScales[param] = d3.scaleLinear()
      .domain([min_colorscale, max_colorscale])
      .range(["#defbe6", '#198038']);
  })


  //Read the data
  function drawData(data) {

    svg.selectAll("rect")
      .data(data, function (d) { return d['Team Name'] + ':' + d.variable; })
      .enter()
      .append("rect")
      .attr("x", function (d) { return x(d['Team Name']) })
      .attr("y", function (d) { return y(d.variable) })
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("class", "square")
      .attr("rx", 2)
      .attr("ry", 2)
      .on("mouseover", function (_, d) {
        highlightDot(d["Team Name"])
        let filtered_data = heatmap_data.filter(function (data) { return data.variable === d.variable })
        colorDots(colorScales[d.variable], filtered_data)
        showInfoToolTip(d["Team Name"], d.variable,d.value)
      })
      .on("mouseleave", function () {
        removeDotHighlight()
        removeHighlights()

      })
      .on('mousemove', function (event) {
        moveToolTip(event)
      })

      .style("fill", function (d) { return colorScales[d.variable](d.value) })
      .append("title")
      .text(function (d) { return d.value })

  }
  drawData(graphData);

});



function highlightColumn(teamName) {

  // Select the heatmap SVG
  var svg = d3.select("#heatmap").select("g");

  // Filter the rectangles to find those associated with the given teamName
  var rect_to_border = svg.selectAll("rect.square")
    .filter(function (d) { return d['Team Name'] === teamName; });

  // Get the x coordinate of the first rectangle and calculate the total height
  var x = +rect_to_border.attr("x");
  var y = +rect_to_border.attr("y");
  var width_box = +rect_to_border.attr("width");

  svg.append("rect")
    .attr("x", x)
    .attr("y", 1)
    .attr("width", width_box)  // Adjust the width as needed
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

function removeHighlights() {
  d3.selectAll("rect.highlightHeatmap").remove()
  d3.selectAll("g.tick.bold_tick")
    .style("font-weight", "normal")
    .style("font-size", "100%")
    .classed("bold_tick", false)

  d3.select('#tooltip').style('opacity', 0)

}


function highlightRow(variable) {

  // Select the heatmap SVG
  var svg = d3.select("#heatmap").select("g");

  // Filter the rectangles to find those associated with the given teamName
  var rect_to_border = svg.selectAll("rect.square")
    .filter(function (d) { return d.variable === variable; });

  // Get the x coordinate of the first rectangle and calculate the total height
  var y = +rect_to_border.attr("y");
  var height_box = +rect_to_border.attr("height");

  svg.append("rect")
    .attr("x", 0)
    .attr("y", y)
    .attr("width", width - 1)  // Adjust the width as needed
    .attr("height", height_box)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("class", "highlightHeatmap")
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)

  svg.selectAll("g.tick")
    .filter(function (d) { return d == variable })
    .style("font-weight", "bold")
    .style("font-size", "110%")
    .classed("bold_tick", true)

}


function showInfoToolTip(teamName, variable, value) {
  var svg = d3.select("#heatmap").select("g");
  highlightColumn(teamName)
  highlightRow(variable)
  d3.select('#tooltip').style('opacity', 0.8).text(value)
}


function moveToolTip(event){
  d3.select('#tooltip')
  .style('left', (event.pageX + 10) + 'px')
  .style('top', (event.pageY - 10) + 'px')
}





