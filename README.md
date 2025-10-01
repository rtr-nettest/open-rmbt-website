# Open RMBT Website

This repository contains the Open Source of the web page for `www.netztest.at`.

The site has been in production since September 11, 2025. It replaced the original, no longer maintained
[JQuery site](https://github.com/rtr-nettest/open-rmbt-website/tree/jquerysite) which dates back to 2012.

More information and other components of Open RMBT can be found here: https://github.com/rtr-nettest/open-rmbt

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 18.2.12. Many thanks to
[Specure](https://specure.com/), especially [Polina](https://github.com/polylina) for the development of this code.

## Open Source License

This project is licensed under the terms of the Apache License 2.0. See the [LICENSE](LICENSE.txt) file for details.

## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Production server

Run `npm run start:prod` to launch a prod version of the application on a local server. The application will automatically open in the default browser and reload if you change any of the source files.

## Build

The code depends on  [rmbtws](https://github.com/rtr-nettest/rmbtws), this code is included as a submodule by executing
`git submodule update --init --recursive`. The GIT fingerprint of `rmbtws` can found on the website under [Options](https://www.netztest.at/en/options).

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Deployment

Information regarding the deployment of this page can be found under `/deployment`.

## Dependencies

Run `npm run compile-deps-info` to compile a list of the project's dependencies with such info as licenses and authors in `dependencies.json`.
