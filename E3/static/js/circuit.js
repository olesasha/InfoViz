export { init_circuit , set_circuit_sasha}

// Global Variables
var driver_dots, x_scale, y_scale, race_interval, line_circuit
var global_index = 0
var race_started = false
var selected_circuit = "Italian Grand Prix"
var selected_year = 2018
var temp_global_circuit_data



function init_circuit(circuit_data, driver_pos_data) {
    console.log(circuit_data);
    render_select(circuit_data)
    render_curcuit(circuit_data, driver_pos_data)
    set_circuit(circuit_data)
    temp_global_circuit_data = circuit_data
}

var margin = { top: 100, right: 50, bottom: 50, left: 50 },
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom

function render_curcuit(circuit_data, driver_pos_data) {

    circuit_data = circuit_data.filter(function (d) {
        return d["event_name"] === selected_circuit
    })

    var svg = d3.select("#circuit")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "circuit_plot")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")



    x_scale = d3.scaleLinear()
        .domain(d3.extent(circuit_data, function (d) { return d["x"] }))
        .range([0, width])


    // append the x axis
    svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x_scale)
            .tickSizeOuter(0)
            .tickFormat(d3.format("d")) // format the years stores as integers to show like "2,000" -> "2000"
        )


    y_scale = d3.scaleLinear()
        .domain(d3.extent(circuit_data, function (d) { return d["y"] }))
        .range([height, 0])

    // append y axis
    svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y_scale)
            .tickSizeOuter(0))


    line_circuit = svg
        .append("g")
        .append("path")
        .datum(circuit_data)
        .attr("stroke", "black")
        .style("stroke-width", 4)
        .style("fill", "none")
        .attr("d", d3.line()
            .x(function (d) { return x_scale(d["x"]) })
            .y(function (d) { return y_scale(d["y"]) })
        )



    driver_dots = svg.selectAll("circle")
        .data(driver_pos_data)
        .enter()
        .append("circle")
        .attr("cx", d => x_scale(d.positions[0].X))
        .attr("cy", d => y_scale(d.positions[0].Y))
        .attr("r", 5)
        .style("fill", d => d.color);


    // TODO: This button has to be redone for the final design
    d3.select("#start_race").on("click", start_race)
    d3.select("#stop_race").on("click", stop_race)
    d3.select("#resume_race").on("click", resume_race)
}



function start_race() {

    if (!race_started) {
        driver_dots
            .attr("cx", d => x_scale(d.positions[0].X))
            .attr("cy", d => y_scale(d.positions[0].Y))

        animate_race(0)
        race_started = true

    }
}

function stop_race() {
    clearInterval(race_interval)
    race_started = false
}

function resume_race() {
    race_started = true
    animate_race(global_index)
}

function animate_race(index) {

    function update(i) {

        driver_dots.transition()
            .duration(270)
            .ease(d3.easeLinear)  // Use linear easing function
            .attr("cx", d => x_scale(d.positions[i].X))
            .attr("cy", d => y_scale(d.positions[i].Y));
    }

    race_interval = setInterval(() => {
        index = index + 1
        update(index)
        global_index = index
    }, 270);

}

function set_circuit(circuit_data) {
    d3.select("#selectCircuit").on("change", function (d) {
        selected_circuit = d3.select(this).property("value")
        update_circuit(circuit_data)
    })

    d3.select("#select_year").on("change", function (d) {
        selected_year = d3.select(this).property("value")
        update_circuit(circuit_data)
    })
}

function set_circuit_sasha(circuit,year){
    selected_circuit = circuit
    selected_year = year
    update_circuit(temp_global_circuit_data)
}


function update_circuit(circuit_data) {
    var svg = d3.select("#circuit").select("g")
    var filtered_circuit_data = circuit_data.filter(function (d) {
        return (d["event_name"] === selected_circuit && d["year"] == selected_year)
    })

    console.log("filtred", filtered_circuit_data);

    x_scale.domain(d3.extent(filtered_circuit_data, function (d) { return d["x"] }))
    y_scale.domain(d3.extent(filtered_circuit_data, function (d) { return d["y"] }))

    svg.select(".yAxis")
        .call(d3.axisLeft(y_scale)
            .tickSizeOuter(0))

    svg.select(".xAxis")
        .call(d3.axisBottom(x_scale)
            .tickSizeOuter(0))

    line_circuit
        .datum(filtered_circuit_data)
        .attr("d", d3.line()
            .x(function (d) { return x_scale(d["x"]) })
            .y(function (d) { return y_scale(d["y"]) })
        )



}


function render_select(circuit_data) {
    var all_event_names = new Set(d3.map(circuit_data, (d) => d["event_name"]))
    var all_years = new Set(d3.map(circuit_data, (d) => d["year"]))
    d3.select("#selectCircuit")
        .selectAll("myOptions")
        .data(all_event_names)
        .enter()
        .append("option")
        .text(function (d) { return d }) // text showed in the menu
        .attr("value", function (d) { return d }) // corresponding value returned by the button
        .style("top", "10px")
        .style("left", "10px")


    d3.select("#select_year")
        .selectAll("myOptions")
        .data(all_years)
        .enter()
        .append("option")
        .text(function (d) { return d }) // text showed in the menu
        .attr("value", function (d) { return d }) // corresponding value returned by the button
        .style("top", "10px")
        .style("left", "10px")
}