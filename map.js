/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

/** Compute the distance between two coordinates given in
 *  latitude and longitude.
 */
function coord2dist(a, b) {
    const earthradius = 6378388.0; /* Earth Radius in m */
    const difflat = a.lat - b.lat;
    const difflon = a.lon - b.lon;
    const distlon = difflat * Math.PI * earthradius / 180.0;
    const radius_at_lat = Math.cos(a.lat * Math.PI / 180.0 ) * earthradius;
    const distlat = difflon * Math.PI * radius_at_lat / 180.0;
    return Math.sqrt(distlat*distlat + distlon*distlon);
}

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

function myHours (duration) {
    const hours = Math.floor(duration / 3600000);
    return hours;
}
function myMinutes (duration) {
    const minutes = Math.floor((duration % 3600000) / 60000);
    return minutes;
}
function mySeconds (duration) {
    const seconds = (duration % 60000) / 1000;
    return seconds;
}
function myMilliseconds (duration) {
    const ms = Math.floor(duration % 1000);
    return ms;
}
/** Compute overview information from GPS data series like
 *  - Distance travelled
 *  - Time in Air
 *  - Max/Min Speed
 *  @param: gps data series with lat/lon, velocity and time
 */
function get_overview(gpsds, boot_time) {
    let e = document.getElementById('logstart');
    const bootdate = new Date(boot_time);
    e.textContent = bootdate.toString();
    const time_of_last_gps_msg = gpsds.time[gpsds.time.length-1].getTime();
    const duration_ms = time_of_last_gps_msg - boot_time;
    e = document.getElementById('logduration');
    e.textContent = myHours(duration_ms) + " hours " +
        myMinutes(duration_ms) + " minutes " +
        mySeconds(duration_ms) + " seconds";
    let flytime = 0;
    let flystarttime = 0;
    let distance = 0.0;
    let lastpos = { lon : 0.0, lat : 0.0, vel : 0.0, time : 0 };
    let flying = false;
    for(i = 0;i < gpsds.lat.length;i++) {
        const pos = { lon : gpsds.lon[i],
                      lat : gpsds.lat[i],
                      vel : gpsds.vel[i],
                      time : gpsds.time[i].getTime()};
        const status = gpsds.status[i];
        if (!flying && status >= 3 && pos.vel > 1.5) {
            flying = true;
            lastpos = pos;
            flystarttime = pos.time;
        } else if (flying && pos.vel < 1.0) {
            flying = false;
            flytime += pos.time - flystarttime;
        }
        if (flying) {
            distance += coord2dist(pos, lastpos);
            lastpos = pos;
        }
    }
    e = document.getElementById('distance');
    e.textContent = Math.floor(distance) / 1000.0 + " km";
    e = document.getElementById('flighttime');
    e.textContent = myHours(flytime) + " hours " +
        myMinutes(flytime) + " minutes " +
        mySeconds(flytime) + " seconds";
    e = document.getElementById('avgspeed');
    const avgspeed = distance / flytime * 3600.0;
    e.textContent = avgspeed.toFixed(1) + " km/h";
    e = document.getElementById('maxspeed');
    e.textContent = (gpsds.velmax * 3.6).toFixed(1) + " km/h";
    console.log(flytime);
    console.log(distance);
}

