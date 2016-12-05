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
  });
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

function filterByLength(inputData, minLength, maxLength) {
  var filteredData = $.grep(inputData, function(value, index){
    var length = (value.StopTimestamp - value.StartTimestamp)/1000;
    if (length < minLength || length > maxLength) {
      return false;
    }
    return true;
  });
  return filteredData;
}

function filterByBattery(inputData, minLevel, maxLevel) {
  var filteredData = $.grep(inputData, function(value, index) {
    if (value.Batterylevel < minLevel || value.Batterylevel > maxLevel) {
      return false;
    }
    return true;
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
  $.each(heatLayers, function(index, value) {
		map.removeLayer(value);
	});

  var heatmapData = getHeatmapData(inputData);
  heatLayers.push(L.heatLayer(heatmapData, {radius: 10}).addTo(map));
}



$( document ).ready(function() {
    initmap();
    loadData();

    var timeSlider = $("#filterByTimeSlider").slider().data("slider");
    var lengthSlider = $("#filterByLengthSlider").slider().data("slider");
    var batterySlider = $("#filterByBatterySlider").slider().data("slider");

    $("#filterButton").click(function() {
      var startTime = timeSlider.getValue()[0];
      var stopTime = timeSlider.getValue()[1];
      var minLength = lengthSlider.getValue()[0];
      var maxLength = lengthSlider.getValue()[1];
      var minLevel = batterySlider.getValue()[0];
      var maxLevel = batterySlider.getValue()[1];

      var filteredByTime = filterByTime(stopData, startTime, stopTime);
      var filteredByTimeAndLength = filterByLength(filteredByTime, minLength, maxLength);
      var filteredData = filterByBattery(filteredByTimeAndLength, minLevel, maxLevel);

      console.log(filteredData);
      drawHeatmap(filteredData);
    });
});
