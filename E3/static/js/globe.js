// exports and imports for the module
export { init_globe };

// init function that is called by the backend at the start 
function init_globe(globe_data, circuit_data) {
    render_globe(globe_data, circuit_data);
}

// CONSTANTS
// colors
const GLOBE_FILL = "#EEE";
const GLOBE_HOVER_FILL = "yellow";
const COUNTRY_FILL = "#FF6961";
const LOC_COLOR = "navy";

// dimensions
let GLOBE_WIDTH = window.innerWidth;
let GLOBE_HEIGHT = window.innerHeight;
let GLOBE_RADIUS = 500;
let GLOBE_CENTER = [GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2];
const DOT_RADIUS = 5;

// interaction
const DRAG_SENSITIVITY = 50;

// main rendering function for the globe
function render_globe(globe_data, circuit_data) {

    // mapping circuit location data to the world data
    const circuit_countries = new Set(circuit_data.map(data => data.country)); 
    // tooltip
    const toolTip = d3.select("#tooltip")
    
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

    // add canvas for the dots
    var globeCanvas = d3.select('#globe')
        .append("canvas")
        .attr("width", GLOBE_WIDTH)
        .attr("height", GLOBE_HEIGHT)
        .style("position", "absolute")
        .style("z-index", 0)
        .style("pointer-events", "none");

    const globeDotsCanvas = globeCanvas.node().getContext("2d");

    // convert geoJson data to svg path
    const geoPathGenerator = d3.geoPath().projection(projection);

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
        .style("opacity",0.8)
        .on("mouseover", (event, d) => {
            country_name.style("visibility", "visible").text(d.properties.name);
        })
        .on("mousemove", (event) => {
            country_name.attr("x", event.pageX - svg.node().getBoundingClientRect().left)
                    .attr("y", event.pageY - svg.node().getBoundingClientRect().top + 20);
        })
        .on("mouseout", () => {
            country_name.style("visibility", "hidden");
        });
            

   svg.call(d3.drag()
    .on('drag', function(event) {
        const rotate = projection.rotate();
        // calculate the new rotation based on the drag distance
        const k = DRAG_SENSITIVITY / projection.scale();
        const newRotation = [
            rotate[0] + event.dx * k * 1.2, // update the longitude
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
            .attr("fill", LOC_COLOR) // adjust color as needed
            .attr("transform", function(d) {
                const coords = [d.long, d.lat]; // Adjust the property names according to your data
                const visibility = isInView(projection, coords) ? "visible" : "hidden";
                return "translate(" + projection(coords) + ") scale(" + (visibility === "visible" ? 1 : 0) + ")";
            });

        // Function to check if a point is within the visible area of the globe
        function isInView(projection, coords) {
            const [x, y] = projection(coords);
            const [centerX, centerY] = projection.invert([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2]);
        
            const distance = d3.geoDistance(coords, [centerX, centerY]);
            return distance <= Math.PI / 2 && x >= 0 && x <= GLOBE_WIDTH && y >= 0 && y <= GLOBE_HEIGHT;
    }

    
}

   