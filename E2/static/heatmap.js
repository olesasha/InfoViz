export { highlightColumn,removeHighlightColumn };

var margin = { top: 60, right: 60, bottom: 100, left: 120 },
  width = 700 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

d3.json("/heatmap_data").then(function (heatmap_data) {
  // Data processing and visualization code here
  console.log(heatmap_data); // verify data is loaded
  var graphData = heatmap_data;
  // set the dimensions and margins of the graph


  // append the svg object to the body of the page
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
    .padding(0.05)

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
      .tickSizeOuter(0)) // This will remove the outer ticks
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Build Y scales and axis:
  var y = d3.scaleBand()
    .range([height, 0])
    .domain(parameters)
    .padding(0.05)
  svg.append("g")
    .call(d3.axisLeft(y)
      .tickSizeOuter(0));

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
      .style("fill", function (d) { return colorScales[d.variable](d.value) })
      .append("title")
      .text(function (d) { return d.value })

  }
  drawData(graphData);

});



function highlightColumn(teamName) {
  console.log(teamName);

  // Select the heatmap SVG
  var svg = d3.select("#heatmap").select("g");

  // Filter the rectangles to find those associated with the given teamName
  var rect_to_border = svg.selectAll("rect.square")
    .filter(function (d) { return d['Team Name'] === teamName; });




  console.log(rect_to_border)
  // Get the x coordinate of the first rectangle and calculate the total height
  var x = +rect_to_border.attr("x");
  var y = +rect_to_border.attr("y");
  var width_box = +rect_to_border.attr("width");
  console.log(svg)

  // Add a rectangle to highlight the row
  svg.append("rect")
    .attr("x", x - 1)
    .attr("y", 1)
    .attr("width", 1.8)  // Adjust the width as needed
    .attr("height", height)
    .attr("class","highlightColumn")
    .style("fill", "black");


  svg.append("rect")
    .attr("x", width_box + x - 0.5)
    .attr("y", 1)
    .attr("width", 1.8)  // Adjust the width as needed
    .attr("height", height)
    .attr("class","highlightColumn")
    .style("fill", "black");

}

function removeHighlightColumn(){
  d3.selectAll("rect.highlightColumn").remove()
}






