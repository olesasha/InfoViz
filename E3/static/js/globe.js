// exports and imports for the module
export { init_globe, set_year };

// global variables for connection
let selectedYear_global;

// setter function for year
function set_year(year) {
    selectedYear_global = year;
    console.log(selectedYear_global);
}


// init function that is called by the backend at the start 
function init_globe(globe_data, circuit_data) {
    render_globe(globe_data, circuit_data);
}

// CONSTANTS
// colors
const GLOBE_FILL = "#EEE";
const COUNTRY_FILL = "#FF6961";
const LOC_COLOR = "navy";

// dimensions
let GLOBE_WIDTH = window.innerWidth;
let GLOBE_HEIGHT = window.innerHeight;
let GLOBE_RADIUS = 600;
let GLOBE_CENTER = [GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2];
const DOT_RADIUS = 5;

// interaction
const DRAG_SENSITIVITY = 50;

// main rendering function for the globe
function render_globe(globe_data, circuit_data) {

    // mapping circuit location data to the world data
    const circuit_countries = new Set(circuit_data.map(data => data.country)); 
    // tooltip
    const globe_tooltip = d3.select("body")
        .append("div")
        .attr("id", "globe_tooltip")
        .attr("class", "tooltip");
    
    // init projection
    var projection = d3.geoOrthographic()       
                    .scale(GLOBE_RADIUS)
                    .center([0, 0])
                    .rotate([0,-30])
                    .translate(GLOBE_CENTER);
    const initialScale = projection.scale();

    var path = d3.geoPath().projection(projection);

    // append svg to the globe container 
    var svg = d3.select('#globe')
                .append("svg")
                .attr("width", GLOBE_WIDTH)
                .attr("height", GLOBE_HEIGHT);


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
            

   svg.call(d3.drag()
    .on('drag', function(event) {
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
        path = d3.geoPath().projection(projection);
        svg.selectAll("path").attr("d", path); // redraw all paths with the new projection
        }))
        .call(d3.zoom()
        .scaleExtent([0.3, Infinity])
        .on('zoom', function(event) {
            // update the scale of the projection based on zoom level
            if (event.transform.k > 0.3) {
                projection.scale(initialScale * event.transform.k);
                path = d3.geoPath().projection(projection);
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
            .data(circuit_data)
            .enter().append("circle")
            .attr("class", "pin")
            .attr("r", DOT_RADIUS)
            .attr("fill", LOC_COLOR) 
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
            });

    // Function to check if a point is within the visible area of the globe
    function isInView(projection, coords) {
        const [x, y] = projection(coords);
        const [centerX, centerY] = projection.invert([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2]);

        const distance = d3.geoDistance(coords, [centerX, centerY]);
        return distance <= Math.PI / 2 && x >= 0 && x <= GLOBE_WIDTH && y >= 0 && y <= GLOBE_HEIGHT;
    }

    function initSlider() {
        // Hardcoded years from 2020 to 2024
        const years = Array.from({ length: 5 }, (_, index) => 2020 + index);
    
        const sliderContainer = d3.select("#slider-container");
        
        // Check if the slider already exists
        const existingSlider = sliderContainer.select("#slider input");
        if (!existingSlider.empty()) {
            return; // Slider already exists, no need to recreate
        }
    
        // Append the slider input element
        const slider = sliderContainer.select("#slider")
            .append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", years.length - 1)
            .attr("value", 0)
            .attr("step", 1)
            .on("input", function() {
                const selectedYearIndex = +this.value;
                const selectedYear = years[selectedYearIndex];
                updateData(selectedYear); // update data based on selected year
                updateLabels(selectedYearIndex); 
                set_year(selectedYear);  // write global var
            });
    
        // Append the year labels
        const labelsContainer = sliderContainer.select("#years-labels");
    
        labelsContainer.selectAll("div")
            .data(years)
            .enter()
            .append("div")
            .attr("class", "year-label")
            .style("text-align", "left")
            .text(d => d);

        function updateLabels(selectedYearIndex) {
            labelsContainer.selectAll("div")
                .classed("bold", (d, i) => i === selectedYearIndex)
                .classed("normal", (d, i) => i !== selectedYearIndex);
        }
            
        // Initialize the labels with the first year highlighted
        updateLabels(0);
    }
    
    function updateData(selectedYear) {
        d3.json(`/update_circuit_data/${selectedYear}`)
            .then(function(circuit_data) {
                // Call a function to update globe visualization with new data
                updateGlobe(globe_data, circuit_data);
            })
            .catch(function(error) {
                console.error("Error updating data:", error);
            });
    }
    
    initSlider();
    
    function updateGlobe(globe_data, circuit_data) {
        // remove existing elements from the svg
        d3.select('#globe').selectAll("*").remove();
        // re-render the globe with the new data
        render_globe(globe_data, circuit_data);
    }
    
}

