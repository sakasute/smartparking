'''
Created on 5.12.2016

@author: sakke
'''

'''
This script adds mock up battery levels to prepared_hsl_data
'''

import json
from pprint import pprint

with open("outputs/prepared_data.json") as data_file:
    data = json.load(data_file)
    
    for vehicle in data:
        vehicle_history = data[vehicle]
        latest_battery = 100.0
        for location in vehicle_history:
            new_battery = 0.999*latest_battery
            location['Batterylevel'] = new_battery
            latest_battery = new_battery
            
            
with open('outputs/prepared_with_battery.json', 'w') as outfile:
    json.dump(data, outfile)