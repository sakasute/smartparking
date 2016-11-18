#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 16, 2016

@author: sakari
'''

import os
import json
from pprint import pprint

'''
Script to prepare raw json-files from the raw_HSL_data-folder into one json-file
with only necessary information (time and location). And yes, the code is far from
optimal.

example of output:

{
  "metro83": [
    {
      "Longitude": 25.038409,
      "Timestamp": 1479482560000,
      "Latitude": 60.200576
    },
    {
      "Longitude": 25.039756,
      "Timestamp": 1479482571000,
      "Latitude": 60.201737
    }
  ],
  "H9137": [
    {
      "Longitude": 24.91770602,
      "Timestamp": 1479482559591,
      "Latitude": 60.30824388
    },
    {
      "Longitude": 24.91770602,
      "Timestamp": 1479482569895,
      "Latitude": 60.30824388
    },
    {
      "Longitude": 24.84846,
      "Timestamp": 1479482948177,
      "Latitude": 60.28567
    }
  ]
}
'''

path = './raw_HSL_data/'

vehicle_activity = {}
list_of_activities = []

for filename in os.listdir(path):   # iterate through every filename in folder
    with open("raw_HSL_data/" + filename) as data_file:
        try:
            data = json.load(data_file)
            for vehicle in data['Siri']['ServiceDelivery']['VehicleMonitoringDelivery'][0]['VehicleActivity']: 
                key = vehicle['MonitoredVehicleJourney']['VehicleRef']['value']
                timestamp = vehicle['RecordedAtTime']
                latitude = vehicle['MonitoredVehicleJourney']['VehicleLocation']['Latitude']
                longitude = vehicle['MonitoredVehicleJourney']['VehicleLocation']['Longitude']
                
                time_location = {}                
                time_location['Timestamp'] = timestamp
                time_location['Latitude'] = latitude
                time_location['Longitude'] = longitude
                
                if time_location['Latitude'] != (0 or None) and time_location['Longitude'] != (0 or None):      # don't add points with missing gps info
                    if key in vehicle_activity:
                        if timestamp != vehicle_activity[key][-1]['Timestamp']:     # don't add duplicate timelocations
                            vehicle_activity[key].append(time_location)
                    else:
                        vehicle_activity[key] = []
                        vehicle_activity[key].append(time_location)
                    
                 
        except ValueError:
            print("shit happens")
            

# make dictionaries (i.e. json-objects) out of every vehicleActivity item
for vehicle, timelocations in vehicle_activity.items():
    list_of_activities.append({vehicle: timelocations})
            
            
with open('outputs/prepared_data.json', 'w') as outfile:
    json.dump(vehicle_activity, outfile)
    
            
