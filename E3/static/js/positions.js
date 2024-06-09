export { update_driver_pos_chart, init_pos_plot, update_driver_pos_first_lap, adjust_x_axis_pos_plot }


var global_lineplot_data
var lines
var line
var y
var x
var selectedTeam = null
var concatenated_driver_pos
var selectedMetric = "--"
var svg

// Sample data
const data = [
    { name: "Line 1", values: [{ x: 0, y: 30 }, { x: 1, y: 40 }, { x: 2, y: 25 }, { x: 3, y: 45 }, { x: 4, y: 35 }] },
    { name: "Line 2", values: [{ x: 0, y: 20 }, { x: 1, y: 35 }, { x: 2, y: 45 }, { x: 3, y: 30 }, { x: 4, y: 50 }] },
    { name: "Line 3", values: [{ x: 0, y: 45 }, { x: 1, y: 25 }, { x: 2, y: 35 }, { x: 3, y: 20 }, { x: 4, y: 40 }] }
];
console.log(data)
let positions = [];
let laps = [];
let years = [];
let roundNumbers = [];
let drivers = [];
let teamColors = [];
let teamNames = [];

var margin = { top: 100, right: 50, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom

function init_pos_plot() {
    render_pos_chart()
}

function render_pos_chart() {


    // append the svg object to the body of the page
    svg = d3.select("#pos_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")


    // scale the x axis between the min and max year available in the data
    x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width])


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
        .domain([0, 20])
        .range([height, 0])

    // append y axis
    svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y)
            .tickSizeOuter(0))

    line = d3.line()
        .x(d => x(d.lap))
        .y(d => y(d.pos));



}

function update_driver_pos_first_lap(year, round_number) {
    d3.json(`/get_lap_data/${year}/${round_number}/${1}`)
        .then(function (lap_data) {


            update_driver_pos_chart(year, round_number, 1)


            lap_data = Object.values(lap_data)
            svg.selectAll(".line")
                .data(lap_data)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", function (d) {
                    // Generate the line path string
                    return d3.line()
                        .x(function (d) { return x(d.lap); }) // Access the lap value
                        .y(function (d) { return y(d.pos); })(d.values); // Access the position value
                })
                .attr("stroke", d => d.color) // Set stroke color
                .style("fill", "none");


            const lap_data_dots = lap_data.map(d => {
                return {
                    color: d.color,
                    lap: d.values[d.values.length - 1].lap,
                    pos: d.values[d.values.length - 1].pos
                };
            });


            svg.selectAll(".dots_line_plot")
                .data(lap_data_dots)
                .enter()
                .append("circle")
                .attr("class", "dots_line_plot")
                .attr("cx", function (d) { return x(d.lap); }) // Set the x position of the cycle marker
                .attr("cy", function (d) { return y(d.pos); }) // Set the y position of the cycle marker
                .attr("r", 5) // Set the radius of the cycle marker
                .style("fill", d => d.color)
                .style("stroke", "black");
        })

}




function update_driver_pos_chart(year, round_number, lap) {
    d3.json(`/get_lap_data/${year}/${round_number}/${lap}`)
        .then(function (lap_data) {
            lap_data = Object.values(lap_data)

            console.log(lap_data);
            svg.selectAll(".line")
                .data(lap_data)
                .attr("d", function (d) {
                    // Generate the line path string
                    return d3.line()
                        .x(function (d) { return x(d.lap); }) // Access the lap value
                        .y(function (d) { return y(d.pos); })(d.values); // Access the position value
                })
                .attr("stroke", d => d.color) // Set stroke color



            const lap_data_dots = lap_data.map(d => {
                return {
                    color: d.color,
                    lap: d.values[d.values.length - 1].lap,
                    pos: d.values[d.values.length - 1].pos
                };
            });

            svg.selectAll(".dots_line_plot")
                .data(lap_data_dots)
                .attr("cx", function (d) { return x(d.lap); }) // Set the x position of the cycle marker
                .attr("cy", function (d) { return y(d.pos); }) // Set the y position of the cycle marker
                .style("fill", d => d.color)
        })

}

function adjust_x_axis_pos_plot(total_laps) {
    x.domain([0, total_laps])

    svg.select(".xAxis")
        .transition()
        .duration(300)
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")))
}
