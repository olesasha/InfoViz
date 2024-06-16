// exports and imports for the module
export { init_globe };
import { set_circuit_from_globe, stop_race} from "./circuit.js";

// global variable to track rotation permission
let rotationAllowed = true;

// global variables for connection and defaults
window.selectedYear_global = 2020;
window.selectedCircuit_global = "Styrian Grand Prix";


/**
 * Initializes the globe with location data of the circuits and borders of the countries
 */

function init_globe(globe_data, circuit_geo_data) {
    render_globe(globe_data, circuit_geo_data);
}

// CONSTANTS
// colors
const GLOBE_FILL = "#EEE";
const COUNTRY_FILL = "#ff392e";
const LOC_COLOR = "black";
const LINE_COLOR = "black";

// dimensions
let GLOBE_WIDTH = window.innerWidth;
let GLOBE_HEIGHT = window.innerHeight;
let GLOBE_RADIUS = 400;
let GLOBE_CENTER = [GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2];
let TILT = 30;
const DOT_RADIUS = 5;

// interaction
const DRAG_SENSITIVITY = 50;

/**
 * Main rendering function for the globe
 */

function render_globe(globe_data, circuit_geo_data) {

    // mapping circuit location data to the world data
    const circuit_countries = new Set(circuit_geo_data.map(data => data.country)); 
    // tooltip
    const globe_tooltip = d3.select("body")
        .append("div")
        .attr("id", "globe_tooltip")
        .attr("class", "tooltip");
    
    // init projection
    var projection = d3.geoOrthographic()       
                    .scale(GLOBE_RADIUS)
                    .center([0, 0])
                    .rotate([0,-TILT])
                    .translate(GLOBE_CENTER);
    const initialScale = projection.scale();

    // append svg to the globe container 
    var svg = d3.select('#globe')
                .append("svg")
                .attr("width", GLOBE_WIDTH)
                .attr("height", GLOBE_HEIGHT)
                .on("mousedown", function() {
                    setTimeout(function() {
                        rotationAllowed = false;
                    }, 250); // adjust the delay as needed
                });

    var path = d3.geoPath().projection(projection, svg);

    // outline of the globe
    var globe = svg.append("circle")
                    .attr("fill", GLOBE_FILL)
                    .attr("stroke", "#000")
                    .attr("stroke-width", "0.2")
                    .attr("cx", GLOBE_WIDTH/2)
                    .attr("cy", GLOBE_HEIGHT/2)
                    .attr("r", initialScale);

    // append a group to the svg
    const map = svg.append("g")
            
    map.append("g")
        .attr("class", "countries" )
        .selectAll("path")
        .data(globe_data.features)
        .enter().append("path")
        .attr("class", d => "country_" + d.properties.name.replace(" ","_"))
        .attr("d", path)
        .attr("fill", d => circuit_countries.has(d.properties.name) ? COUNTRY_FILL : "white")  // highlight the circuit countries
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .style("opacity",0.8);
    
        svg.call(d3.drag()          // draging
        .on('drag', function(event) {
            if (!rotationAllowed) {
                const rotate = projection.rotate();
                // calculate the new rotation based on the drag distance
                const k = DRAG_SENSITIVITY / projection.scale();
                const newRotation = [
                    rotate[0] + event.dx * k, // update the longitude
                    rotate[1] - event.dy * k  // update the latitude
                ];
                projection.rotate(newRotation);
    
                // Update pins' positions and visibility 
                    svg.selectAll(".pin")
                        .attr("transform", function(d) {
                            const coords = [d.long, d.lat];
                            const visibility = isInView(projection, coords) ? "visible" : "hidden";
                            return "translate(" + projection(coords) + ") scale(" + (visibility === "visible" ? 1 : 0) + ")";
                        });
        
                svg.selectAll("path").attr("d", path); // redraw all paths with the new projection
            }
        }))
        .call(d3.zoom()         // zooming
        .scaleExtent([0.3, Infinity])
        .on('zoom', function(event) {
            // update the scale of the projection based on zoom level
            if (event.transform.k > 0.3) {
                projection.scale(initialScale * event.transform.k);

                svg.selectAll("path").attr("d", path); // redraw all paths with the new scale
                globe.attr("r", projection.scale()); // update the globe's radius

                // Update pins' positions and visibility
                svg.selectAll(".pin")
                    .attr("transform", function(d) {
                        const coords = [d.long, d.lat];
                        const visibility = isInView(projection, coords) ? "visible" : "hidden";
                        return "translate(" + projection(coords) + ") scale(" + (visibility === "visible" ? 1 : 0) + ")";
                    });
            } else {
                event.transform.k = 0.3; // prevent zooming out too much
            }
        }));

    
        svg.selectAll(".pin")
            .data(circuit_geo_data)
            .enter().append("circle")
            .attr("class", "pin")
            .attr("r", DOT_RADIUS)
            .attr("fill", LOC_COLOR) 
            .attr("opacity", 0.7) 
            .attr("transform", function(d) {
                const coords = [d.long, d.lat]; 
                const visibility = isInView(projection, coords) ? "visible" : "hidden";
                return "translate(" + projection(coords) + ") scale(" + (visibility === "visible" ? 1 : 0) + ")";
            })
            .on("mouseover", function(event, d) {
                globe_tooltip.style("display", "block")
                .html(`<span class="tooltip-bold"></span> ${d.circuitName}<br><span class="tooltip-regular">${d.locality}, ${d.country}</span>`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY + 5) + "px");
            })
            .on("mouseout", function() {
                globe_tooltip.style("display", "none");
            })
            .on("mousedown", function(event, d) {
                setTimeout(function() {
                    window.selectedCircuit_global = d.gp_name;
                    set_circuit_from_globe(selectedYear_global, d.round_number);
                    showRacePage(); // Switch to the race page
                }, 250); 
            });

        
    /**
     * Check if the point should be visible depending on the rotation position of the globee
     */

        function isInView(projection, coords) {
            const [x, y] = projection(coords);
            const [centerX, centerY] = projection.invert([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2]);

            const distance = d3.geoDistance(coords, [centerX, centerY]);
            return distance <= Math.PI / 2 && x >= 0 && x <= GLOBE_WIDTH && y >= 0 && y <= GLOBE_HEIGHT;
    }

    /**
     * Initializes the year slider
     */

    function initSlider() {
        const years = Array.from({ length: 5 }, (_, index) => 2020 + index);
    
        const sliderContainer = d3.select("#slider-container");
    
        // check if the slider input already exists
        const existingSlider = sliderContainer.select("#year-slider");
        const existingSliderInput = existingSlider.select("input");
        if (!existingSliderInput.empty()) {
            return; // slider input already exists, no need to recreate
        }
    
        // append the slider input element
        const slider = existingSlider
            .append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", years.length - 1)
            .attr("value", 0)
            .attr("step", 1)
            .classed("slider", true)
            .on("input", function() {
                const selectedYearIndex = +this.value;
                const selectedYear = years[selectedYearIndex];
                updateData(selectedYear); // update data based on selected year
                updateLabels(selectedYearIndex); 
                window.selectedYear_global = selectedYear;  // write global var
                rotationAllowed = true; // restart the globe rotation when another year is chosen
            });
    
        // append the year labels
        const labelsContainer = sliderContainer.select("#years-labels");
    
        labelsContainer.selectAll("div")
            .data(years)
            .enter()
            .append("div")
            .attr("class", "year-label")
            .text(d => d);
    
        function updateLabels(selectedYearIndex) {
            labelsContainer.selectAll("div")
                .classed("bold", (d, i) => i === selectedYearIndex)
                .classed("normal", (d, i) => i !== selectedYearIndex);
        }
    
        // initialize the labels with the first year highlighted
        updateLabels(0);
    }

    /**
     * Communicated with Flask App and requests the new filtered data for globe rendering
     */

    function updateData(selectedYear) {
        return new Promise((resolve, reject) => {
            d3.json(`/update_circuit_geo_data/${selectedYear}`)
                .then(function(circuit_geo_data) {
                    // call a function to update globe visualization with new data
                    updateGlobe(globe_data, circuit_geo_data);
                    resolve(circuit_geo_data); // sesolve the promise with the updated data
                })
                .catch(function(error) {
                    console.error("Error updating data:", error);
                    reject(error); // reject the promise with the error
                });
        });
    }
    
    initSlider();
    
    /**
     * Remove the old globe and draw a new one with updated data
     */

    function updateGlobe(globe_data, circuit_geo_data) {
        d3.select('#globe').selectAll("*").remove();
        render_globe(globe_data, circuit_geo_data);
    }
    
    /**
     * modified template: https://observablehq.com/@d3/world-tour?intent=fork
     * Draws arcs on the globe and rotates it from location to location to show the event schedule
     * The lines are interpolated between two locations using the Versor class.
     */

    async function worldTour(circuit_geo_data, projection) {
        const tilt = 10; // different tilt for the rotation
        const duration = 1750; 
    
        for (let i = 0; i < circuit_geo_data.length - 1; i++) {
            if (!rotationAllowed) break; // check if animation should stop
    
            const p1 = [circuit_geo_data[i].long, circuit_geo_data[i].lat];
            const p2 = [circuit_geo_data[i + 1].long, circuit_geo_data[i + 1].lat];
    
            const r1 = [-p1[0], tilt - p1[1], 0];
            const r2 = [-p2[0], tilt - p2[1], 0];
    
            const ip = d3.geoInterpolate(p1, p2);
            const iv = Versor.interpolateAngles(r1, r2);
    
            await d3.transition()
                .duration(duration)
                .tween("rotate", () => t => {
                    if (!rotationAllowed) return; // check if animation should stop
                    projection.rotate(iv(t));
    
                    // redraw all paths with the updated projection
                    svg.selectAll("path").attr("d", path);
                    updatePins(projection);
                    renderLines({ type: "LineString", coordinates: [p1, ip(t)] });
                })
                .end();
        }
    }
    
    
    /**
     * Updated the visibility of location pins as the globe rotates 
     */
    
    function updatePins(projection) {
        svg.selectAll(".pin")
            .attr("transform", d => {
                const coords = [d.long, d.lat];
                const visibility = isInView(projection, coords) ? "visible" : "hidden";
                return `translate(${projection(coords)}) scale(${visibility === "visible" ? 1 : 0})`;
            });
    }
    

    /**
     * Draws arcs on the globe and rotates it from location to location to show the event schedule
     */
    

    function renderLines(arc) {

        svg.append('path')
        .datum(arc)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', LINE_COLOR)
        .attr('stroke-width', 2)
        .style('opacity', 0.06);
    }
    
    // start the world tour
    worldTour(circuit_geo_data, projection);
}


// template: https://observablehq.com/@d3/world-tour?intent=fork
class Versor {
    static fromAngles([l, p, g]) {
      l *= Math.PI / 360;
      p *= Math.PI / 360;
      g *= Math.PI / 360;
      const sl = Math.sin(l), cl = Math.cos(l);
      const sp = Math.sin(p), cp = Math.cos(p);
      const sg = Math.sin(g), cg = Math.cos(g);
      return [
        cl * cp * cg + sl * sp * sg,
        sl * cp * cg - cl * sp * sg,
        cl * sp * cg + sl * cp * sg,
        cl * cp * sg - sl * sp * cg
      ];
    }
    static toAngles([a, b, c, d]) {
      return [
        Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
        Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
        Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
      ];
    }
    static interpolateAngles(a, b) {
      const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
      return t => Versor.toAngles(i(t));
    }
    static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
      a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
      const x = new Array(4);
      return t => {
        const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
        x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
        return x;
      };
    }
    static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
      let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
      if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
      if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]); 
      const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
      const x = new Array(4);
      const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
      a2 /= l, b2 /= l, c2 /= l, d2 /= l;
      return t => {
        const theta = theta0 * t;
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        x[0] = a1 * c + a2 * s;
        x[1] = b1 * c + b2 * s;
        x[2] = c1 * c + c2 * s;
        x[3] = d1 * c + d2 * s;
        return x;
      };
    }}

// TRANSITION FROM GLOBE TO CIRCUIT AND BACK
function showRacePage() {
    document.getElementById('start_page').style.display = 'none';
    document.getElementById('race_page').style.display = 'flex';
    }
    
    // Function to switch to the start page
    function showStartPage() {
    stop_race()
    document.getElementById('race_page').style.display = 'none';
    document.getElementById('start_page').style.display = 'flex';
    }
    
    document.addEventListener("DOMContentLoaded", function() {
    // Initially display the start page and hide the race page
    document.getElementById('start_page').style.display = 'flex';
    document.getElementById('race_page').style.display = 'none';
    
    // Add event listeners to the buttons
    //document.getElementById('switch_to_race_page').addEventListener('click', showRacePage);
    document.getElementById('switch_to_start_page').addEventListener('click', showStartPage);
    });