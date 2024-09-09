// geography.js

function renderMap(geoJsonFilePath) {
    // Ensure D3.js is loaded correctly
    if (typeof d3 === 'undefined') {
        throw new Error('D3.js is not loaded. Please ensure you have included the D3.js library.');
    }

    // *******************
    // prepare map panel:
    // *******************
    //Width and height
    var mapWidth = 500;
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

    // Create SVG element for Map panel:
    var svgMap = d3.select("body")
        .append("svg")
        .attr("id", "mapSVG")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .style("background-color", "#f0f0f0") // Set background color
        .append("g");

    // Optional background image
    var background_image = ""; // Set to your background image URL if needed
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
        .text("Geography SVG");

    // Load and render GeoJSON data
    d3.json(geoJsonFilePath, function(error, geoData) {
        if (error) {
            console.error("Error loading GeoJSON data:", error);
            return;
        }

        console.log("GeoJSON data loaded:", geoData);

        var tooltip = d3.select("#tooltip");

        var circles = svgMap.selectAll("circle")
            .data(geoData.features);

        circles.enter()
            .append("circle")
            .attr("cx", function(d) {
                return projection(d.geometry.coordinates)[0];
            })
            .attr("cy", function(d) {
                return projection(d.geometry.coordinates)[1];
            })
            .attr("r", 3.5) // Adjust radius as needed
            .style("fill", function(d) {
                return d.properties.colour; // Set fill color based on the colour property
            })
            .style("opacity", 1)
            .on("mouseover", function(event, d) {
                d3.select(this).classed("highlight", true);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("<strong>Participant:</strong> " + d.properties.Participant + "<br/><strong>Activity:</strong> " + d.properties.Activity);
            })
            .on("mouseout", function(d) {
                d3.select(this).classed("highlight", false);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        console.log("Circles rendered:", circles.size());
    });
}