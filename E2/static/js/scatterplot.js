import { highlightColumn, removeHighlights } from "./heatmap.js"
import { setTeam } from "./lineplot.js"
export { highlightDot, removeDotHighlight, colorDots, init_scatterplot }


function init_scatterplot(scatterplot_data) {
  render_scatterplot(scatterplot_data)
}

function render_scatterplot(scatterplot_data) {

  // set the dimensions and margins of the graph
  var margin = { top: 50, right: 50, bottom: 100, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom

  // append the svg object to the body of the page
  let svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")

  // Add X axis
  var x = d3.scaleLinear()
    .domain([d3.min(scatterplot_data, d => d.x),
    d3.max(scatterplot_data, d => d.x)])
    .range([0, width])
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
  //.call(d3.axisBottom(x)) //uncomment to show x axis

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([d3.min(scatterplot_data, d => d.y),
    d3.max(scatterplot_data, d => d.y)])
    .range([height, 0])
  svg.append("g")
  //.call(d3.axisLeft(y)) //uncomment to show y axis

  d3.select("body")
    .append("div")
    .attr("id", "tooltip_scatter_plot")
    .attr("class", "style_tooltip")

  function drawData(data) {

    svg.append("g")
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "pca_dot")
      .attr("cx", function (d) { return x(d.x) })
      .attr("cy", function (d) { return y(d.y) })
      .attr("r", 5)
      .style("fill", "#42be65")
      .on("mouseover", function (_, d) {
        highlightColumn(d["Team Name"])
        setTeam(d["Team Name"])
        // Show tooltip and display text
        d3.select("#tooltip_scatter_plot").style("visibility", "visible").text(d["Team Name"])

      })
      .on("mousemove", function (event) {
        d3.select("#tooltip_scatter_plot")

          // Move tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function () {
        removeHighlights()

        // Hide tooltip
        d3.select("#tooltip_scatter_plot").style("visibility", "hidden")
      })
  }
  drawData(scatterplot_data)
}

function highlightDot(teamName) {

  var svg = d3.select("#scatterplot").select("g")

  var selected_dot = svg.selectAll("circle.pca_dot")
    .filter(function (d) { return d["Team Name"] === teamName })

  selected_dot
    .style("stroke", "#da1e28")
    .style("stroke-width", 2)
    .classed("is_highlighted", true)
}

function removeDotHighlight() {
  d3.selectAll("circle.is_highlighted")
    .style("stroke", "none")
    .classed("is_highlighted", false)
}

function colorDots(color_scale, stats_data) {

  d3.selectAll("circle.pca_dot")
    .style("fill", function (d) {
      // Assinging every dot the color of the team in the heatmap
      return color_scale(stats_data.find(data => data["Team Name"] === d["Team Name"]).value)
    })
    .classed("pca_dots_colored", true)

}
