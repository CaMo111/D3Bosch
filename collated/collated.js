// function to generate the distance-time panel
var linePoints = [];


function collate(geoJsonFilePath) {

    if (typeof d3 === 'undefined') {
        throw new Error('D3.js is not loaded. Please ensure you have included the D3.js library.');
    }

    d3.selectAll("svg").remove(); // Clear all existing SVG elements    

    //Width and height
    var mapWidth = 700;
    var mapHeight = 1550;

    // Define map projection
    var mapCenterLon = 10.540751246, mapCenterLat = 52.301353262; // Center based on provided coordinates
    mapCenterLat -= 0.03; // Adjust center latitude as needed
    var mapScale = 250000; // Ensure this variable is defined

    var projection = d3.geo.mercator()
        .rotate([0, 0]) //lon,lat]
        .center([mapCenterLon, mapCenterLat]) //[lon,lat]
        .translate([mapWidth / 2, mapHeight / 4])
        .precision(0.1)
        .scale(mapScale);

    // Define path generator
    var path = d3.geo.path()
        .projection(projection);

    // Select the existing SVG element or create a new one if it doesn't exist
    var svgMap = d3.select("#mapSVG");

    if (svgMap.empty()) {
        svgMap = d3.select("body")
            .append("svg")
            .attr("id", "mapSVG")
            .attr("width", mapWidth)
            .attr("height", mapHeight)
            .style("background-color", document.body.classList.contains('dark-mode') ? "#000000" : "#00000") // Set background color based on mode
            .append("g");
    } else {
        // Clear the existing SVG contents
        svgMap.selectAll("*").remove();
        svgMap.style("background-color", document.body.classList.contains('dark-mode') ? "##000000" : "#00000"); // Update background color based on mode
    }

    // Optional background image
    var background_image = ''; // Set to your background image URL if needed
    if (background_image != "") {
        svgMap.append("image")
            .attr("xlink:href", background_image)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", mapWidth)
            .attr("height", mapHeight);
    }

    svgMap.append("text")
        .attr("x", 5)
        .attr("y", 20)
        .attr("class", "panelTitle")
        .text("");

    // Load and render GeoJSON data
    d3.json(geoJsonFilePath, function(error, geoData) {
        if (error) {
            console.error("Error loading GeoJSON data:", error);
            return;
        }


        var tooltip = d3.select("#tooltip");

        var circles = svgMap.selectAll("circle")
            .data(geoData.features);

            circles.enter().append("circle")
            .attr("cx", function(d) { return projection(d.geometry.coordinates)[0] - 100; })
            .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; })
            .attr("r", 3)
            .style("fill", function(d) { return d.properties.colour; })
            .on("mouseover", function(d) {
                var temp = [];
        
                d3.select(this).attr("r", 10); // Enlarge the circle
                var cx = projection(d.geometry.coordinates)[0] - 100;
                var cy = projection(d.geometry.coordinates)[1];
                var proximityThreshold = 5; // 10-pixel radius
        
                // Highlight circles within proximity
                circles.each(function(otherD) {
                    var otherCx = projection(otherD.geometry.coordinates)[0] - 100;
                    var otherCy = projection(otherD.geometry.coordinates)[1];
                    if (Math.abs(cx - otherCx) <= proximityThreshold && Math.abs(cy - otherCy) <= proximityThreshold) {
                        d3.select(this).attr("r", 10); // Enlarge the circle
                        temp.push(otherD);
                    }
                });

                // Format the timestamp to show only hour and minutes
        function formatTimestamp(timestamp) {
            var date = new Date(timestamp);
            return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2);
        }

                // Collect information for the tooltip
                var tooltipContent = "Focal Highlight " + d.properties.Participant+" Timestamp: " + formatTimestamp(d.properties.Timestamp);
                if (temp.length > 0) {
                    tooltipContent += "<br>Nearby Circles:<br>";
                    temp.forEach(function(nearbyD) {
                        tooltipContent += "Participant " + nearbyD.properties.Participant+ " Timestamp: " + formatTimestamp(nearbyD.properties.Timestamp) + ",";
                    });
                }
        
                linePoints.forEach(function(point) {
                    if (point.data.Timestamp === d.properties.Timestamp) {
                        d3.select(point.element).classed("highlighted-point", true);
                        tooltip.html(tooltipContent)
                            .style("visibility", "visible")
                            .style("top", (d3.event.pageY - 10) + "px")
                            .style("left", (d3.event.pageX + 10) + "px");
                    }
                });
            })
            .on("mousemove", function() {
                // Move the tooltip with the mouse
                tooltip.style("top", (d3.event.pageY - 10) + "px")
                    .style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this).attr("r", 3); // Reset the circle size
        
                // Reset circles within proximity
                circles.each(function(otherD) {
                    d3.select(this).attr("r", 3); // Reset the circle size
                });
        
                // Remove the highlight from the corresponding points in each SVG's line
                linePoints.forEach(function(point) {
                    if (point.data.Timestamp === d.properties.Timestamp) {
                        d3.select(point.element).classed("highlighted-point", false);
                    }
                });
        
                // Hide the tooltip
                tooltip.style("visibility", "hidden");
            });
        
        circles.exit().remove();
    });

    d3.json(geoJsonFilePath, function(error, geoData) {
        if (error) throw error;
        // Group data by participant
      // Group data by participant
      var participantsData = d3.nest()
      .key(function(d) {
        var date = parseMyDate(d.properties.Timestamp).toISOString().split('T')[0]; // Extract the date part
        return d.properties.Participant; // Combine participant ID and date
      })
      .entries(geoData.features);
  
       
            // Collect all stress_xs values and distances
            var allStressValues = [];
            var totalDistance = 0;
            var validPanelCount = 0;

            participantsData.forEach(function(participant) {
              participant.values.forEach(function(d) {
                if (d.properties.stress_xs !== null) {
                  allStressValues.push(d.properties.stress_xs);
                }
                totalDistance += d.geometry.distance;
              });
            });
  
            // Calculate mean and median stress_xs values
            var meanStress = d3.mean(allStressValues);
            var medianStress = d3.median(allStressValues);
            var maxStress = d3.max(allStressValues);
            var minStress = d3.min(allStressValues);
  
  
            // Identify outliers (values more than 1.5 IQR above the third quartile or below the first quartile)
            var q1 = d3.quantile(allStressValues.sort(d3.ascending), 0.25);
            var q3 = d3.quantile(allStressValues.sort(d3.ascending), 0.75);
            var iqr = q3 - q1;
            var lowerBound = q1 - 1.5 * iqr;
            var upperBound = q3 + 1.5 * iqr;
            var outliers = allStressValues.filter(function(d) {
              return d < lowerBound || d > upperBound;
            });
  
            // Create an SVG element at the top of the screen
            var statsPanel = d3.select("body")
              .append("svg")
              .attr("id", "StatsPanel")
              .attr("x", 100)
              .attr("width", 650)
              .attr("height", 60)
              .style("position", "absolute")
              .style("right", "500px") // Adjust this value as needed
              .style("top", "0px")
              .append("g");
  
            // Display mean and median stress_xs values
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 10)
              .attr("y", 20)
              .text("Mean Stress: " + meanStress.toFixed(2));
  
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 160)
              .attr("y", 20)
              .text("Median Stress: " + medianStress.toFixed(2));
  
            // Display total distance traveled
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 410)
              .attr("y", 20)
              .text("Total Distance: " + (totalDistance/1000).toFixed(1) + " KM");
  
            
            // Display number of outliers
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 320)
              .attr("y", 20)
              .text("Outliers: " + outliers.length);
  
               // Display max and min stress_xs values
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 10)
              .attr("y", 40)
              .text("Max Stress: " + maxStress.toFixed(2));
  
            statsPanel.append("text")
              .attr("class", "statsText")
              .attr("x", 160)
              .attr("y", 40)
              .text("Min Stress: " + minStress.toFixed(2));
  
    // Define a color scale for stress_xs
    var colorScale = d3.scale.linear()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) // Adjust the domain to match the number of colors
    .range([
        "#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8",
        "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"
    ]); // Use the reversed colors

              var validPanelCount = 0;
              participantsData.forEach(function(participant, index) {
                var participantID = participant.key;
                var participantFeatures = participant.values;
            
                // Find the earliest and latest times
                var earliestTime = d3.min(participantFeatures, function(d) {
                    var timeStr = d.properties.Timestamp; // Extract the time part
                    return parseMyDate(timeStr);
                });
            
                var latestTime = d3.max(participantFeatures, function(d) {
                    var timeStr = d.properties.Timestamp; // Extract the time part
                    return parseMyDate(timeStr);
                });
            
                var smallestDist = d3.min(participantFeatures, function(d) {
                    return d.geometry.distance; // Extract the distance part
                });
            
                var largestDist = d3.sum(participantFeatures, function(d) {
                    return d.geometry.distance;
                });
            
                if (largestDist < 800) {

                    return; // Skip this participant
                }
            
                var data = participantFeatures;
            
                // Create time scale
                var timeScale = d3.time.scale()
                    .domain([earliestTime, latestTime])
                    .range([0, 600]);
            
                // Create distance scale
                var distScale = d3.scale.linear()
                    .domain([smallestDist, largestDist])
                    .range([0, 600]);
            
                // Calculate the top position for the current panel
                var panelHeight = 185; // Height of each panel
                var topPosition = 40 + validPanelCount * panelHeight; // Calculate top position based on index
                validPanelCount++;
            
                // Create SVG element for Time to Geography panel:
                var DistTimePanel = d3.select("body")
                    .append("svg")
                    .attr("id", "DistTimePanel" + index) // Unique ID for each panel
                    .attr("width", 650)
                    .attr("height", panelHeight)
                    .style("position", "absolute")
                    .style("right", "500px") // Adjust this value as needed
                    .style("top", topPosition + "px") // Position each panel below the previous one
                    .append("g");
            
                DistTimePanel.append("text")
                    .attr("x", 5)
                    .attr("y", 50)
                    .attr("class", "panelTitle")
                    .style("fill", participant.values[0].properties.colour) // Set text color to match circle color
                    .text("Time-Distance Panel for Participant " + participantID);
            
                // Prepare scales and axes
                var xMargin = 20;
                var yD = 100;
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
                    .ticks(10)
                    .tickFormat(function(d) { return d / 1000 + " km"; });
            
                DistTimePanel.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + xMargin + "," + (yD + 50) + ")")
                    .call(cumulativeDistAxis);
            
                // Calculate cumulative distances and pair with the most recent non-null stress_xs value
                var mostRecentStress = 0;
                var pairedData = participantFeatures.map(function(d, i) {
                    if (i > 0) {
                        cumulativeDistances.push(cumulativeDistances[i - 1] + participantFeatures[i - 1].geometry.distance);
                    }
                    if (d.properties.stress_xs !== null) {
                        mostRecentStress = d.properties.stress_xs;
                    }
                    return {
                        distance: cumulativeDistances[i],
                        stress: mostRecentStress,
                        mode: d.properties.ModeButton_xs, // Add mode to the paired data
                        Timestamp: d.properties.Timestamp // Add timestamp to the paired data
                    };
                });
  
              var area = d3.svg.area()
      .x(function(d) { return distScale(d.distance) + xMargin; })
      .y0(yD + 40)
      .y1(yD + 50);
  
  // Draw the filled areas with color based on the most recent non-null stress_xs
  pairedData.forEach(function(d, i) {
      if (i < pairedData.length - 1) {
          DistTimePanel.append("path")
              .datum([d, pairedData[i + 1]])
              .attr("class", "area")
              .attr("d", area)
              .attr("fill", function() {
                  return colorScale(d.stress); // Use the most recent non-null stress_xs value
              })
              .attr("fill-opacity", 0.25);
      }
  });
  
              
              // Draw small lines for each point relative to the cumulative distance
              DistTimePanel.selectAll("line.point")
                  .data(pairedData)
                  .enter()
                  .append("line")
                  .attr("class", "point")
                  .attr("x1", function(d) { return cumulativeDistScale(d.distance) + xMargin; })
                  .attr("y1", yD + 40)
                  .attr("x2", function(d) { return cumulativeDistScale(d.distance) + xMargin; })
                  .attr("y2", yD + 50)
                  .attr("stroke", function(d) {
          return colorScale(d.stress); // Use the most recent non-null stress_xs value
      })
      .attr("stroke-width", 2)
      .each(function(d) {
        // Store each line point along with its associated data
        linePoints.push({ element: this, data: d });
    }).on("mouseover", function(d) {
        // Highlight the corresponding circle
        d3.select(this).attr("stroke-width", 20);
        d3.select(this).attr("stroke", "red");

        DistTimePanel.selectAll(".icon").style("visibility", "hidden");

           // Append a new icon above the hovered line point
           var iconX = cumulativeDistScale(d.distance)+15;
           var iconY = this.attributes.y1.value - 20;
           var mode = d.mode.trim().replace(/['"]/g, '');  // Trim t
           var newIcon = DistTimePanel.append("image")
                .attr("class", "icon new-icon") // Assign a unique class
                .attr("x", iconX)
                .attr("y", iconY)
                .attr("width", 20)
                .attr("height", 20);

                    // Set the icon source based on the mode
                    if (mode === "ButtonWaitOrChange") {
                        newIcon.attr("xlink:href", "../data/waiting.png");
                    } else if (mode === "ButtonBus") {
                        newIcon.attr("xlink:href", "../data/bus.png");
                    } else if (mode === "ButtonWalking") {
                        newIcon.attr("xlink:href", "../data/walk.png");
                    } else if (mode === "ButtonTram") {
                        newIcon.attr("xlink:href", "../data/tram.png");
                    } else if (mode === "ButtonTrain") {
                        newIcon.attr("xlink:href", "../data/train.png");
                    } else if (mode === "ButtonCar") {
                        newIcon.attr("xlink:href", "../data/car.jpg");
                    } else if (mode === "Cycling" || mode === "ButtonCycling") {
                        newIcon.attr("xlink:href", "../data/bike.png");
                    } else {
                        console.log("");
                    }


    })
    .on("mouseout", function(d) {
        // Reset the corresponding circle size
        // chan
        DistTimePanel.selectAll(".icon").style("visibility", "visible");
        d3.select(this).attr("stroke-width", 2);
        d3.select(this).attr("stroke", function(d) {
            return colorScale(d.stress); // Use the most recent non-null stress_xs value
        });
        // Remove the new icon
    DistTimePanel.selectAll(".new-icon").remove();

    });
  
  
                  // TRESTING ICON IMPLEMENTATION
              var previousMode = null;
  
              // Define a minimum horizontal distance threshold (in pixels)
  var minHorizontalDistance = 30; // Adjust this value as needed
  var maxHorizontalAdjustment = 15; // Maximum adjustment to maintain accuracy
  
  // Track the position of the last icon
  var lastIconX = null;
  var originalIcons = [];

  // Append icons based on ModeButton_xs if it changes
  pairedData.forEach(function(d, i) {
      var mode = d.mode.trim().replace(/['"]/g, '');  // Trim the mode value and remove parentheses
      if (mode !== previousMode) {
          var iconX = distScale(d.distance) + xMargin - 10; // Calculate the initial X position of the current icon
          var iconY = yD + 20; // Fixed Y position
  
          // Check if the current icon overlaps with the last icon
          if (lastIconX !== null && Math.abs(iconX - lastIconX) < minHorizontalDistance) {
              // If they overlap, adjust the X position to spread them out horizontally within a limited range
              var adjustment = Math.min(minHorizontalDistance - Math.abs(iconX - lastIconX), maxHorizontalAdjustment);
              iconX = lastIconX + adjustment;
          }
  
          // Ensure the icon does not go beyond the axis limits
          iconX = Math.max(xMargin, Math.min(iconX, 600 + xMargin - 20)); // Adjust the limits as needed
  
          // Append the icon
          var icon = DistTimePanel.append("image")
              .attr("class", "icon")
              .attr("x", iconX)
              .attr("y", iconY)
              .attr("width", 20)
              .attr("height", 20);
  
          // Set the icon source based on the mode
          if (mode === "ButtonWaitOrChange") {
              icon.attr("xlink:href", "../data/waiting.png");
          } else if (mode === "ButtonBus") {
              icon.attr("xlink:href", "../data/bus.png");
          } else if (mode === "ButtonWalking") {
              icon.attr("xlink:href", "../data/walk.png");
          } else if (mode === "ButtonTram") {
              icon.attr("xlink:href", "../data/tram.png");
          } else if (mode === "ButtonTrain") {
              icon.attr("xlink:href", "../data/train.png");
          } else if (mode === "ButtonCar") {
              icon.attr("xlink:href", "../data/car.jpg");
          } else if (mode === "Cycling" || mode === "ButtonCycling") {
              icon.attr("xlink:href", "../data/bike.png");
          } else {
              console.log("");
          }
  
          // Store the original icon
          originalIcons.push({ mode: mode, icon: icon });
  
          // Update the position of the last icon
          lastIconX = iconX;
          previousMode = mode; // Update the previous mode
      }
  });
  
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
              }, this);
          
          // Count the number of SVG elements on the screen
          var svgCount = d3.selectAll("svg").size();
  

  
          });
}

// Parses string to Date object
function parseMyDate(DateStr) {
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    return dateFormat.parse(DateStr);
}
            
