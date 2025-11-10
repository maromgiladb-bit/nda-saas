#!/usr/bin/env python3
import re

# Read the file
with open('src/app/fillnda/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines around the problem area
print("Lines 1070-1095:")
for i in range(1069, min(1095, len(lines))):
    print(f"{i+1}: {repr(lines[i])}")

print(f"\nTotal lines: {len(lines)}")
