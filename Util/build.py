import zipfile
import os
import sys


assert len(sys.argv) > 1, "path argument required"
assert os.path.isdir(sys.argv[1]), f'"{sys.argv[1]}" is not a valid directory'

os.chdir(sys.argv[1])

assert os.system("npm install") == 0, "failed to run `npm install`"
assert os.system("npm run build") == 0, "failed to run `npm run build`"


build_file = "build.zip"
zip_files = ["main.js", "styles.css", "manifest.json"]


existing_files = list(filter(lambda f: os.path.isfile(f), zip_files))
project_name = os.path.basename(sys.argv[1])

if len(existing_files) > 0:
    # Create a zip file and add each file
    with zipfile.ZipFile(build_file, "w") as zipf:
        zipf.mkdir(project_name)

        for file in existing_files:
            zipf.write(file, os.path.join(project_name, file))
            print(f"Added {file} to {build_file}")

    print("Zipping complete.")
