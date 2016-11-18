#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 16, 2016

@author: sakari
'''

import json
from pprint import pprint

# sorts vehicle's location history by time and removes duplicates
def prep_vehicle_loc_info(time_locations):
    unique_observations = [dict(t) for t in set([tuple(location.items()) for location in time_locations])] # removes duplicate time/locations: https://stackoverflow.com/questions/9427163/remove-duplicate-dict-in-list-in-python
    sorted_by_time = sorted(unique_observations, key=lambda k: k['timestamp']) # sorts time/locations by timestamp
    return sorted_by_time


stops = []

with open("outputs/prepared_data.json") as data_file:
    data = json.load(data_file)
    
    for vehicle in data:
        
        vehicle_history = prep_vehicle_loc_info(data[vehicle])
        
        latest_loc = vehicle_history[0]
        
        stop_has_started = 0
        start_time = latest_loc['timestamp']
        for location in vehicle_history[1:]:
            if latest_loc['latitude'] == location['latitude'] and latest_loc['longitude'] == location['longitude']:
                if not stop_has_started:
                    stop_has_started = 1
                    start_time = latest_loc['timestamp']
            elif stop_has_started:
                stop_has_started = 0
                stop_time = latest_loc['timestamp']
                
                stop_info = {}
                stop_info['vehicleRef'] = vehicle
                stop_info['startTimestamp'] = start_time
                stop_info['stopTimestamp'] = stop_time
                stop_info['latitude'] = latest_loc['latitude']
                stop_info['longitude'] = latest_loc['longitude']
                stops.append(stop_info)
                
            latest_loc = location


with open('outputs/stop_times.json', 'w') as outfile:
    json.dump(stops, outfile)