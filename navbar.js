/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

/* The navigation bar shows the available data items in the logfile

   The logfile contains a list of data items, i.e. the list will 
   be constructed dynamically. Each log item contains several
   subitems. For example the "RCIN" log item contains the subitems
   TimeUS,C1,C2,...,C14. That means the sampletime and then 15
   channel values from the remote control input.
   All subitems will be displayed in a tree view style. */

/** This function builds the navigation bar html element structure such
   that the items and subitems are displayed like this

   RCIN         This main item name of class "caret"
       C1  |
       C2  | -- These subitems are shown when you click on "RCIN"
       C3  |    That are <li> elements of class "nested"

   @param itemlist : An array of msgtypes where each item contains
                       - name (string)
                       - subitemlist : array of strings with subitemnames
*/
function build_navbar (itemlist) {
    const vl = document.getElementById('msglist');
    for (var i = 0; i < itemlist.length;i++) {
		const msgt = itemlist[i];
		if (msgt == null)
		    continue;
		if (msgt.with_instances) {
			for(let i = 0; i < msgt.data.length;i++) {
				const entry = create_entry(msgt, i);
				vl.appendChild(entry);
			}
		} else {
			const entry = create_entry(msgt, -1);
			vl.appendChild(entry);
		}
    }
}

/** Create a navbar entry based on
 *  @param: msgtype : The msgtype like "GPS"
 *  @param: instance : The instance number or -1 if this msgtype has no instances
 *
*/
function create_entry (msgt, instance) {
	const entry = document.createElement('li');
	entry.id = msgt.name + "_" + (msgt.with_instances ? instance : "");
	const span  = document.createElement('span');
	span.className = "caret";
	span.textContent = msgt.name +
	    (msgt.with_instances ? instance : "") + "    (" +
		(msgt.with_instances ? msgt.data[instance].length : msgt.data.length) + ")";
	span.addEventListener("click", function () {
		var el = this.parentElement.querySelector(".nested");
		el.classList.toggle("active");
	});
	const a = document.createElement('a');
	a.href = "https://ardupilot.org/plane/docs/logmessages.html#" + msgt.name.toLowerCase();
	a.textContent = "i";
	a.style = "padding-left:10px"
	entry.appendChild(span);
	entry.appendChild(a);
	const ul = document.createElement('ul');
	ul.className = "nested";
	subitemlist = msgt.subitemlist;
	for (var si = 0; si < subitemlist.length; si++) {
		const li = document.createElement('li');
		li.textContent = subitemlist[si];
		li.addEventListener("click", on_click_subitem);
		ul.appendChild(li);
	}
	entry.appendChild(ul);
	return entry;
}

/** Eventhandler when a subitem is clicked.
 *  Get the data series for the clicked subitem and
 *  submit a plot
 */
function on_click_subitem () {
	const name_instance = this.parentElement.parentElement.id;
	const split_array = name_instance.split("_")
	const name = split_array[0];
	const instance = split_array[1];
	const subitemname = this.textContent;
	const lf = document.logfile;
	const ds = lf.get_data_series(name, instance, subitemname);
	ds.name = ds.name + ":y";
	const plot = document.getElementById('plot');
	Plotly.addTraces(plot, ds);
	add_trace_to_plotctrl(ds);
}

/** Add a trace to an axis plot control element */
function add_trace_to_plotctrl (ds) {
	const vl = document.getElementById('y');
	const p  = document.createElement('p');
    p.draggable=true;
	p.addEventListener('dragstart', axis_dragstart);
	p.id = ds.name.split(":")[0];
	p.textContent=p.id;
	vl.appendChild(p);
}

function axis_drop(event) {
	event.preventDefault();
	const p = document.getElementById(event.dataTransfer.getData('text'));
	if (p == null)
		return;
	const div = event.currentTarget.firstElementChild;
	div.appendChild(p);
	const tracename = p.textContent;
	const plot = document.getElementById('plot');
	const tracenr = trace_idx_by_name(plot, tracename);
	if (tracenr < 0)
		return;	
	Plotly.restyle(plot, {yaxis: div.id, name: tracename + ":" + div.id}, tracenr);
}

function trace_idx_by_name (plot, name) {
    const data = plot.data;
    for(i=0;i < data.length;i++) {
        if (data[i].name.split(":")[0] == name)
            return i
    }
    return -1;
}

function delete_trace(event) {
	event.preventDefault();
	const p = document.getElementById(event.dataTransfer.getData('text'));
	if (p == null)
		return;
	const tracename = p.textContent;
	p.remove();
	const plot = document.getElementById('plot');
	const tracenr = trace_idx_by_name(plot, tracename);
	if (tracenr < 0)
		return;
	Plotly.deleteTraces(plot, tracenr);
}

function axis_dragover(event) {
	event.dataTransfer.dropEffect = 'copy';
    event.preventDefault();
}

function axis_dragstart(event) {
	event.dataTransfer.setData("text",event.target.id);
	console.log(event.target.id);
}

