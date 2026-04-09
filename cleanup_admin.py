import os

file_path = r'c:\Users\usuário\Documents\Projeto Car\client\src\pages\admin.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# VendorWorkspace was inserted at line 55 (index 54).
# My new version ends at index 169 (line 170).
# The mess starts at index 170 (line 171) and ends at line 6470 (index 6469).

new_lines = lines[:170] + lines[6470:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File cleaned up successfully.")
