#!/usr/bin/env python3
import sys
from pdf2docx import Converter

input_path = sys.argv[1]
output_path = sys.argv[2]

cv = Converter(input_path)
cv.convert(output_path, start=0, end=None)
cv.close()
