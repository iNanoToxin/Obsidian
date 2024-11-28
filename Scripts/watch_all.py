from util.plugin import get_args
from util.color import color
from util.npm import (
    get_packages,
    combine_dependencies,
    start_watch,
    NPM_INSTALL,
    copied_text,
    modified_text,
)
import subprocess
import os
import json


args = get_args(path=True, root=True, vault=True)
plugins_path = os.path.join(args.vault, ".obsidian/plugins")


assert os.path.isdir(args.path), f'"{args.path}" is not a valid directory'
assert os.path.isdir(args.vault), f'"{args.vault}" is not a valid directory'
assert os.path.isdir(plugins_path), f'"{plugins_path}" is not a valid directory'


packages = get_packages(args.path)

assert len(packages) > 0, f'plugins folder "{args.path}" is empty'

dependencies = combine_dependencies(*packages.values())

with open(os.path.join(args.root, "package.json"), "w") as file:
    file.write(json.dumps(dependencies, indent=4))

print(color("Installing npm dependencies...", 63))

process = subprocess.Popen(
    f"cd {args.root} && {NPM_INSTALL}",
    shell=True,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
process.wait()

print(color("Finished installing npm dependencies", 63))

message_queue = []

for folder, package in packages.items():
    subprocess.Popen(
        f'cd "{folder}" && {package["scripts"]["dev"]}',
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    plugin_folder = os.path.join(plugins_path, os.path.basename(folder))

    os.makedirs(plugin_folder, exist_ok=True)
    start_watch(
        folder,
        plugin_folder,
        on_copied=lambda src, dest: message_queue.append(copied_text(src, dest)),
        on_modified=lambda src, dest: message_queue.append(modified_text(src, dest)),
    )


try:
    while True:
        if message_queue:
            print(message_queue.pop(0))
except KeyboardInterrupt:
    print(color("Watch aborted", 16))
