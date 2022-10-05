/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

function readfiles(files) {
    reader = new FileReader();
    reader.onload = function(event) {
	console.log("file open");
	buffer = event.target.result;
	dv = new DataView(buffer);
	lf = new logfile(buffer);
	document.logfile = lf;
	build_navbar (lf.get_msgitem_list());
	var ds = lf.get_data_series("BARO", 0, "Alt");
	// Plot
	ds.type = 'scatter';
	ds.showlegend = true;
	plot = document.getElementById('plot');
	Plotly.newPlot(plot, [ds]);

	console.log(ds);
	console.log(lf.msgindex);
	console.log(dv.buffer.byteLength);
	console.log(dv.getUint8(0).toString(16));
    }
    reader.readAsArrayBuffer(files[0]);
}

function handle_ondrop(event) {
    event.preventDefault();
    console.log(event.dataTransfer.files);
    readfiles(event.dataTransfer.files);
    console.log("Hallo");
};

function handle_dragover(event) {
    /* Only when the default handler is prevented, the
       element is considered an allowed drop target */
    event.dataTransfer.dropEffect = 'copy';
    event.preventDefault();
};

function handle_dragenter(event) {
    event.preventDefault();
};
