#!/bin/python3

import xml.etree.ElementTree as ET
import sys
import os


#
# A lookup table for converting integer to base32 character
#
base32table : list[str] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 
    'U', 'V']


def intToBase32Character(input : int) -> str:
    return base32table[min(int(input), 31)]


#
# Parse a layer in a CSV format and returns a "base32 string",
# i.e. a string of which each character is one tile, taking values
# from 0 to 31.
#
def parse_layer(input : str) -> str:
    out : str = ""
    for i in input.replace("\n", "").split(","):
        out += intToBase32Character(int(i))
    return out

#
# Parses a single file and returns a string that has all the data in base32.
#
def parse_file(path : str) -> str:

    root : ET.Element = ET.parse(path).getroot()

    width : int = root.attrib["width"]
    height : int = root.attrib["height"]

    layerStr : str = ""
    for l in root.iter("data"):
        layerStr = parse_layer(l.text)
        # We always assume that there is only one level,
        # so we can stop here...
        break

    if len(layerStr) == 0:
        raise Exception("No layers in " + input + "!")
    
    return "\"" + intToBase32Character(width) + intToBase32Character(height) + layerStr + "\""


#
# Go through all the files in the folder and assume that
# they are of a correct type (not lazy at all...).
#
os.chdir(sys.path[0])
out = "["
ignoreComma = True
for file in os.listdir("."):

    if not file.endswith(".tmx"):
        continue

    if not ignoreComma:
        out += ","

    if os.path.isfile(file):
        out += parse_file(file)

out += "];"

print(out)
