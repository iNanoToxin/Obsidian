from util.npm import get_package, start_watch, copied_text, modified_text, NPM_INSTALL
from util.color import color
import subprocess
import os
import sys


assert len(sys.argv) > 2, "source and destination path arguments required"
source_path = sys.argv[1]
dest_path = sys.argv[2]

assert os.path.isdir(source_path), f'"{source_path}" is not a valid directory'
assert os.path.isdir(dest_path), f'"{dest_path}" is not a valid directory'


print(color("Installing npm dependencies...", 63))

process = subprocess.Popen(
    f"cd {source_path} && {NPM_INSTALL}",
    shell=True,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
process.wait()

print(color("Finished installing npm dependencies", 63))


message_queue = []

subprocess.Popen(
    f'cd "{source_path}" && {get_package(source_path)["scripts"]["dev"]}',
    shell=True,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

start_watch(
    source_path,
    dest_path,
    on_copied=lambda src, dest: message_queue.append(copied_text(src, dest)),
    on_modified=lambda src, dest: message_queue.append(modified_text(src, dest)),
)


try:
    while True:
        if message_queue:
            print(message_queue.pop(0))
except KeyboardInterrupt:
    print(color("Watch aborted", 16))