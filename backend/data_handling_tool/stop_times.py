#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 16, 2016

@author: sakari
'''

import json
from pprint import pprint

'''
Script to extract times when vehicles are stationary from prepared HSL-data. Example
of output:

[
  {
    "Latitude": 60.18629,
    "StartTimestamp": 1479222141540,
    "VehicleRef": "4026",
    "Longitude": 24.9858,
    "StopTimestamp": 1479222142022
  },
  {
    "Latitude": 60.18659,
    "StartTimestamp": 1479222171650,
    "VehicleRef": "4026",
    "Longitude": 24.98063,
    "StopTimestamp": 1479222174495
  }
]
'''

# sorts vehicle's location history by time and removes duplicates
def sort_by_time(time_locations):
    sorted_by_time = sorted(time_locations, key=lambda k: k['Timestamp']) # sorts time/locations by timestamp
    return sorted_by_time

stops = []

with open("outputs/prepared_with_battery.json") as data_file:
    data = json.load(data_file)
    
    for vehicle in data:
        
        vehicle_history = data[vehicle] #sort_by_time(data[vehicle])
        
        latest_loc = vehicle_history[0]
        
        stop_has_started = 0
        start_time = latest_loc['Timestamp']
        for location in vehicle_history[1:]:
            # this condition still needs some thought and testing
            if abs(latest_loc['Latitude'] - location['Latitude']) < 0.0001 and abs(latest_loc['Longitude'] - location['Longitude'] < 0.00005):   # 1 degree in longitude is pretty much twice the length of 1 degree latitude in metres at Helsinki's coordinates
                if not stop_has_started:
                    stop_has_started = 1
                    start_time = latest_loc['Timestamp']
            elif stop_has_started:
                stop_has_started = 0
                stop_time = latest_loc['Timestamp']
                
                stop_info = {}
                stop_info['VehicleRef'] = vehicle
                stop_info['StartTimestamp'] = start_time
                stop_info['StopTimestamp'] = stop_time
                stop_info['Latitude'] = latest_loc['Latitude']
                stop_info['Longitude'] = latest_loc['Longitude']
                stop_info['Batterylevel'] = latest_loc['Batterylevel'] # battery level at the start of the stop
                stops.append(stop_info)
                
            latest_loc = location


with open('outputs/stop_times.json', 'w') as outfile:
    json.dump(stops, outfile)