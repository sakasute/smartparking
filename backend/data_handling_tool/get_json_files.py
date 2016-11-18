#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 15, 2016

@author: sakari
'''

import requests
import time


'''
This script retrieves the current locations of Helsinki Region Transport's vehicle's
locations and saves the raw json-file into raw_HSL_data-folder.
'''


while 1:
    resp = requests.get('http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL')

    current_time = "%10d"%(time.time())  # current time stamp in seconds from epock for the filename
    
    output_file = open("raw_HSL_data/" + current_time + ".json", 'w+')
    
    output_file.write(resp.text)
    
    print("created file " + current_time + ".json")
    
    output_file.close()
    
    time.sleep(10) # the script repeats about every 10 seconds