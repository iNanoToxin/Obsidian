from util.npm import clean
import os
import sys


assert len(sys.argv) > 1, "path argument required"
assert os.path.isdir(sys.argv[1]), f'"{sys.argv[1]}" is not a valid directory'

clean(sys.argv[1])
