#!/bin/python3


#!/bin/python3

import sys

def generate_nginx_config(routes_list):
    config_lines = [
        "",
        "# auto-generated routes",
        ""
    ]

    for route in routes_list:
        if route.endswith("/"):
            route = route[:-1]
        config_lines.append(f"    location = {route} {{")
        config_lines.append("        try_files $uri $uri/ /index.html;")
        config_lines.append("    }")
        config_lines.append("")  # Blank line for readability

    config_lines.append("")
    return "\n".join(config_lines)

if __name__ == "__main__":
    # Read routes from stdin, stripping any extra whitespace
    routes = [line.strip() for line in sys.stdin if line.strip()]
    nginx_config = generate_nginx_config(routes)
    print(nginx_config)
