RTR-NetTest Website
===================

This repository hosts the web page sources for ```www.netztest.at```

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
	

Get in Touch
------------

* [RTR-Netztest](https://www.netztest.at) on the web
