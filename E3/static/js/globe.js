export { init_globe };

function init_globe(globe_data) {
    render_globe(globe_data);
}

function render_globe(globe_data) {

    var width = 500
    var height = 500
    var sensitivity = 75
    const config = {
        speed: 0.005,
        verticalTilt: -30,
        horizontalTilt: 0};
    
    var projection = d3.geoOrthographic()
                    .scale(250)
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
    
                    svg.call(d3.drag().on('drag', () => {
                        const rotate = projection.rotate()
                        const k = sensitivity / projection.scale()
                        projection.rotate([
                          rotate[0] + d3.event.dx * k,
                          rotate[1] - d3.event.dy * k
                        ])
                        path = d3.geoPath().projection(projection)
                        svg.selectAll("path").attr("d", path)
                      }))
                        .call(d3.zoom().on('zoom', () => {
                          if(d3.event.transform.k > 0.3) {
                            projection.scale(initialScale * d3.event.transform.k)
                            path = d3.geoPath().projection(projection)
                            svg.selectAll("path").attr("d", path)
                            globe.attr("r", projection.scale())
                          }
                          else {
                            d3.event.transform.k = 0.3
                          }
                        }))
                    
                      let map = svg.append("g")
                    
                      let data = globe_data
                    
                      map.append("g")
                        .attr("class", "countries" )
                        .selectAll("path")
                        .data(data.features)
                        .enter().append("path")
                        .attr("class", d => "country_" + d.properties.name.replace(" ","_"))
                        .attr("d", path)
                        .attr("fill", "white")
                        .style('stroke', 'black')
                        .style('stroke-width', 0.3)
                        .style("opacity",0.8)
                    
                      //Optional rotate
                      d3.timer(function(elapsed) {
                        const rotate = projection.rotate()
                        const k = sensitivity / projection.scale()
                        projection.rotate([
                          rotate[0] - 1 * k,
                          rotate[1]
                        ])
                        path = d3.geoPath().projection(projection)
                        svg.selectAll("path").attr("d", path)
                      },200)
}