'''
Created on Nov 15, 2016

@author: sakari
'''

import requests
import time

while 1:
    resp = requests.get('http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL')

    current_time = "%10d"%(time.time())
    
    output_file = open(current_time + ".json", 'w+')
    
    output_file.write(resp.text)
    
    time.sleep(10)