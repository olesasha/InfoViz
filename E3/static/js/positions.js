export { update_driver_pos_chart, init_pos_plot, update_driver_pos_first_lap, adjust_x_axis_pos_plot }
import { update_race } from "./circuit.js";

var y
var x
var svg
var line

var margin = { top: 40, right: 50, bottom: 40, left: 70 }
var width = window.innerWidth / 2;
var height = window.innerHeight / 2 - 125;

function init_pos_plot() {
    render_pos_chart()
}


// driver tooltip
const driver_tooltip = d3.select("body")
    .append("div")
    .attr("id", "driver_tooltip")
    .attr("class", "tooltip");

function render_pos_chart() {

    // append the svg object to the body of the page
    svg = d3.select("#pos_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")

    // title
    svg.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", -(margin.top - 30))
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Drivers' positions per lap");

    // x axis label
    svg.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", height + 35)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Lap number");

    // y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Position");

    x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width])

    // append the x axis
    svg.append("g")
        .attr("class", "x-axis-pos")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
        )

    // scale y axis
    y = d3.scaleLinear()
        .domain([20.9, 1])
        .range([height, 0])

    // Append y axis
    svg.append("g")
        .attr("class", "y-axis-pos")
        .call(d3.axisLeft(y)
            .tickSizeOuter(0)  // Hides the outer tick on the axis
            .ticks(19)
            .tickPadding(10))  // Adjust padding between ticks and the axis
        .selectAll(".tick line")
        .classed("tick-line", true);  // Add class to tick lines

    svg.selectAll(".y-axis-pos .tick text")
        .attr("class", "ticks")

    svg.selectAll(".x-axis-pos .tick text")
        .attr("class", "ticks")


    line = d3.line()
        .x(d => x(d.lap))
        .y(d => y(d.pos));
}

function update_driver_pos_first_lap(year, round_number) {
    d3.json(`/get_lap_data/${year}/${round_number}/${1}`)
        .then(function (lap_data) {

            
            lap_data = Object.values(lap_data);

            // Remove existing paths with the line class
            svg.selectAll(".line").remove();

            // Append new paths
            svg.selectAll(".line")
                .data(lap_data)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", function (d) {
                    let values = d.values;
                    if (values[0].pos === 0) {
                        values = values.slice(1); // Skip the first lap if position is 0
                    }
                    // Generate the line path string
                    return d3.line()
                        .x(function (d) { return x(d.lap); }) // Access the lap value
                        .y(function (d) { return y(d.pos); })(values); // Access the position value
                })
                .attr("stroke", d => d.color) // Set stroke color
                .attr("stroke-width", 4) // Ensure consistent stroke width
                .style("stroke-opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1)
                .style("fill", "none")
                .style("visibility", d => d.values[d.values.length -1].pos === 0 ? "hidden" : "visible"); // Hide line if first lap position is 0

            // Map the data for dots
            const lap_data_dots = lap_data.map(d => ({
                color: d.color,
                lap: d.values[d.values.length - 1].lap,
                pos: d.values[d.values.length - 1].pos,
                first_name: d.first_name,
                last_name: d.last_name,
                team_name: d.team_name,
                abbr: d.abbr,
            }));

            // Remove existing dots
            svg.selectAll(".dots_line_plot").remove();

            lap_data.forEach(d => d.highlighted = window.highlightedDrivers[d.abbr] || false);

            // Append new dots
            let dots_line_plot = svg.selectAll(".dots_line_plot")
                    .data(lap_data_dots)
                    .enter()
                    .append("circle")
                    .attr("class", "dots_line_plot")
                    .attr("cx", d => x(d.lap))
                    .attr("cy", d => y(d.pos))
                    .attr("r", 5)
                    .style("fill", d => d.color)
                    .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1)
                    .style("visibility", d => d.pos === 0 ? "hidden" : "visible")
                    .on("mouseover", function (event, d) {
                        const bbox = this.getBoundingClientRect();
                        driver_tooltip
                            .style("left", `${bbox.left + bbox.width / 2 + 30}px`)
                            .style("top", `${bbox.bottom - 30}px`)
                            .style("display", "block")
                            .html(`<span class="tooltip-bold">${d.first_name} ${d.last_name}</span><br>
                                <span class="tooltip-regular">${d.team_name} <br>
                                Current Position: ${d.pos}</span>`);
                    })
                    .on("mouseout", function () {
                        driver_tooltip.style("display", "none");
                    });
                


            svg.selectAll(".dot_labels")
                .data(lap_data_dots)
                .join("text")
                .attr("class", "dot_labels")
                .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1)
                .attr("x", function (d) { return x(d.lap) + 8; })
                .attr("y", function (d) { return y(d.pos) + 4; })
                .style("visibility", d => d.pos === 0 ? "hidden" : "visible")// Hide dot if first lap position is 0
                .text(function (d) { return `${d.abbr}`; });
        });
}


function update_driver_pos_chart(year, round_number, lap) {
    d3.json(`/get_lap_data/${year}/${round_number}/${lap}`)
        .then(function (lap_data) {
            lap_data = Object.values(lap_data);

            svg.selectAll(".line")
                .data(lap_data)
                .join("path")
                .attr("class", "line")
                .attr("d", function (d) {
                    let values = d.values;
                    if (values[0].pos === 0) {
                        values = values.slice(1); // Skip the first lap if position is 0
                    }
                    // Generate the line path string
                    return d3.line()
                        .x(function (d) { return x(d.lap); }) // Access the lap value
                        .y(function (d) { return y(d.pos); })(values); // Access the position value
                })
                .attr("stroke", d => d.color)
                .attr("stroke-width", 4)
                .style("visibility", d => d.pos === 0 ? "hidden" : "visible")// Hide dot if first lap position is 0
                .style("stroke-opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1);

            const lap_data_dots = lap_data.map(d => ({
                color: d.color,
                lap: d.values[d.values.length - 1].lap,
                pos: d.values[d.values.length - 1].pos,
                first_name: d.first_name,
                last_name: d.last_name,
                team_name: d.team_name,
                abbr: d.abbr,
            }));

            lap_data_dots.forEach(d => d.highlighted = window.highlightedDrivers[d.abbr] || false);

            svg.selectAll(".dots_line_plot")
                .data(lap_data_dots)
                .join("circle")
                .attr("class", "dots_line_plot")
                .attr("cx", function (d) { return x(d.lap); }) // Set the x position of the cycle marker
                .attr("cy", function (d) { return y(d.pos); }) // Set the y position of the cycle marker
                .attr("r", 5) // Set the radius of the cycle marker
                .style("fill", d => d.color)
                .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1)
                .style("visibility", d => d.pos === 0 ? "hidden" : "visible")  // Hide dot if first lap position is 0
                .style("visibility", d => d.pos === 0 ? "hidden" : "visible")  // Hide dot if first lap position is 0
                .on("mouseover", function (event, d) {
                    const bbox = this.getBoundingClientRect();
                    driver_tooltip
                        .style("left", `${bbox.left + bbox.width / 2 + 30}px`) 
                        .style("top", `${bbox.bottom-30}px`)              
                        .style("display", "block")
                        .html(`<span class="tooltip-bold">${d.first_name} ${d.last_name}</span><br>
                              <span class="tooltip-regular">${d.team_name} <br>
                              Current Position: ${d.pos}</span>`);
                })
                .on("mouseout", function () {
                    driver_tooltip.style("display", "none");
                });

            svg.selectAll(".dot_labels")
                .data(lap_data_dots)
                .join("text")
                .attr("class", "dot_labels")
                .style("visibility", d => d.pos === 0 ? "hidden" : "visible")// Hide dot if first lap position is 0
                .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.abbr] ? 1 : 0.2) : 1)
                .attr("x", function (d) { return x(d.lap) + 8; })
                .attr("y", function (d) { return y(d.pos) + 4; })
                .text(function (d) { return `${d.abbr}`; });
        });
}

function adjust_x_axis_pos_plot(total_laps) {
    x.domain([0, total_laps])

    svg.select(".x-axis-pos")
        .transition()
        .duration(300)
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")))


    svg.selectAll("g.tick text")
        .attr("class", "ticks")

    svg.selectAll("g.tick text")
        .attr("class", "ticks")
}
