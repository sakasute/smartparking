#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 16, 2016

@author: sakari
'''

import os
import json
from pprint import pprint

path = './raw_HSL_data/'

vehicle_activity = {}

for filename in os.listdir(path):
    with open("raw_HSL_data/" + filename) as data_file:
        try:
            data = json.load(data_file)
            for vehicle in data['Siri']['ServiceDelivery']['VehicleMonitoringDelivery'][0]['VehicleActivity']: 
                key = vehicle['MonitoredVehicleJourney']['VehicleRef']['value']
                timestamp = vehicle['RecordedAtTime']
                latitude = vehicle['MonitoredVehicleJourney']['VehicleLocation']['Latitude']
                longitude = vehicle['MonitoredVehicleJourney']['VehicleLocation']['Longitude']
                time_location = {}
                
                time_location['timestamp'] = timestamp
                time_location['latitude'] = latitude
                time_location['longitude'] = longitude
                if key in vehicle_activity:
                    vehicle_activity[key].append(time_location)
                    
                else:
                    vehicle_activity[key] = []
                    
                    vehicle_activity[key].append(time_location)
                    
                
                
            
        except ValueError:
            print("shit happens")
            
with open('outputs/prepared_data.json', 'w') as outfile:
    json.dump(vehicle_activity, outfile)
    
            
