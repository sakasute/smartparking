var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var heatLayers = [];
var parkingHeatLayers = [];

var stopData = null;
var chargers = [];
var chargeMarkers = [];
var vehicleLocations = [];
var locations = []; //parking data

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
	$.getJSON("http://api.openchargemap.io/v2/poi/?output=json&latitude=60.1826&longitude=24.9215&distance=50&maxresults=100&compact=true&verbose=false", function( data ) {
		$.each(data, function(index, value) {
			chargers.push([value.AddressInfo.Latitude, value.AddressInfo.Longitude]);
		});
	});
}

function showChargingStations() {
	removeChargingStations();
	$.each(chargers, function(index, value) {
		chargeMarkers.push(L.marker(value).addTo(map));
	});
}

function removeChargingStations() {
	$.each(chargeMarkers, function(index, value) {
		map.removeLayer(value);
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
    locations.push([value.Latitude, value.Longitude, 2]); // lat, long, intensity
  });
  return locations;
}

function drawHeatmap(inputData) {
  removeHeatmap();

  var heatmapData = getHeatmapData(inputData);
  heatLayers.push(L.heatLayer(heatmapData, {radius: 25}).addTo(map));
}

function removeHeatmap() {
	$.each(heatLayers, function(index, value) {
		map.removeLayer(value);
	});
}

function epochToClock(epochInMillis) {
	var epochInS = Math.floor(epochInMillis/1000);
	var d = new Date(0);
	d.setUTCSeconds(epochInS);
	var hours = d.getHours();
	var minutes = d.getMinutes();
	if (parseInt(hours) < 10) {
		hours = "0" + hours;
	}
	if (parseInt(minutes) < 10) {
		minutes = "0" + minutes;
	}
	return hours + ":" + minutes;
}

function secondsToMinS(seconds) {
	if (parseInt(seconds < 60)) {
		return seconds + " s";
	} else {
		return Math.floor(parseInt(seconds)/60).toString() + " min " + (parseInt(seconds)%60).toString() + " s";
	}
}

/*
* == Parking lot data functions by Timo ==
*/

function fetchLocations() {
	locations = [];
	$.getJSON("backend/data_handling_tool/outputs/parkinglot.json", function( data ) {
		$.each(data, function(index, value) {
			locations.push([value]);
		});
	});
}

/*
* == Main program ==
*/
$( document ).ready(function() {
    initmap();
    loadData();

		//fetchLocations(); // parkinglot data

    var timeSlider = $("#filterByTimeSlider").slider().data("slider");
    var lengthSlider = $("#filterByLengthSlider").slider().data("slider");
    var batterySlider = $("#filterByBatterySlider").slider().data("slider");

		$("#filterByTimeSlider").on("slide", function(slideEvt) {
			$("#timeSliderVal1").text(epochToClock(slideEvt.value[0]));
			$("#timeSliderVal2").text(epochToClock(slideEvt.value[1]));
		});

		$("#filterByLengthSlider").on("slide", function(slideEvt) {
			$("#lengthSliderVal1").text(secondsToMinS(slideEvt.value[0]));
			$("#lengthSliderVal2").text(secondsToMinS(slideEvt.value[1]));
		});

		$("#filterByBatterySlider").on("slide", function(slideEvt) {
			$("#batterySliderVal1").text(slideEvt.value[0] + " %");
			$("#batterySliderVal2").text(slideEvt.value[1] + " %");
		});

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

      if ($("#trafficDataFlag").is(":checked")) {
				drawHeatmap(filteredData);
			} else {
				removeHeatmap();
			}

			if ($("#parkingDataFlag.").is(":checked")) {

			}


			if ($("#chargersFlag").is(":checked")) {
				showChargingStations();
			} else {
				removeChargingStations();
			}
    });
});
