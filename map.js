/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

var data = [
{
    type: "scattermapbox",
    text: ["Hallo"],
    lon: [7.883502],
    lat: [54.187918],
    marker: { color: "fuchsia", size: 4 }
    }
];

var layout = {
    dragmode: "zoom",
    mapbox: { style: "open-street-map", center: { lat: 38, lon: -90 }, zoom: 15 },
    margin: { r: 0, t: 0, b: 0, l: 0 }
};


/** Draw flight map */
function draw_flight_map(ds) {
    layout.mapbox.center.lon = ds.cenlon;
    layout.mapbox.center.lat = ds.cenlat;
    ds.type = "scattermapbox";
    ds.mode = 'lines';
    ds.line = { width: 1, color: 'blue'};
    Plotly.newPlot("map", [ds], layout);
}

