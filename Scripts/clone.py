import shutil
import os
import sys

assert len(sys.argv) > 2, "source and destination path arguments required"
source_path = sys.argv[1]
dest_path = sys.argv[2]

assert os.path.isdir(source_path), f'"{source_path}" is not a valid directory'
assert os.path.isdir(dest_path), f'"{dest_path}" is not a valid directory'

os.chdir(source_path)

assert os.system("npm install") == 0, "failed to run `npm install`"
assert os.system("npm run build") == 0, "failed to run `npm run build`"

files_to_copy = ["main.js", "styles.css", "manifest.json"]
build_folder = os.path.join(dest_path, os.path.basename(source_path))

os.makedirs(build_folder, exist_ok=True)

for file in files_to_copy:
    if os.path.isfile(file):
        shutil.copy(file, build_folder)
        print(f"Copied {file} to {os.path.basename(source_path)}")

print("Files cloned successfully")
