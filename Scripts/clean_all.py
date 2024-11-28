from util.npm import clean, get_folders
import argparse
import os

parser = argparse.ArgumentParser(add_help=True)
parser.add_argument(
    "--path",
    type=str,
    help="Path to folder with obsidian plugins",
    default=os.path.abspath("./Plugins"),
    required=False,
)
parser.add_argument(
    "--root",
    type=str,
    help="Path to root folder where node_modules will be installed",
    default=os.path.abspath("."),
    required=False,
)


args = parser.parse_args()

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
