/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

function readfiles(files) {
    if (!is_dataflash(files[0].name))
        return;
    uploadpage = document.getElementById('uploadpage');
    uploadpage.style.display="none";
    analyzepage = document.getElementById('analyzepage');
    analyzepage.style.display="initial";
    reader = new FileReader();
    reader.onload = function(event) {
	console.log("file open");
	buffer = event.target.result;
	dv = new DataView(buffer);
	lf = new logfile(buffer);
	document.logfile = lf;
	build_navbar (lf.get_msgitem_list());
	var ds = lf.get_data_series("BARO", 0, "Alt");
    ds.name = ds.name + ":y";
	plot = document.getElementById('plot');
    const layout = {
        yaxis1: {
            side: 'left'
        },
        yaxis2: {
            side: 'left',
            overlaying: 'y',
            position: 0.15

        },
        yaxis3: {
            side: 'right',
            overlaying: 'y',
            position: 0.85
        },
        yaxis4: {
            side: 'right',
            overlaying: 'y'
        }
    };
	Plotly.newPlot(plot, [ds], layout);
    add_trace_to_plotctrl(ds);
    const gpsds = lf.get_gps_series();
    draw_flight_map(gpsds);
    get_overview(gpsds, lf.get_boot_time());
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

function handle_onfilechange(event) {
    console.log("File here!" + event.currentTarget.files[0].name);
    readfiles(event.currentTarget.files);
}

/** Check the filename ending if this a dataflash file. The
 *  mimetype does not help here because there is no unique mimetype
 *  for the dataflash file. So we just check the file extension.
 */
function is_dataflash(fname) {
    const fileextension = fname.split(".").pop();
    return (fileextension.toLowerCase() == "bin");
}

function on_trace_remove(event) {
    plot = document.getElementById('plot');
    Plotly.deleteTraces('plot',0);

}

function upload_click(event) {
    uploadpage = document.getElementById('uploadpage');
    uploadpage.style.display="initial";
    analyzepage = document.getElementById('analyzepage');
    analyzepage.style.display="none";
}

function on_ulSend() {
    let logfile = document.getElementById("fileToUpload").files[0];
    let locationname = document.getElementById("ulLocation").value;
    console.log("Hallo Click");
    const chunksize = 1000000;
    let chunknr = 0;
    for(let filepos = 0;filepos < logfile.size;filepos += chunksize) {
        const chunk = logfile.slice(filepos, filepos + chunksize);
        const formData = new FormData();
        formData.append("fileToUpload", chunk, logfile.name + chunknr++);
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = state => {console.log("Status", xhr.status); };
        xhr.timeout = 5000;
        xhr.open("POST", 'upload.php');
        xhr.send(formData);
    }
}

function on_ulSend_onefile() {
    let logfile = document.getElementById("fileToUpload").files[0];
    let locationname = document.getElementById("ulLocation").value;
    console.log("Hallo Click");
    let formData = new FormData();
    formData.append("fileToUpload", logfile);
    formData.append("location", locationname);

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = state => {console.log("Status", xhr.status); };
    xhr.timeout = 5000;
    xhr.open("POST", 'upload.php');
    xhr.send(formData);
}