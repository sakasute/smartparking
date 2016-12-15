'''
Created on 7.12.2016

@author: sakke
'''
import json

stops = []

with open("outputs/parkinglot.json") as data_file:
    data = json.load(data_file)
    
    for park in data:
        for vehicle in park['vehicles']:
            stop_info = {}
            stop_info['VehicleRef'] = vehicle['vehicleRef']
            stop_info['StartTimestamp'] = vehicle['startTimestamp']*1000
            stop_info['StopTimestamp'] = vehicle['stopTimestamp']*1000
            stop_info['Latitude'] = vehicle['latitude']
            stop_info['Longitude'] = vehicle['longitude']
            stop_info['Batterylevel'] = vehicle['batteryLevel'] # battery level at the start of the stop
            stops.append(stop_info)
            
with open('outputs/parking_lot_stops.json', 'w') as outfile:
    json.dump(stops, outfile)