from util.npm import clean, get_folders
from util.plugin import get_args
import os


args = get_args(path=True, root=True)

assert os.path.isdir(args.path), f'"{args.path}" is not a valid directory'
assert os.path.isdir(args.root), f'"{args.root}" is not a valid directory'

for folder in get_folders(args.path):
    clean(folder)


os.chdir(args.root)

if os.path.isfile("package.json"):
    os.remove("package.json")

if os.path.isfile("package-lock.json"):
    os.remove("package-lock.json")

if os.path.isdir("node_modules"):
    os.system("rd /s /q node_modules")
