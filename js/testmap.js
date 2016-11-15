var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];

function initmap() {
	// set up the map
	map = new L.Map('testmap');
	markers = [];

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

	$.getJSON("backend/example.json", function( data ) {
		console.log("getjson");
		vehicleActivity = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;

		$.each(vehicleActivity, function(index, value) {
			locations.push([value.MonitoredVehicleJourney.VehicleLocation.Latitude, value.MonitoredVehicleJourney.VehicleLocation.Longitude]);
		});

		$.each(locations, function(index, value) {
			markers.push(L.marker(value).addTo(map));
		});

	});


}

$( document ).ready(function() {
    initmap();
		refreshBusLocations();
		setInterval(refreshBusLocations, 5000);

});
