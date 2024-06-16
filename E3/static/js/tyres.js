export { init_tyre_plot, update_tyre_plot, update_tyre_plot_first_lap, adjust_x_axis_tyre_plot };

var margin = { top: 40, right: 50, bottom: 40, left: 70 }
var width = window.innerWidth / 2;
var height = window.innerHeight / 2 - 100;

const default_year = 2020
const default_round = 1
const default_lap = 40

// global scale because it makes it easier to adjust 
var x, y

const compound_colors = {
    'SOFT': '#FF0100',
    'MEDIUM': '#FFEA00',
    'HARD': 'white',
    'INTERMEDIATE': '#0DBD00',
    'WET': '#007BE1'
}

/**
 * Initializes the tyre plot by rendering the tyre chart.
 */
function init_tyre_plot() {
    render_tyre_plot()
}


/**
 * Renders the tyre plot, including setting up the
 * axes, labels, legend, and initial configuration for the tyre data.
 */
function render_tyre_plot() {

    let svg = d3.select("#tyre_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 60) // Increased height to accommodate legend
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")

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
        .text("Driver");

    // title
    svg.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", -(margin.top - 30))
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Tyre compound per lap");

    x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    y = d3.scaleBand()
        .domain([0, 20])
        .range([height, 0])
        .padding(0.2)

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d"))
        );

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
            .tickSizeOuter(0)
        );

    svg.selectAll(".y-axis .tick text")
        .attr("class", "ticks")

    svg.selectAll(".x-axis .tick text")
        .attr("class", "ticks")

    // Add legend with F1 tire-like icons
    const legend = svg.selectAll(".legend")
        .data(Object.keys(compound_colors))
        .enter().append("g")
        .attr("class", "legend");

    // Outer black circle
    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 0)
        .attr("r", 9)
        .style("fill", "black")
        .style("stroke", "black")
        .style("stroke-width", 1);

    // Inner colored stripe circle
    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 0)
        .attr("r", 7) // Slightly smaller radius for the stripe effect
        .style("fill", "none")
        .style("stroke", d => compound_colors[d])
        .style("stroke-width", 2);

    legend.append("text")
        .attr("x", 30)
        .attr("y", 0)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "10px")
        .text(d => d);

    // Calculate the total width required for the legend
    let totalLegendWidth = 0;
    legend.each(function (d, i) {
        const legendItem = d3.select(this);
        const textWidth = legendItem.select("text").node().getBBox().width;
        totalLegendWidth += textWidth + 50; // Add space between items
    });

    // Center the legend
    let offsetX = (width + margin.left + margin.right - totalLegendWidth) / 2 - margin.left;
    legend.each(function (d, i) {
        const legendItem = d3.select(this);
        const textWidth = legendItem.select("text").node().getBBox().width;
        legendItem.attr("transform", `translate(${80 + offsetX}, ${height + 60})`);
        offsetX += textWidth + 50; // Add space between items
    });
}

/**
 * Updates the tyre plot for a specific lap of the given year and round.
 * Fetches the tyre data, updates the rectangles representing tyre usage,
 * and adjusts their visibility and appearance depending on whether the driver is selected or not.
 */
function update_tyre_plot(year, round_number, lap) {
    let passed_lap = lap
    if (lap == 1) {
        lap = 2
    }
    d3.json(`/get_tyre_data/${year}/${round_number}/${lap - 1}`).then(function (data) {
        // Assuming data is an object with keys as drivers (ALB, BOT, GAS, ...)
        const tyre_data = Object.values(data); // Extract values (lap data) from the object 
        // Select the SVG element
        const svg = d3.select("#tyre_plot").select("svg").select("g");
        svg.selectAll("rect")
            .remove();

        svg.selectAll("rect")
            .data(tyre_data)
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d["first_lap_stint"]) })
            .attr("y", function (d) { return y(d["Driver"]) })
            .attr("width", d => {
                if (passed_lap != 1) {
                    return x(d["last_lap_stint"] + 1) - x(d["first_lap_stint"])
                }
                else {
                    return x(d["last_lap_stint"] + 0.5) - x(d["first_lap_stint"])
                }
            })
            .attr("height", y.bandwidth())
            .attr("class", "square")
            .attr("rx", 2)
            .attr("ry", 2)
            .style("fill", function (d) { return compound_colors[d["compound"]] }) // fill the rectangles based on the value according to the color scale
            .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.Driver] ? 1 : 0.2) : 1)
            .style("stroke", "black")  // Border color
            .style("stroke-width", 0.3)

        svg.selectAll("g.tick")
            .style("opacity", function (d) {
                return window.anyHighlighted ? (window.highlightedDrivers[d] ? 1 : 0.2) : 1;
            });
    });
}



/**
 * Updates the tyre plot for the first lap of the given year and round.
 */
function update_tyre_plot_first_lap(year, round_number) {
    d3.json(`/get_tyre_data/${year}/${round_number}/${1}`).then(function (data) {

        // Assuming data is an object with keys as drivers (ALB, BOT, GAS, ...)
        const tyre_data = Object.values(data); // Extract values (lap data) from the object


        // Extract all drivers from the first entry (assuming all entries have the same drivers)
        var all_drivers = new Set();

        // Iterate through array and add each driver to Set
        tyre_data.forEach(item => {
            all_drivers.add(item.Driver);
        });

        all_drivers = Array.from(all_drivers).sort().reverse();


        // Select the SVG element
        const svg = d3.select("#tyre_plot").select("svg").select("g");

        // Update y scale domain based on the new drivers list
        y = d3.scaleBand()
            .domain(all_drivers)
            .range([height, 0])
            .padding(0.2);



        // Update y axis
        svg.select(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).tickSizeOuter(0))


        svg.selectAll(".y-axis .tick text")
            .attr("class", "ticks")

        svg.selectAll(".x-axis .tick text")
            .attr("class", "ticks")

        svg.selectAll("rect")
            .remove();

        svg.selectAll("rect")
            .data(tyre_data)
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d["first_lap_stint"]) })
            .attr("y", function (d) { return y(d["Driver"]) })
            .attr("width", d => x(d["last_lap_stint"] + 0.5) - x(d["first_lap_stint"]))
            .attr("height", y.bandwidth())
            .attr("class", "square")
            .attr("rx", 2)
            .attr("ry", 2)
            .style("fill", function (d) { return compound_colors[d["compound"]] }) // fill the rectangles based on the value according to the color scale
            .style("opacity", d => window.anyHighlighted ? (window.highlightedDrivers[d.Driver] ? 1 : 0.2) : 1)
            .style("stroke", "#636363")
            .style("stroke-width", 1)
            .on("mouseover", function (_, data) { // to do when the mouse hovers over
                svg.selectAll("g.tick")
                    .filter(function (d) { return d == data["Driver"] })
                    .style("font-weight", "bolder")
                    .style("font-size", "130%")
                    .classed("bold_tick", true)
            })
            .on("mouseout", function () {
                d3.selectAll("g.tick.bold_tick")
                    .style("font-weight", "normal")
                    .style("font-size", "100%")
                    .classed("bold_tick", false)
            })
    });
}

/**
 * Adjusts the x-axis of the tyre plot based on the total number of laps.
 */
function adjust_x_axis_tyre_plot(total_laps) {

    const svg = d3.select("#tyre_plot").select("svg").select("g");

    x = d3.scaleLinear()
        .domain([0, total_laps])
        .range([0, width])

    svg.select(".x-axis")
        .transition()
        .duration(300)
        .call(d3.axisBottom(x)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")))
}
