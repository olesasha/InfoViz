import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export { init_globe };

function init_globe(globe_data) {
    render_globe(globe_data);
}

function render_globe(globe_data) {
    const width = 960;
    const height = 500;
    const config = {
        speed: 0.005,
        verticalTilt: -30,
        horizontalTilt: 0
    };
    let locations = [];
    const svg = d3.select('svg')
        .attr('width', width).attr('height', height);
    const markerGroup = svg.append('g');
    const projection = d3.geoOrthographic();
    const initialScale = projection.scale();
    const path = d3.geoPath().projection(projection);
    const center = [width / 2, height / 2];

    drawGlobe();
    drawGraticule();
    enableRotation();

    function drawGlobe() {
        d3.queue()
            .defer(d3.json, 'https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json')
            .defer(d3.json, globe_data)
            .await((error, worldData, locationData) => {
                if (error) throw error;

                svg.selectAll(".segment")
                    .data(topojson.feature(worldData, worldData.objects.countries).features)
                    .enter().append("path")
                    .attr("class", "segment")
                    .attr("d", path)
                    .style("stroke", "#888")
                    .style("stroke-width", "1px")
                    .style("fill", (d, i) => '#e5e5e5')
                    .style("opacity", ".6");

                locations = locationData;
                drawMarkers();
            });
    }

    function drawGraticule() {
        const graticule = d3.geoGraticule()
            .step([10, 10]);

        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path)
            .style("fill", "#fff")
            .style("stroke", "#ccc");
    }

    function enableRotation() {
        d3.timer(function (elapsed) {
            projection.rotate([config.speed * elapsed - 120, config.verticalTilt, config.horizontalTilt]);
            svg.selectAll("path").attr("d", path);
            drawMarkers();
        });
    }

    function drawMarkers() {
        const markers = markerGroup.selectAll('circle')
            .data(locations);
        markers
            .enter()
            .append('circle')
            .merge(markers)
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('fill', d => {
                const coordinate = [d.longitude, d.latitude];
                const gdistance = d3.geoDistance(coordinate, projection.invert(center));
                return gdistance > 1.57 ? 'none' : 'steelblue';
            })
            .attr('r', 7);

        markerGroup.each(function () {
            this.parentNode.appendChild(this);
        });
    }
}
