import zipfile
import os
import sys


assert len(sys.argv) > 1, "path argument required"
assert os.path.isdir(sys.argv[1]), f'"{sys.argv[1]}" is not a valid directory'

os.chdir(sys.argv[1])

assert os.system("npm install") == 0, "failed to run `npm install`"
assert os.system("npm run build") == 0, "failed to run `npm run build`"


zip_files = ["main.js", "styles.css", "manifest.json"]


existing_files = list(filter(lambda f: os.path.isfile(f), zip_files))
build_file = f"{os.path.basename(sys.argv[1])}.zip"

if len(existing_files) > 0:
    # Create a zip file and add each file
    with zipfile.ZipFile(build_file, "w") as zipf:
        for file in existing_files:
            zipf.write(file)
            print(f"Added {file} to {build_file}")

    print("Zipping complete.")
