// Ensure D3.js is loaded correctly
if (typeof d3 === 'undefined') {
    throw new Error('D3.js is not loaded. Please ensure you have included the D3.js library.');
}

var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");

function parseMyDate(DateStr) {
    return dateFormat.parse(DateStr);
}

function renderDistanceTimePanel(geoJsonFilePath) {
    d3.json(geoJsonFilePath, function(error, geoData) {
        if (error) throw error;

        // Group data by participant
        var participants = d3.nest()
            .key(function(d) { return d.properties.Participant; })
            .entries(geoData.features);

        participants.forEach(function(participantData) {
            var data = participantData.values;
            console.log("Participant:", participantData.key);

            // Find the earliest and latest times
            var earliestTime = d3.min(data, function(d) {
                var timeStr = d.properties.Timestamp; // Extract the time part
                return parseMyDate(timeStr);
            });

            var latestTime = d3.max(data, function(d) {
                var timeStr = d.properties.Timestamp; // Extract the time part
                return parseMyDate(timeStr);
            });

            var smallestDist = d3.min(data, function(d) {
                return d.geometry.distance; // Extract the distance part
            });

            var largestDist = d3.sum(data, function(d) {
                return d.geometry.distance;
            });

            // Create time scale
            var timeScale = d3.time.scale()
                .domain([earliestTime, latestTime])
                .range([0, 600]);

            // Create distance scale
            var distScale = d3.scale.linear()
                .domain([smallestDist, largestDist])
                .range([0, 600]);

            // Create SVG element for Time to Geography panel:
            var DistTimePanel = d3.select("body")
                .append("svg")
                .attr("id", "DistTimePanel_" + participantData.key)
                .attr("width", 650)
                .attr("height", 250)
                .append("g")
                .attr("transform", "translate(50, 20)"); // Add margin for axes

            // Assuming geoData is already defined and contains the features
            var participantColor = data[0].properties.colour;

            DistTimePanel.append("text")
                .attr("x", 5)
                .attr("y", 20)
                .attr("class", "panelTitle")
                .style("fill", participantColor) // Set the text color
                .text("Time-Distance Participant " + participantData.key);

            // Prepare scales and axes
            var xMargin = 20;
            var yD = 140;
            var cumulativeDistances = [0]; // Initialize with 0 for the starting point

            // Calculate cumulative distances
            for (var i = 1; i < data.length; i++) {
                var distance = data[i].geometry.distance;
                cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
            }

            // Create a linear scale for the cumulative distance
            var cumulativeDistScale = d3.scale.linear()
                .domain([0, d3.max(cumulativeDistances)])
                .range([0, 600]);

            // Create and draw the axis
            var cumulativeDistAxis = d3.svg.axis()
                .scale(cumulativeDistScale)
                .orient("bottom")
                .ticks(10);

            DistTimePanel.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + xMargin + "," + (yD + 50) + ")")
                .call(cumulativeDistAxis);

            // Draw small lines for each point relative to the cumulative distance
            DistTimePanel.selectAll("line.point")
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

            // Create and draw the time of day axis without ticks
            var timeOfDayAxis = d3.svg.axis()
                .scale(timeOfDayScale)
                .orient("top")
                .tickValues([]) // No tick values
                .tickSize(0);

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
                    .attr("height", (endY - startY))
                    .attr("class", "highlightRect");
                }
            }
        });
    });
}