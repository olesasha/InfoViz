export { init_globe };

function init_globe(globe_data, circuit_data) {
    render_globe(globe_data, circuit_data);
}

function render_globe(globe_data, circuit_data) {

    console.log(circuit_data)
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    let sensitivity = 40    // dragging sens
    const config = {
        speed: 0.003,      // rotation speed
        verticalTilt: -30,
        horizontalTilt: 0};

    const circuit_countries = new Set(circuit_data.map(globe_data => globe_data.country));    
    
    var projection = d3.geoOrthographic()
                    .scale(500)
                    .center([0, 0])
                    .rotate([0,-30])
                    .translate([width / 2, height / 2])
    
    const initialScale = projection.scale()
    var path = d3.geoPath().projection(projection)

    var svg = d3.select('#globe')
                .append("svg")
                .attr("width", width)
                .attr("height", height)

    var globe = svg.append("circle")
                    .attr("fill", "#EEE")
                    .attr("stroke", "#000")
                    .attr("stroke-width", "0.2")
                    .attr("cx", width/2)
                    .attr("cy", height/2)
                    .attr("r", initialScale)
    
    // dragging 
    svg.call(d3.drag()
    .on('drag', function(event) {
        const rotate = projection.rotate();
        // calculate the new rotation based on the drag distance
        const k = sensitivity / projection.scale();
        const newRotation = [
            rotate[0] + event.dx * k, // update the longitude
            rotate[1] - event.dy * k  // update the latitude
        ];
        projection.rotate(newRotation);


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
            } else {
                event.transform.k = 0.3; // prevent zooming out too much
            }
        }))
                    
        let map = svg.append("g")

        let country_name = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .style("visibility", "hidden");
    
        map.append("g")
        .attr("class", "countries" )
        .selectAll("path")
        .data(globe_data.features)
        .enter().append("path")
        .attr("class", d => "country_" + d.properties.name.replace(" ","_"))
        .attr("d", path)
        .attr("fill", d => circuit_countries.has(d.properties.name) ? "#FF6961" : "white")  // highlight the circuit countries
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
                    
        //rotate
       /* d3.timer(function(elapsed) {
        const rotate = projection.rotate()
        const k = sensitivity / projection.scale()
        projection.rotate([
            rotate[0] - 1 * k,
            rotate[1]
        ])
        path = d3.geoPath().projection(projection)
        svg.selectAll("path").attr("d", path)
        },200)
        */
}