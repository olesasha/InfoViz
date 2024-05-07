d3.json("/data").then(function(data) {
    // Data processing and visualization code here
    console.log(data); // verify data is loaded
    var graphData = data;
          // set the dimensions and margins of the graph
      // set the dimensions and margins of the graph
      var margin = { top: 60, right: 60, bottom: 100, left: 700 },
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

      // Labels of row and columns
      var myGroups = ['retired', 'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets',
        'Charlotte Hornets', 'Chicago Bulls', 'Cleveland Cavaliers',
        'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons',
        'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
        'Los Angeles Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies',
        'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves',
        'New Orleans Pelicans', 'New York Knicks', 'Oklahoma City Thunder',
        'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
        'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs',
        'Toronto Raptors', 'Utah Jazz', 'Washington Wizards']
      var myVars = ['Number of Players', 'Height',
        'Weight', 'Number of Birth Places', 'Total Games',
        'Total Minutes Played', 'Field Goals', 'Field Goals Attempted',
        'Field Goal %', '3pt', '3pt Attempted', '3pt %', '2pt', '2pt Attempted',
        '2pt %', 'Free Throws', 'Free Throws Attempted', 'Free Throws %',
        'Offensive Rebounds', 'Defensive Rebounds', 'Total Rebounds', 'Assists',
        'Steals', 'Blocks', 'Turnovers', 'Personal Fouls', 'Points']

      // Build X scales and axis:
      var x = d3.scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      // Build X scales and axis:
      var y = d3.scaleBand()
        .range([height, 0])
        .domain(myVars)
        .padding(0.01);
      svg.append("g")
        .call(d3.axisLeft(y));

      // Build color scale
      var myColor = d3.scaleLinear()
        .range(["white", "green"])
        .domain([1, 50])

      //Read the data
      function drawData(data) {

        svg.selectAll("rect")
          .data(data, function (d) { return d['Team Name'] + ':' + d.variable; })
          .enter()
          .append("rect")
          .attr("x", function (d) { return x(d['Team Name']) })
          .attr("y", function (d) { return y(d.variable) })
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .attr("class", "square")
          .style("fill", function (d) { return myColor(d.value) })
          .append("title")
          .text(function (d) { return d.value })

      }
    drawData(graphData);
});    

