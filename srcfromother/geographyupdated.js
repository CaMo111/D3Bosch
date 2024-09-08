// geography.js
function renderMap(jsonFilePath) {
    // *******************
    // prepare map panel:
    // *******************
    //Width and height
    var mapWidth = 500;
    var mapHeight = 538;

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
    var svgMap = d3.select("#mapSVG");

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
    d3.json(jsonFilePath, function(error, geoData) {
      if (error) throw error;

      svgMap.selectAll("circle")
        .data(geoData.features)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
          return projection(d.geometry.coordinates)[0];
        })
        .attr("cy", function(d) {
          return projection(d.geometry.coordinates)[1];
        })
        .attr("r", 3.5); // Adjust radius as needed
    });
}