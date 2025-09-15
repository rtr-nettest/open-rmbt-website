Historic RTR-NetTest Website 2015-2025
======================================

This branch hosts the historic web page sources for ```www.netztest.at```. 
It is no longer maintained.

Requirements
------------

For building the website, the following tools are needed

  * NodeJS
  * NPM
  * Git


Building and running the Website
--------------------------------

1. Build

	```bash
	npm install
	node build netztest 
	```
	
	It is possible to live-rebuild changed sources by running
	
	```bash
	node build netztest watch
	```
	
2. Deploy

    Use the `build`-directory as the root directory for your
	webserver, e.g.	in conjunction with the `http-server` 
	node module (`npm install http-server -g`)
	
	```bash
	http-server build -p 8081
	```
	
	Now, the website is ready to use: <http://localhost:8081/en>

	For routing, the `.html` file extension is omitted. This can be done e.g. using a `.htaccess` file with the
	following content in the `build` folder.

    ```
    Options +Includes
	AddHandler server-parsed .html
	
	RewriteEngine On
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteRule (.*) $1.html [L]
	```

Get in Touch
------------

* [RTR-Netztest](https://www.netztest.at) on the web
