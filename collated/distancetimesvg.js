// distancetimesvg.js

function renderDistanceTimePanel(geoJsonFilePath) {
    d3.json(geoJsonFilePath, function(error, geoData) {
        if (error) throw error;

        // Clear previous panel
        d3.select("#distancetime-panel").selectAll("*").remove();

        // Group data by participant
        var participants = d3.nest()
            .key(function(d) { return d.properties.Participant; })
            .entries(geoData.features);

        // Create a panel for each participant
        participants.forEach(function(participantData) {
            var data = participantData.values;
            var participantId = participantData.key;

            // Find the earliest and latest times
            var earliestTime = d3.min(data, function(d) {
                var timeStr = d.properties.Timestamp; // Extract the time part
                return parseMyDate(timeStr);
            });

            var latestTime = d3.max(data, function(d) {
                var timeStr = d.properties.Timestamp; // Extract the time part
                return parseMyDate(timeStr);
            });

            var cumulativeDistances = data.map(function(d, i) {
                return d.geometry.distance;
            });

            // Create time scale
            var timeScale = d3.time.scale()
                .domain([earliestTime, latestTime])
                .range([0, 600]);

            // Create distance scale
            var cumulativeDistScale = d3.scale.linear()
            .domain([0, d3.max(cumulativeDistances)])
            .range([0, 600]);

            // Create a new SVG element for each participant
            var DistTimePanel = d3.select("#distancetime-panel")
            .append("svg")
            .attr("id", "DistTimePanel_" + participantId)
            .attr("width", 650)
            .attr("height", 250)
            .append("g")
            .attr("transform", "translate(50, 20)"); // Add margin for axes

            var xMargin = 50;
            var yD = 100;

            // Append lines for cumulative distances
            DistTimePanel.selectAll(".point")
            .data(cumulativeDistances)
            .enter()
            .append("line")
            .attr("class", "point")
            .attr("x1", function(d) { return cumulativeDistScale(d) + xMargin; })
            .attr("y1", yD + 40)
            .attr("x2", function(d) { return cumulativeDistScale(d) + xMargin; })
            .attr("y2", yD + 50)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

            // Create a time scale for hours and minutes
            var timeOfDayScale = d3.time.scale()
            .domain([earliestTime, latestTime])
            .range([0, 600]);

            // Create and draw the time of day axis
            var timeOfDayAxis = d3.svg.axis()
            .scale(timeOfDayScale)
            .orient("top")
            .tickFormat(d3.time.format("%H:%M"))
            .tickSize(0);

            DistTimePanel.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + xMargin + "," + (yD - 20) + ")")
            .call(timeOfDayAxis);

            DistTimePanel.append("text")
            .attr("x", 5)
            .attr("y", 20)
            .attr("class", "panelTitle")
            .style("fill", participantData.color) // Set the text color
            .text("Time-Distance Participant " + participantData.key);

            // Draw rectangles for segments with little distance traveled but lots of time passed
            for (var i = 0; i < data.length - 1; i++) {
            var startX = timeScale(parseMyDate(data[i].properties.Timestamp)) + xMargin;
            var endX = timeScale(parseMyDate(data[i + 1].properties.Timestamp)) + xMargin;
            var startY = yD + 50;
            var endY = yD + 50 + (cumulativeDistScale(cumulativeDistances[i + 1]) - cumulativeDistScale(cumulativeDistances[i]));
            var timeDiff = parseMyDate(data[i + 1].properties.Timestamp) - parseMyDate(data[i].properties.Timestamp);
            var distanceDiff = cumulativeDistances[i + 1] - cumulativeDistances[i];

            // Identify segments where little distance was traveled but lots of time passed
            if (timeDiff > 0 && distanceDiff < 400) { // Adjust the threshold as needed
                DistTimePanel.append("rect")
                    .attr("x", startX)
                    .attr("y", yD - 20)
                    .attr("width", endX - startX)
                    .attr("height", (endY - startY)) // Ensure height is positive
                    .attr("class", "highlightRect");
            }
            }
        });
    });
}

// Parses string to Date object
function parseMyDate(DateStr) {
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    return dateFormat.parse(DateStr);
}
            
            
