#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
Created on Nov 15, 2016

@author: sakari
'''



import requests
import time

while 1:
    resp = requests.get('http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL')

    current_time = "%10d"%(time.time())  # tämän hetken timestamp sekunteina tiedoston nimeä varten
    
    output_file = open("hsl_data/" + current_time + ".json", 'w+')  # muista luoda hsl_data -kansio ennen scriptin ajamista
    
    output_file.write(resp.text)
    
    time.sleep(10) # ajaa scriptin suunnilleen 10 sekunnin välein hamaan tulevaisuuteen