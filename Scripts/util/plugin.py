import argparse
import os


def get_args(
    *,
    path: bool = False,
    root: bool = False,
    vault: bool = False,
):
    parser = argparse.ArgumentParser(add_help=True)

    if path:
        parser.add_argument(
            "--path",
            type=str,
            help="Path to folder with obsidian plugins",
            default=os.path.abspath("./Plugins"),
            required=False,
        )

    if root:
        parser.add_argument(
            "--root",
            type=str,
            help="Path to root folder where node_modules will be installed",
            default=os.path.abspath("."),
            required=False,
        )

    if vault:
        parser.add_argument(
            "--vault",
            type=str,
            help="Path to obsidian vault",
            required=True,
        )

    return parser.parse_args()
