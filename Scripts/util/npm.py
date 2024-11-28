from watchdog.events import FileSystemEventHandler, FileModifiedEvent
from watchdog.observers import Observer, ObserverType
from typing import List, Dict, Callable, Optional
from semver import VersionInfo
from util.color import color
import shutil
import json
import os
import filecmp


NPM_DEPS = ["dependencies", "devDependencies", "peerDependencies"]
NPM_INSTALL = "npm install --force"
FILES_TO_WATCH = ["main.js", "styles.css", "data.json", "manifest.json"]
FILES_TO_DELETE = ["main.js", "styles.css", "data.json", "package-lock.json"]


class FileCopier(FileSystemEventHandler):
    dest_path: str

    def __init__(
        self,
        dest_path: str,
        on_change: Optional[Callable[[str, str], None]] = None,
    ):
        super().__init__()
        self.dest_path = dest_path
        self.on_change = on_change

    def on_modified(self, event: FileModifiedEvent):
        file = os.path.basename(event.src_path)
        dest = os.path.join(self.dest_path, file)

        if file in FILES_TO_WATCH:
            if not os.path.isfile(dest) or not filecmp.cmp(event.src_path, dest):
                shutil.copy(event.src_path, self.dest_path)

                if self.on_change is not None:
                    self.on_change(event.src_path, self.dest_path)


def get_folders(path: str) -> List[str]:
    return [
        folder
        for dir in os.listdir(path)
        if os.path.isdir(folder := os.path.join(path, dir))
    ]


def get_package(path: str) -> Dict:
    package_path = os.path.join(path, "package.json")

    assert os.path.exists(package_path), f"package.json required in {color(path, 2)}"

    with open(package_path, "r") as file:
        return json.loads(file.read())


def get_packages(path: str) -> Dict[str, Dict]:
    return {folder: get_package(folder) for folder in get_folders(path)}


def combine_dependencies(*packages, func=max) -> Dict:
    combined = {}

    if len(packages) != 2:
        for package in packages:
            combined = combine_dependencies(combined, package)
    else:
        for dep_type in NPM_DEPS:
            deps1 = packages[0].get(dep_type)
            deps2 = packages[1].get(dep_type)

            if isinstance(deps1, dict) and isinstance(deps2, dict):
                dependencies = {}

                for dep in {*deps1.keys(), *deps2.keys()}:
                    dep1 = deps1.get(dep)
                    dep2 = deps2.get(dep)

                    if (
                        dep1
                        and dep2
                        and VersionInfo.is_valid(dep1)
                        and VersionInfo.is_valid(dep2)
                    ):
                        dependencies[dep] = func(dep1, dep2, key=VersionInfo.parse)
                    elif dep1 is not None:
                        dependencies[dep] = dep1
                    else:
                        dependencies[dep] = dep2

                combined[dep_type] = dependencies
            elif deps1 is not None:
                combined[dep_type] = deps1
            elif deps2 is not None:
                combined[dep_type] = deps2

    return combined


def start_watch(
    path: str,
    dest_path: str,
    *,
    on_copied: Optional[Callable[[str, str], None]] = None,
    on_modified: Optional[Callable[[str, str], None]] = None,
) -> ObserverType:
    for file in FILES_TO_WATCH:
        src = os.path.join(path, file)
        dest = os.path.join(dest_path, file)

        if os.path.isfile(src):
            if not os.path.isfile(dest) or not filecmp.cmp(src, dest):
                shutil.copy(src, dest)
                if on_copied:
                    on_copied(src, dest_path)

    event_handler = FileCopier(dest_path, on_modified)
    observer = Observer()
    observer.schedule(event_handler, path, event_filter=[FileModifiedEvent])
    observer.start()
    return observer


def copied_text(file_path: str, dest: str) -> str:
    return f"[{color(os.path.basename(dest), 173)}] {color("copied", 1)} {color(os.path.basename(file_path), 67)}"


def modified_text(file_path: str, dest: str) -> str:
    return f"[{color(os.path.basename(dest), 173)}] {color("modified", 132)} {color(os.path.basename(file_path), 67)}"


def clean(plugin_path: str):
    for file in FILES_TO_DELETE:
        if os.path.isfile(file_path := os.path.join(plugin_path, file)):
            os.remove(file_path)

    zip_file = os.path.join(plugin_path, f"{os.path.basename(plugin_path)}.zip")
    node_modules = os.path.join(plugin_path, "node_modules")

    if os.path.isfile(zip_file):
        os.remove(zip_file)

    if os.path.isdir(node_modules):
        os.system(f'rd /s /q "{node_modules}"')
