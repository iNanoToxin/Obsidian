from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent
import shutil
import os
import sys

assert len(sys.argv) > 2, "source and destination path arguments required"
source_path = sys.argv[1]
dest_path = sys.argv[2]

assert os.path.isdir(source_path), f'"{source_path}" is not a valid directory'
assert os.path.isdir(dest_path), f'"{dest_path}" is not a valid directory'

os.chdir(source_path)

assert os.system("npm install --legacy-peer-deps") == 0, "failed to run `npm install --legacy-peer-deps`"

def color(string: str, color: int):
    return f"\033[38;5;{color}m{string}\033[0m"

files_to_copy = ["main.js", "styles.css", "manifest.json", "data.json"]


for file in files_to_copy:
    if os.path.isfile(file):
        shutil.copy(file, dest_path)
        print(f"{color("Copied", 1)} {color(file, 67)} -> {color(os.path.basename(dest_path), 173)}")


class FileWatcher(FileSystemEventHandler):
    def on_modified(self, event: FileModifiedEvent):
        file = os.path.basename(event.src_path)

        if file in files_to_copy:
            print(f"{color("Modified", 132)} {color(file, 67)} -> {color(os.path.basename(dest_path), 173)}")
            shutil.copy(event.src_path, dest_path)


event_handler = FileWatcher()
observer = Observer()
observer.schedule(event_handler, source_path, event_filter=[FileModifiedEvent])
observer.start()

try:
    assert os.system("npm run dev") == 0, "failed to run `npm run dev`"
except KeyboardInterrupt:
    pass

observer.stop()
observer.join()
