d3.json("/scatterplot_data").then(function(scatterplot_data) {
    // Data processing and visualization code here
    console.log(scatterplot_data); // verify data is loaded
    var graphData = scatterplot_data;

// set the dimensions and margins of the graph
var margin = { top: 60, right: 60, bottom: 100, left: 120 },
width = 700 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#scatterplot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // Add X axis
  var x = d3.scaleLinear()
    .domain([d3.min(scatterplot_data, d => d.x),
             d3.max(scatterplot_data, d => d.x)])
    .range([ 0, width ]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    //.call(d3.axisBottom(x)); //uncomment to show x axis

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([d3.min(scatterplot_data, d => d.y),
             d3.max(scatterplot_data, d => d.y)])
    .range([ height, 0]);
  svg.append("g")
    //.call(d3.axisLeft(y)); //uncomment to show y axis

    function drawData(data) {

  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", function (d) { return x(d.x); } )
      .attr("cy", function (d) { return y(d.y); } )
      .attr("r", 5)
      .style("fill", "#69b3a2")
      .append("title")
      .text(function (d) { return d["Team Name"] })
    }

    drawData(graphData);
});  