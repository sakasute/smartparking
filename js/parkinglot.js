// functions to handle parking lot data by Timo Haario
var map;
var ajaxRequest;
var markers = [];
var stopMarkers = [];
var heatLayers = [];
var chargers = [];
var batteryThresholdMarkers = [];
var parkingLotMarkers = [];
var locations = [];
var START_OF_THE_DAY = 1479254400; //16.11.2016 00:00:00, all the current data takes place in this day

var inputStart = 0;
var inputEnd = 0;

function initmap() {
	// set up the map
	map = new L.Map('testmap');

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 20, attribution: osmAttrib});

	// start the map in Helsinki
	map.setView(new L.LatLng(60.1826, 24.9215),12);
	map.addLayer(osm);
}

function showBatteryThresholdLocations(input) {
	//array for all the vehicles to be shown in the heatmap
	batteryThresholdMarkers = [];

	//clear previously shown markers and heatmap
	clearHeatLayer();
	clearParkingLotMarkers();

	//make a copy of the locations data
	var locs = JSON.parse(JSON.stringify(locations));

	//var locs = locations.slice();

	if(inputsGiven()) {
		locs = filterByTime(locs, inputStart, inputEnd)
	}

	//go through all the locations (parking areas) and their data and put them on the map
	$.each(locs, function(index, value) {

		//store the name, coordinates and vehicles of the given value (parking area)
		var name = value[0].name
		var lat = value[0].latitude
		var lon = value[0].longitude
		var vehicles = value[0].vehicles
		var charging = 0
		var notCharging = 0

		/*
		 * Go through all vehicles and make the following:
		 * 	if battery level is at 100, show it as a charging car on the map with the following instructions:
		 *		input "high" means we want to see charging cars, give intensity 5
		 *		input "low" means we want to see non-charging cars, give intensity 0
		 *	Same idea with <100 battery level (non-charging) but vice versa
		 */
		$.each(vehicles, function(index, value) {

			var intensity = 1
			if(value.batteryLevel == 100) {
				if(input == "low") intensity = 0;
				else if (input == "high") intensity = 5;
				charging += 1
			}
			else {
				notCharging += 1;
				if(input == "low") intensity = 5;
				else if (input == "high") intensity = 0;
			}
			batteryThresholdMarkers.push([value.latitude, value.longitude, intensity]); // lat, lng, intensity
		});

		//Show data of the given parking area inside the popup marker (name, vehicle amount, charging status)
		var header = "<b>"+name+"</b><br>"
		var vehicleAmount = "Electric Vehicles: "+(vehicles.length)+"<br>"
		var chargeStatus = "Charging: " + charging + "<br>" + "Not charging: " + notCharging + "<br>"

		var areaMarker = L.marker([lat,lon]).addTo(map);
		areaMarker.bindPopup(header+vehicleAmount+chargeStatus);
		parkingLotMarkers.push([areaMarker]);
		return true;
	});
	heatLayers.push(L.heatLayer(batteryThresholdMarkers, {radius: 20}).addTo(map));
}

/*
 * Fetch all the public charging stations from openchargemap.io API and show them on the map
 */
function showChargingStations() {
	//clear previously shown charges
	clearChargers();

	//fetch the data
	$.getJSON("http://api.openchargemap.io/v2/poi/?output=json&latitude=60.1826&longitude=24.9215&distance=50&maxresults=100&compact=true&verbose=false", function( data ) {

		//go through each charging station and put a marker on the map showing its status
		$.each(data, function(index, value) {

			var title = value.AddressInfo.Title;
			var address = value.AddressInfo.AddressLine1;
			var points = value.NumberOfPoints;
			var lat = value.AddressInfo.Latitude;
			var lon = value.AddressInfo.Longitude;
			var powers = [];
			var connections = "";

			//json data can contain multiple same power values and we want to show it just once, so filter out tuples
			$.each(value.Connections, function(index, value) {
				if (!powers.contains(value.PowerKW)) powers.push(value.PowerKW);
			});

			$.each(powers, function(index, value) {
				if (typeof value!== 'undefined') {
					connections += value + "kW" + ", "
				}

			});
			if(connections.length == 0) connections = "No given data";
			else connections = connections.slice(0, -2); //drop the last ", "

			var header = "<b>"+title+"</b><br>"
			var addressText = "Address: " + address+"<br>";
			var chargingPoints = "Charging points: " + points+"<br>";
			var powers = "Power: " + connections + "<br>";

			var marker = L.marker([lat,lon]).addTo(map);
			marker.bindPopup(header+addressText+chargingPoints+powers);
			markers.push([marker]);

		});
	});
}

/*
 * Filters given vehicle data to show only those vehicles that were parked in some point in time interval ]start...stop[
 * @param givenLocations - location data to be filtered
 * @param start - desired start time
 * @param stop - desired end time
 * @return - filtered locations
 */

function filterByTime(givenLocations, start, stop) {

	var filteredLocations = [];
	$.each(givenLocations, function(index, value) {
		var thisLocation = value;
		//we need to manually create an array so we can use Array filter() Method
		var vehicles = [];
		$.each(thisLocation[0].vehicles, function(index, value) {
			vehicles.push(value);
		});
		vehicles = vehicles.filter(byTime)
		thisLocation[0].vehicles = vehicles
		filteredLocations.push(thisLocation);
	});

	/*
	 * Helper function to check if the given car has been parked in time interval ]start...stop[
	 * @param value = given car
	 * @return = is the car parked inside the given time interval, true/false
	 */
	function byTime(value) {
		var car = value;

		var startTime = car.startTimestamp;
		var stopTime = car.stopTimestamp;

		//check if parking has been started before the desired start
		if(startTime < start) {
			if(stopTime >= start) {
				return true;
			}
		}
		//parking has been started after the desired start, but before the desired stop time?
		else {
			if(startTime <= stop) {
				return true;
			}
		}
		//car was not parked in the given time interval
		return false;
	}
	return filteredLocations;
}

//Contains method for arrays
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

function inputsGiven() {
	return (inputStart > 0 && inputEnd > 0)
}


function clearHeatLayer() {
	$.each(heatLayers, function(index, value) {
		map.removeLayer(value);
	});
	heatLayers = [];
}

function clearParkingLotMarkers() {
	$.each(parkingLotMarkers, function(index, value) {
		map.removeLayer(value[0])
	});
	parkingLotMarkers = [];
}

function clearChargers() {
	$.each(markers, function(index, value) {
		map.removeLayer(value[0]);
	});
	markers = [];
	chargers = [];
}

function clearAll() {
	clearHeatLayer();
	clearParkingLotMarkers();
	clearChargers();

	inputStart = 0;
	inputEnd = 0;
	stopMarkers = [];
	batteryThresholdMarkers = [];
	fetchLocations();
}

function fetchLocations() {
	locations = [];
	$.getJSON("backend/data_handling_tool/outputs/parkinglot.json", function( data ) {
		$.each(data, function(index, value) {
			locations.push([value]);
		});
	});
}

/*
$( document ).ready(function() {

	initmap();

	//load all the parked car data
	fetchLocations();

	$("#startTimeButton").click(function(){
		inputStart = $("#startTimeInput").val() * 3600 + START_OF_THE_DAY;
	});

	$("#stopTimeButton").click(function(){
		inputEnd = $("#stopTimeInput").val() * 3600 + START_OF_THE_DAY;
	});

	$("#EVButton").click(function(){
		showBatteryThresholdLocations("noInput");
	});

	$("#lowBatteryButton").click(function(){
		showBatteryThresholdLocations("low");
	});

	$("#highBatteryButton").click(function(){
		showBatteryThresholdLocations("high");
	});

	$("#showChargersButton").click(function(){
		showChargingStations();
	})

	$("#clearChargersButton").click(function(){
		clearChargers();
	})

	$("#clearAllButton").click(function(){
		clearAll();
	});

});
*/
