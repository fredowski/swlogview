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

/* This function builds the navigation bar html element structure such
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
    var vl = document.getElementById('msglist');
    for (var i = 0; i < itemlist.length;i++) {
	var item = itemlist[i];
	if (item == null)
	    continue;
	var entry = document.createElement('li');
	entry.id = item.name;
	var span  = document.createElement('span');
	span.className = "caret";
	span.textContent = item.name + "    ("+ item.data.length + ")";
	span.addEventListener("click", function () {
	    var el = this.parentElement.querySelector(".nested");
	    el.classList.toggle("active");
	});
	entry.appendChild(span);
	var ul = document.createElement('ul');
	ul.className = "nested";
	subitemlist = item.subitemlist;
	for (var si = 0; si < subitemlist.length; si++) {
            const li = document.createElement('li');
	    li.textContent = subitemlist[si];
	    li.addEventListener("click", function () {
		const itemname = this.parentElement.parentElement.id;
		const subitemname = this.textContent;
		const lf = document.logfile;
		const ds = lf.get_data_series(itemname, subitemname);
		const plot = document.getElementById('plot');
		Plotly.addTraces(plot, ds);
	    });
	    ul.appendChild(li);
	}
	entry.appendChild(ul);
	vl.appendChild(entry);
    }	
}

