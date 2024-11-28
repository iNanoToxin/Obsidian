def color(string: str, color: int):
    return f"\033[38;5;{color}m{string}\033[0m"
    # return string
