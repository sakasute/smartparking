var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var heatLayers = [];
var parkingHeatLayers = [];

var stopData = null;
var parkData = null;
var chargers = null;
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
	$.getJSON("backend/data_handling_tool/outputs/parking_lot_stops.json")
  .done(function( data ) {
    parkData = data;
  });
	$.getJSON("backend/data_handling_tool/outputs/chargers.json", function( data ) {
		$.each(data, function(index, value) {
			chargers = data;
		});
	});
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
};

function showChargingStations() {
	removeChargingStations();
	$.each(chargers, function(index, value) {
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
				connections += value + "kW" + ", ";
			}
		});

		if(connections.length === 0) connections = "No given data";
		else connections = connections.slice(0, -2); //drop the last ", "

		var header = "<b>"+title+"</b><br>";
		var addressText = "Address: " + address+"<br>";
		var chargingPoints = "Charging points: " + points+"<br>";
		var powerkWH = "Power: " + connections + "<br>";

		var marker = L.marker([lat,lon]).addTo(map);
		marker.bindPopup(header+addressText+chargingPoints+powerkWH);
		chargeMarkers.push(marker);

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

			removeHeatmap();

      if ($("#trafficDataFlag").is(":checked")) {
				var filteredByTime = filterByTime(stopData, startTime, stopTime);
	      var filteredByTimeAndLength = filterByLength(filteredByTime, minLength, maxLength);
	      var filteredData = filterByBattery(filteredByTimeAndLength, minLevel, maxLevel);
				drawHeatmap(filteredData);
			}

			if ($("#parkingDataFlag").is(":checked")) {
				var parkTimeFiltered = filterByTime(parkData, startTime, stopTime);
				var parkTimeAndLengthFiltered = filterByLength(parkTimeFiltered, minLength, maxLength);
	      var filteredParkData = filterByBattery(parkTimeAndLengthFiltered, minLevel, maxLevel);
				drawHeatmap(filteredParkData);
			}


			if ($("#chargersFlag").is(":checked")) {
				showChargingStations();
			} else {
				removeChargingStations();
			}
    });
});
