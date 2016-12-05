var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var heatLayers = [];

var stopData = null;
var vehicleLocations = [];

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

function loadData() {
  $.getJSON("backend/data_handling_tool/outputs/stop_times.json")
  .done(function( data ) {
    stopData = data;
  })
}

// returns stops that have occured between given times
function filterByTime(inputData, startTime, stopTime) {
  var filteredData = $.grep(inputData, function(value, index){
    if (value.StopTimestamp < startTime || value.StartTimestamp > stopTime) {
      return false;
    }
    return true;
  });
  return filteredData;
}

function filterByBattery(inputData, minLevel, maxLevel) {
  var filteredData = $.grep(inputData, function(value, index) {
    if (value.Batterylevel < minLevel || value.Batterylevel > maxLevel) {
      return false
    }
    return true
  });
  return filteredData;
}

function getHeatmapData(inputData) {
  var locations = [];
  $.each(inputData, function(index, value){
    locations.push([value.Latitude, value.Longitude, 1]); // lat, long, intensity
  });
  return locations;
}

function drawHeatmap(inputData) {
  var heatmapData = getHeatmapData(inputData);
  L.heatLayer(heatmapData, {radius: 10}).addTo(map);
}



$( document ).ready(function() {
    initmap();
    loadData();

    $("#filterByTimeButton").click(function(){
			var startTime = $("#startTimeInput").val();
      var stopTime = $("#stopTimeInput").val();
			filterByTime(stopData, startTime, stopTime);
		});
});
