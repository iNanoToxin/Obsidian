import os
import sys


assert len(sys.argv) > 1, "path argument required"
assert os.path.isdir(sys.argv[1]), f'"{sys.argv[1]}" is not a valid directory'

os.chdir(sys.argv[1])

files_to_delete = ["main.js", "data.json", "package-lock.json", "build.zip"]

for file in files_to_delete:
    if os.path.isfile(file):
        os.remove(file)

if os.path.isdir("node_modules"):
    os.system("rd /s /q node_modules")
