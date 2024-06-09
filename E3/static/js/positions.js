export { update_driver_pos_chart, init_pos_plot, update_driver_pos_first_lap }


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
        .domain([0, 50])
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

    // Define line function
    line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));



    // Add lines
    // Color lines differently


    // Initialize lines
    /*     lines = svg
            .append("g")
            .selectAll(".line")
            .enter()
            .append("path")
            .data({
                lap: [1, 2, 3],
                pos: [1, 2, 3]
            })
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(d.lap))
                .y(d => y(+d.pos))); */

}

function update_driver_pos_first_lap(driver_pos_first_lap) {
    console.log(driver_pos_first_lap);
    concatenated_driver_pos = driver_pos_first_lap

    const temp_line_data = driver_pos_first_lap.map((item) => ({
        values: item.lap.map((lap, index) => ({ x: lap, y: item.pos[index] })),
        color: item.team_color
    }));

    console.log(temp_line_data);

    svg.selectAll(".line")
        .data(temp_line_data)
        .enter().append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .style("stroke",d =>`#${d.color}`)
        .style("fill","none")
}




function update_driver_pos_chart(driver_pos) {


    // Iterate through each array
    concatenated_driver_pos.forEach((d, index) => {
        // Iterate through each object in the array
        concatenated_driver_pos[index].lap.push(driver_pos[index].lap);
        concatenated_driver_pos[index].pos.push(driver_pos[index].pos);

    })


    const temp_line_data = concatenated_driver_pos.map((item) => ({
        values: item.lap.map((lap, index) => ({ x: lap, y: item.pos[index] })),
        color: item.team_color
    }));

    console.log(temp_line_data);

    svg.selectAll(".line")
        .data(temp_line_data)
        .attr("d", d => line(d.values))
}