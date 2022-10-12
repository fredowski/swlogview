/* SearchWing LogViewer
   Copyright 2022 Friedrich Beckmann

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version. */

function buf2str(buf, offset, length) {
    res = "";
    for (var idx = 0; idx < length; idx++)
	buf.getUint8(offset + idx) != 0 && (res += String.fromCharCode(buf.getUint8(offset + idx)));
    return res
}
/* See: https://github.com/ArduPilot/ardupilot/blob/master/libraries/AP_Logger/LogStructure.h */

const typelen = { 'b' : 1, // int8_t
		  'B' : 1, // uint8_t
		  'h' : 2, // int16_t
		  'H' : 2, // uint16_t
		  'i' : 4, // int32_t
		  'I' : 4, // uint32_t
		  'f' : 4, // float
		  'd' : 8, // double
		  'n' : 4, // char[4]
		  'N' : 16, // char[16]
		  'Z' : 64, // char[64]
		  'c' : 2,  // int16_t * 100
		  'C' : 2,  // uint16_t * 100
		  'e' : 4,  // int32_t * 100 
		  'E' : 4,  // uint32_t * 100
		  'L' : 4,  // int32_t latitude/longituted
		  'M' : 1,  // uint8_t flight mode
		  'q' : 8,  // int64_t
                  'Q' : 8};   // uint64_t

function my_getInt8(dv, offset) {
    return dv.getInt8(offset);
}

function my_getUint8(dv, offset) {
    return dv.getUint8(offset);
}

function my_getInt16(dv, offset) {
    return dv.getInt16(offset, true);
}

function my_getUint16(dv, offset) {
    return dv.getUint16(offset, true);
}

function my_getInt32(dv, offset) {
    return dv.getInt32(offset, true);
}

function my_getUint32(dv, offset) {
    return dv.getUint32(offset, true);
}

function my_getFloat32(dv, offset) {
    return dv.getFloat32(offset, true);
}

function my_getBigUint64(dv, offset) {
    return dv.getBigUint64(offset, true);
}

const readfunc = { 'b' : my_getInt8,
		   'B' : my_getUint8,
		   'h' : my_getInt16,
		   'H' : my_getUint16,
		   'i' : my_getInt32,
		   'I' : my_getUint32,
		   'f' : my_getFloat32,
		   'L' : my_getInt32,
		   'c' : my_getInt16,
		   'C' : my_getUint16,
		   'Q' : my_getBigUint64
		 };


/* Some msgtypes handle a number of "instances" of devices which
   produce the date. For example if you have several IMU sensors or
   GPS devices. This list names the messagetypes which support different
   instances and names the subitem which contains the instance number. */
const msgt_with_instances = {
	"BARO" : "I",
	"BAT"  : "Instance",
	"GPA"  : "I",
	"GPS"  : "I",
	"IMU"  : "I",
	"MAG"  : "I"
}

class msgformat {
    constructor(dv, offset) {
		this.type = dv.getUint8(offset++);
		this.length= dv.getUint8(offset++);
		this.name = buf2str(dv, offset, 4);
		offset+=4;
		this.fields = buf2str(dv, offset, 16);
		offset+=16;
		this.columns = buf2str(dv, offset, 64);
		this.subitemlist = this.columns.split(",");
		this.subitemidx_from_name = [];
		for (var i = 0;i < this.subitemlist.length;i++)
			this.subitemidx_from_name[this.subitemlist[i]] = i;
		this.subitemoffset = [0];
		for (var i = 0, offs = 0;i < this.subitemlist.length - 1;i++) {
			offs += typelen[this.fields[i]];
			this.subitemoffset[i+1] = offs;
		}
		const iname = msgt_with_instances[this.name];
		if (iname != null) {
			this.with_instances = true;
			const subitemidx = this.subitemidx_from_name[iname];
			this.instance_offset = this.subitemoffset[subitemidx];
			if (this.instance_offset == null)
				console.log("Error: Could not find instance name " + iname + " in msgtype " + this.name);
		} else
			this.with_instances = false;
		this.data = [];
    }
    dump () {
		console.log("Name: " + this.name);
		console.log("Fields: " + this.fields);
    }
}
class logfile {
    constructor(buffer) {
		this.buffer = buffer,
		this.msgtypes = [], // An array of message type items like GPS, indexed with the type number
		this.msgtype_name_hash = [],
		this.parse();
		this.boot_time_ms_since_epoch = this.find_timebase();
    }
    parse() {
	for (var dv = new DataView(buffer), idx = 0; idx < dv.byteLength-3;) {
	    if (dv.getUint8(idx) == 163 && dv.getUint8(idx+1) == 149) {
		const msgtypeval = dv.getUint8(idx+2);
		if (msgtypeval == 128) {
		    /* 128 is a FMT message which defines the format of
                     * other items. So we found a new item */
		    const msgt = new msgformat(dv, idx+3);
		    console.log(msgt);
		    this.msgtypes[msgt.type] = msgt;
		    this.msgtype_name_hash[msgt.name] = msgt.type;
		    idx += 89;
		} else if (this.msgtypes[msgtypeval] != null) {
		    /* Add the offset where we found this message to the
                     * array of offsets. We can then later make a time series
                     * by going very fast throught the logbuffer */
		    const msgt = this.msgtypes[msgtypeval];
			if (msgt.with_instances) {
				const instance = dv.getUint8(idx + 3 + msgt.instance_offset);
				if (msgt.data[instance] == null)
					msgt.data[instance] = [idx + 3];
				else
					msgt.data[instance].push(idx + 3);
			} else
				msgt.data.push(idx+3);
		    idx += msgt.length;
		} else {
		    console.log("Found message not in dictionary");
		    idx++;
		}
	    } else
		idx++;
	}
    }
    /* Return a sorted list of message items to show them in the
     * navigation bar.
     */
    get_msgitem_list() {
	return [...this.msgtypes].sort((a, b) => {
	    if (a.name < b.name)
		return -1;
	    if (a.name > b.name)
		return 1;
	    return 0;
	});
    }
    /* Based on item name like "GPS" and the subitemname like "Lat" I go through the logbuffer and
     * collect a time and data array ready for plotting with plotly */
    get_data_series(item, instance, subitem) {
		const msgtypeval = this.msgtype_name_hash[item]; //Type number from name like GPS
		const msgt = this.msgtypes[msgtypeval];
		var ds = { name : item +
			(msgt.with_instances ? instance : "") + "." + subitem, x : [], y : [] };
		const subitemidx = msgt.subitemidx_from_name[subitem];
		const timesubidx = msgt.subitemidx_from_name["TimeUS"];
		const subitemoffset = msgt.subitemoffset[subitemidx]; /* Offset of subitem within item */
		const timesuboff =  msgt.subitemoffset[timesubidx];
		const rf = readfunc[msgt.fields[subitemidx]];
		const dv = new DataView(this.buffer);
		let dataindexlist = [];
		if (msgt.with_instances)
			dataindexlist = msgt.data[instance];
		else
			dataindexlist = msgt.data;
		for (let i = 0;i < dataindexlist.length;i++) {
			let offset = dataindexlist[i] + subitemoffset;
			const value = rf(dv, offset);
			ds.y.push(value);
			offset = dataindexlist[i] + timesuboff;
			const timeval = dv.getBigUint64(offset,true);
			const date = new Date(Number(timeval / 1000n) + this.boot_time_ms_since_epoch);
			ds.x.push(date);
		}
		return ds;
    }
	/** Retrieve the position information from GPS for map drawing, flight time and
	 *  flight distance computations.
	*/
	get_gps_series() {
		const gpstypeval = this.msgtype_name_hash["GPS"];
		const msgt = this.msgtypes[gpstypeval];
		var ds = { name : "GPS", lat : [], lon : [], time : [], vel : [], status : [] };
		const latsubidx  = msgt.subitemidx_from_name["Lat"];
		const lonsubidx  = msgt.subitemidx_from_name["Lng"];
		const velsubidx  = msgt.subitemidx_from_name["Spd"];
		const timesubidx = msgt.subitemidx_from_name["TimeUS"];
		const statusidx  = msgt.subitemidx_from_name["Status"];
		const latoffset  = msgt.subitemoffset[latsubidx];
		const lonoffset  = msgt.subitemoffset[lonsubidx];
		const veloffset  = msgt.subitemoffset[velsubidx];
		const timeoffset  = msgt.subitemoffset[timesubidx];
		const statusoffset = msgt.subitemoffset[statusidx];
		const latlonrf    = readfunc[msgt.fields[latsubidx]];
		const velrf       = readfunc[msgt.fields[velsubidx]];
		const statusrf    = readfunc[msgt.fields[statusidx]];

		const dv = new DataView(this.buffer);
		const dataindexlist = msgt.data[0]; // GPS instance 0
		let latcen = 0.0, loncen = 0.0;
		let latmin = 90.0;
		let latmax = -90.0;
		let lonmin = 180.0;
		let lonmax = -180.0;
		for (let i = 0;i < dataindexlist.length;i++) {
			const msgoffset = dataindexlist[i];
			const status = statusrf(dv, msgoffset + statusoffset);
			ds.status.push(status);
			const lat = latlonrf(dv, msgoffset + latoffset) / 10000000.0;
			latmin = Math.min(latmin, lat);
			latmax = Math.max(latmax, lat);
			latcen += lat;
			ds.lat.push(lat);
			const lon = latlonrf(dv, msgoffset + lonoffset) / 10000000.0;
			lonmin = Math.min(lonmin, lon);
			lonmax = Math.max(lonmax, lon);
			loncen += lon;
			ds.lon.push(lon);
			const vel = velrf(dv, msgoffset + veloffset);
			ds.vel.push(vel);
			const timeval = dv.getBigUint64(msgoffset + timeoffset,true);
			const date = new Date(Number(timeval / 1000n) + this.boot_time_ms_since_epoch);
			ds.time.push(date);
		}
		ds.latmin = latmin;
		ds.latmax = latmax;
		ds.lonmin = lonmin;
		ds.lonmax = lonmax;
		ds.cenlon = loncen/dataindexlist.length;
		ds.cenlat = latcen/dataindexlist.length;
		return ds;
    }
	/** Find the timebase of the logfile by relating the
	 *  "TimeUS" which gives the Microseconds since boot with
	 *  the GPS absolute time available in
	 *  GPS.GMS - Milliseconds since start of GPS Week
	 *  GPS.GWk - Weeks since 5 January 1980
	 *  Return: Boot time in ms since epoch (1 January 1970)
	*/
	find_timebase() {
		const gpstypeval = this.msgtype_name_hash["GPS"];
		if (gpstypeval == null)
			return 0; /* No GPS message in dictionary */
		const msgt = this.msgtypes[gpstypeval];

		const gmssubidx  = msgt.subitemidx_from_name["GMS"];
		const gwksubidx  = msgt.subitemidx_from_name["GWk"];
		const timesubidx = msgt.subitemidx_from_name["TimeUS"];
		const statusidx  = msgt.subitemidx_from_name["Status"];
		const gmsoffset  = msgt.subitemoffset[gmssubidx];
		const gwkoffset  = msgt.subitemoffset[gwksubidx];
		const timeoffset  = msgt.subitemoffset[timesubidx];
		const statusoffset = msgt.subitemoffset[statusidx];
		const gmsrf       = readfunc[msgt.fields[gmssubidx]];
		const gwkrf       = readfunc[msgt.fields[gwksubidx]];
		const statusrf    = readfunc[msgt.fields[statusidx]];

		const dv = new DataView(this.buffer);
		const dataindexlist = msgt.data[0]; // GPS instance 0
		for (let i = 0;i < dataindexlist.length;i++) {
			const msgoffset = dataindexlist[i];
			const status = statusrf(dv, msgoffset + statusoffset);
			if (status < 3) { /* Search for GPS 3D fix or better */
				continue;
			}
			const gwk = gwkrf(dv, msgoffset + gwkoffset);
			const gms = gmsrf(dv, msgoffset + gmsoffset);
			const timeval = dv.getBigUint64(msgoffset + timeoffset,true);
			const time_since_boot_ms = Number(timeval / 1000n);
			const date_gps_start_week_ms_since_epoch = Date.UTC(1980,0,5);
			const time_gwk_ms = gwk * 7 * 24 * 3600 * 1000;
			const msgtime_ms_since_epoch = date_gps_start_week_ms_since_epoch + time_gwk_ms + gms;
			const time_at_boot_ms_since_epoch = msgtime_ms_since_epoch - time_since_boot_ms;
			return time_at_boot_ms_since_epoch;
		}
		return 0;
    }
}
