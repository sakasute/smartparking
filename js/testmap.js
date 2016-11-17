var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var markers = [];
var stopMarkers = [];

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

function refreshBusLocations() {
	console.log("tick");
	var locations = [];
	$.each(markers, function(index, value) {
		map.removeLayer(value);
	});

	$.getJSON("http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL", function( data ) {
		vehicleActivity = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;

		$.each(vehicleActivity, function(index, value) {
			locations.push([value.MonitoredVehicleJourney.VehicleLocation.Latitude, value.MonitoredVehicleJourney.VehicleLocation.Longitude]);
		});

		$.each(locations, function(index, value) {
			markers.push(L.marker(value).addTo(map));
		});
	});
}

// stopLength is time in milliseconds
function showStopLocations(stopLength) {
	$.each(stopMarkers, function(index, value) {
		map.removeLayer(value);
	});

	$.getJSON("backend/stop_times.json", function( data ) {
		var stops = $.grep(data, function(value, index) { // filter out stops shorter than given time
			length = value.stopTimestamp - value.startTimestamp;
			if (length < stopLength) {
				return false;
			}
			stopMarkers.push(L.marker([value.latitude, value.longitude]).addTo(map));
			return true;
		});
	});
}


$( document ).ready(function() {
    initmap();
		//refreshBusLocations();
		//setInterval(refreshBusLocations, 5000);

		$("#stopTimeButton").click(function(){
			var stopLength = $("#stopTimeInput").val();
			showStopLocations(stopLength * 1000);
		});

});
