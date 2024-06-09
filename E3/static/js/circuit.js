export { init_circuit, set_circuit_sasha }
import { update_driver_pos_chart, update_driver_pos_first_lap, adjust_x_axis_pos_plot} from "./positions.js";

// Global Variables
var driver_dots, x_scale, y_scale, race_interval, line_circuit, svg, width, height, race_data, total_laps, last_index
var global_index = 0
var race_started = false
var selected_round = 1
var selected_year = 2020
var max_width_or_height = 800
var animation_speed = 20
var temp_global_circuit_data
var current_lap = 1
var current_leader = 1


function init_circuit(circuit_data) {
    update_race_data_and_race(selected_year, selected_round)
    update_driver_pos_first_lap(selected_year,selected_round)
    calculate_width_and_height(circuit_data)
    render_select(circuit_data)
    render_circuit(circuit_data)
    set_circuit(circuit_data)
    temp_global_circuit_data = circuit_data
}

var margin = { top: 50, right: 50, bottom: 50, left: 50 }

function render_circuit(circuit_data) {

    circuit_data = circuit_data.filter(function (d) {
        return (d["round_number"] == selected_round && d["year"] == selected_year)
    })

    svg = d3.select("#circuit")
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

    // TODO: This button has to be redone for the final design
    d3.select("#start_race").on("click", start_race)
    d3.select("#stop_race").on("click", stop_race)
    d3.select("#resume_race").on("click", resume_race)
}



function start_race() {


    if (!race_started) {
        init_lap_counter_and_slider(race_data)
        driver_dots
            .attr("cx", d => x_scale(d.positions[0].x))
            .attr("cy", d => y_scale(d.positions[0].y))

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
            .duration(animation_speed)
            .ease(d3.easeLinear)  // Use linear easing function
            .attr("cx", d => x_scale(d.positions[i].x))
            .attr("cy", d => y_scale(d.positions[i].y))

    }


    race_interval = setInterval(() => {
        index = index + 1
        update(index)
        update_lap(index)
        global_index = index

    }, animation_speed);

}

function set_circuit(circuit_data) {
    d3.select("#selectCircuit").on("change", function (d) {
        selected_round = d3.select(this).property("value")
        update_circuit(circuit_data)
        update_race_data_and_race(selected_year, selected_round)
    })

    d3.select("#select_year").on("change", function (d) {
        selected_year = d3.select(this).property("value")
        update_circuit(circuit_data)
        update_race_data_and_race(selected_year, selected_round)
    })
}

function set_circuit_sasha(circuit, year) {
    selected_round = circuit
    selected_year = year
    update_circuit(temp_global_circuit_data)
}


function update_circuit(circuit_data) {
    var filtered_circuit_data = circuit_data.filter(function (d) {
        return (d["round_number"] == selected_round && d["year"] == selected_year)
    })
    calculate_width_and_height(circuit_data)
    update_driver_pos_first_lap(selected_year,selected_round)

    d3.select('#circuit').selectAll("*").remove();
    render_circuit(circuit_data)

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
    var all_round_numbers = new Set(d3.map(circuit_data, (d) => d["round_number"]))
    var all_years = new Set(d3.map(circuit_data, (d) => d["year"]))
    d3.select("#selectCircuit")
        .selectAll("myOptions")
        .data(all_round_numbers)
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



// Define a function to update data based on selected year
function update_race_data_and_race(selected_year, selected_round) {
    d3.json(`/update_race_data/${selected_year}/${selected_round}`)
        .then(function (race_data) {
            init_lap_counter_and_slider(race_data)
            set_race_global_race_data(race_data)
            update_race(race_data)
        })
        .catch(function (error) {
            console.error("Error updating data:", error);
        });
}

function update_race(race_data) {
    stop_race()
    svg.selectAll("circle").remove()
    driver_dots = svg.selectAll("circle")
        .data(race_data)
        .enter()
        .append("circle")
        .attr("cx", d => x_scale(d.positions[0].x))
        .attr("cy", d => y_scale(d.positions[0].y))
        .attr("r", 5)
        .style("fill", d => `#${d.team_color}`)
}

function calculate_width_and_height(circuit_data) {

    var filtered_circuit_data = circuit_data.filter(function (d) {
        return (d["round_number"] == selected_round && d["year"] == selected_year)
    })

    var ratio = (d3.max(filtered_circuit_data, d => d["x"]) - d3.min(filtered_circuit_data, d => d["x"])) / (d3.max(filtered_circuit_data, d => d["y"]) - d3.min(filtered_circuit_data, d => d["y"]))
    if (ratio >= 1) {
        width = (max_width_or_height - margin.left - margin.right)
        height = Math.round(max_width_or_height / ratio - margin.top - margin.bottom)

    }

    else {
        width = Math.round(max_width_or_height * ratio - margin.left - margin.right)
        height = (max_width_or_height - margin.top - margin.bottom)
    }
}



function set_race_global_race_data(rd) {
    race_data = rd
}

function init_lap_counter_and_slider(rd) {


    var allLaps = rd.flatMap(d => d.lap)
    var lapNumbers = allLaps.map(lap => lap.LapNumber);
    total_laps = d3.max(lapNumbers);

    adjust_x_axis_pos_plot(total_laps)

    d3.select("#lap_display").text(`1/${total_laps}`)

    d3.select("#lapSlider")
        .attr("max", total_laps)
        .on("input", function () {
            stop_race()
            update_animation_lap(this.value)
            resume_race()
        })

    d3.select("#speedSlider").on("input", function () {
        stop_race()
        animation_speed = -this.value;
        resume_race()
    })
}

function update_lap(index) {

    function update(driver_index) {
        current_leader = driver_index
        current_lap = race_data[driver_index]["lap"][index]["LapNumber"]
        d3.select("#lap_display").text(`${current_lap}/${total_laps}`)
        update_driver_pos_chart(selected_year, selected_round, current_lap)
    }


    if (race_data[current_leader]["pos"][index]["Position"] == 1 ) {
        if (race_data[current_leader]["lap"][index]["LapNumber"] != current_lap) {
            update(current_leader)
        }
    }
    else {
        for (var i = 0; i < race_data.length; i++) {
            // get driver in first
            if (race_data[i]["pos"][index]["Position"] == 1) {
                if (race_data[i]["lap"][index]["LapNumber"] != current_lap) {
                    update(i)
                    break
                }
            }
        }
    }
}

function update_animation_lap(new_lap) {

    var min_index = Infinity
    race_data.forEach((d,index) => {
        var temp_index = d.lap.findIndex(d => d.LapNumber == new_lap)
        if (temp_index >= 0){
            if (temp_index < min_index){
                min_index = temp_index
                current_leader = index
            }
        }
    });
    global_index = min_index

}



