# Deployment

This directory contains information regarding the deployment of the web page.

The information presented here is (partly) specific to RTR's setup at https://www.netztest.at.

## Nginx

We use nginx to serve the static web pages. Thus: NodeJS is required to build the pages, 
but not to serve.

The website is a single page application, thus all "pages" are actually served from a single location.
Using `prerender-routes.txt` from `https://raw.githubusercontent.com/rtr-nettest/open-rmbt-website/refs/heads/master/src/prerender-routes.txt`
a configuration for the pages is created using the Python script `make_routes_config.py` (yes, one could also use NodeJS for this,
but the admin's prefer Python for this task). 

The output of this script shall be integrated into the site configuration, on Debian located at `/etc/nginx/sites-available`.




