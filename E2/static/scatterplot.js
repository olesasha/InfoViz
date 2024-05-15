import { highlightColumn, removeHighlights } from './heatmap.js'
import { setTeam} from "./lineplot.js";
export { highlightDot, removeDotHighlight, colorDots }


d3.json("/scatterplot_data").then(function (scatterplot_data) {
  // Data processing and visualization code here
  var graphData = scatterplot_data


  // set the dimensions and margins of the graph
  var margin = { top: 60, right: 60, bottom: 100, left: 120 },
    width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom

  // append the svg object to the body of the page
  let svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")
  
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top/2))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .attr("font-family", "sans-serif")
      .text("PCA colored for variable X");

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

  d3.select('body')
    .append('div')
    .attr('id', 'tooltip_scatter_plot')
    .attr("class", "style_tooltip")

  function drawData(data) {

    svg.append('g')
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
      
        d3.select('#tooltip_scatter_plot').style('visibility',"visible").text(d["Team Name"])
      })
      .on("mousemove",function(event){
        d3.select('#tooltip_scatter_plot')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
      })
      .on("mouseout", function () { 
        removeHighlights()
        d3.select('#tooltip_scatter_plot').style('visibility', "hidden")       
      })
  }

  drawData(graphData)
})

function highlightDot(teamName) {

  var svg = d3.select("#scatterplot").select("g")

  var selected_dot = svg.selectAll("circle.pca_dot")
    .filter(function (d) { return d['Team Name'] === teamName })

  selected_dot
    .style("stroke", "#da1e28")
    .style("stroke-width", 2)
    .classed("is_highlighted", true)

    setTeam(teamName);
}

function removeDotHighlight() {
  d3.selectAll("circle.is_highlighted")
    .style("stroke", "none")
    .classed("is_highlighted", false)

}

function colorDots(color_scale, stats_data) {


  d3.selectAll("circle.pca_dot")
    .style("fill", function (d) {

      return color_scale(stats_data.find(data => data["Team Name"] === d["Team Name"]).value);
    })
    .classed("pca_dots_colored", true)

}


// TODO: Decide if this function should be included
function removeColorDots() {
  d3.selectAll("circle.pca_dots_colored")
    .style("fill", "#42be65")
}