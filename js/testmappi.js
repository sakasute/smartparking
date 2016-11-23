var map;
var ajaxRequest;
var markers = [];
var stopMarkers = [];
var heatLayers = [];
var chargers = [];
var batteryThresholdMarkers = [];
var parkingLotMarkers = [];
var locations = [];

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

// stopLength is time in milliseconds
function showStopLocations(stopLength) {
	//$.each(stopMarkers, function(index, value) {
	//	map.removeLayer(value);
	//});
	stopMarkers = [];
	clearHeatLayer();

	$.getJSON("backend/data_handling_tool/outputs/stops.json", function( data ) {
		var stops = $.grep(data, function(value, index) { // filter out stops shorter than given time
			length = value.stopTimestamp - value.startTimestamp;
			if (length < stopLength) {
				return false;
			}
			stopMarkers.push([value.latitude, value.longitude, 1]); // lat, lng, intensity
			return true;
		});
		heatLayers.push(L.heatLayer(stopMarkers, {radius: 25}).addTo(map));
	});
}

function showBatteryThresholdLocations(input) {

	batteryThresholdMarkers = [];

	clearHeatLayer();
	clearParkingLotMarkers();

	var stops = $.grep(locations, function(value, index) {
		
		var name = value[0].name
		var lat = value[0].latitude
		var lon = value[0].longitude
		var vehicles = value[0].vehicles
		var charging = 0
		var notCharging = 0

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

		var header = "<b>"+name+"</b><br>"
		var vehicleAmount = "Electric Vehicles: "+(vehicles.length)+"<br>"
		var chargeStatus = "Charging: " + charging + "<br>" + "Not charging: " + notCharging + "<br>"

		var areaMarker = L.marker([lat,lon]).addTo(map);
		parkingLotMarkers.push([areaMarker])
		areaMarker.bindPopup(header+vehicleAmount+chargeStatus);
		return true;
	});
	heatLayers.push(L.heatLayer(batteryThresholdMarkers, {radius: 20}).addTo(map));
}

function showChargingStations() {

	clearChargers();

	$.getJSON("http://api.openchargemap.io/v2/poi/?output=json&latitude=60.1826&longitude=24.9215&distance=50&maxresults=100&compact=true&verbose=false", function( data ) {
		$.each(data, function(index, value) {
			chargers.push([value.AddressInfo.Latitude, value.AddressInfo.Longitude]);
		});
		$.each(chargers, function(index, value) {
			markers.push(L.marker(value).addTo(map));
		});
	});
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
		map.removeLayer(value);
	});
	markers = [];
	chargers = [];
}

function clearAll() {
	clearHeatLayer();
	clearParkingLotMarkers();
	clearChargers();

	stopMarkers = [];
	batteryThresholdMarkers = [];
}


$( document ).ready(function() {
    initmap();
	//refreshBusLocations();
	//setInterval(refreshBusLocations, 5000);

	$.getJSON("backend/data_handling_tool/outputs/stops.json", function( data ) {
		$.each(data, function(index, value) {
			locations.push([value]);
		});
	});

	//$("#stopTimeButton").click(function(){
		//var stopLength = $("#stopTimeInput").val();
		//showStopLocations(stopLength * 60);
	//});

	$("#EVButton").click(function(){
		showBatteryThresholdLocations();
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

	$("#clearAllButton").click(function(){
		clearAll();
	});

});
