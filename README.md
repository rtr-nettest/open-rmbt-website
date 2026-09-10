# Open RMBT Website

This repository contains the Open Source of the web page for `www.netztest.at`.

The site has been in production since September 11, 2025. It replaced the original, no longer maintained
[JQuery site](https://github.com/rtr-nettest/open-rmbt-website/tree/jquerysite) which dates back to 2012.

More information and other components of Open RMBT can be found here: https://github.com/rtr-nettest/open-rmbt

This project uses [Angular CLI](https://github.com/angular/angular-cli). Many thanks to
[Specure](https://specure.com/), especially [Polina](https://github.com/polylina) for the development of this code.

## Open Source License

This project is licensed under the terms of the Apache License 2.0. See the [LICENSE](LICENSE.txt) file for details.

## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

`npm run start` launches **two** processes concurrently (see the `start` script): the Angular dev
server on port `4200`, and the backend proxy (`node proxy`) on port `3000` — see below.

## Backend proxy

During local development the app talks to a remote RMBT backend (control server, statistic server,
settings, map tiles). Calling that backend directly from `http://localhost:4200` fails: the browser
blocks the cross-origin requests, and the backend rejects requests whose `Origin`/`Referer` do not
match. `proxy.js` is a small Express server that sits in between and removes that friction.

How it works:

* It listens on `http://localhost:3000` (override with the `PORT` env var) and forwards every request
  to the backend host defined by the `host` constant in `proxy.js` (default `dev2.netztest.at`).
* On the way out it rewrites the `Host`, `Origin` and `Referer` headers so the backend accepts the
  request; on the way back it adds permissive `Access-Control-Allow-*` headers so the browser accepts
  the response.
* The app is wired to it through `src/environments/environment.ts`, where `api.baseUrl` is
  `http://localhost:3000`. So the browser only ever talks to the proxy (same-origin-ish), and the
  proxy talks to the real backend.

Usage:

* Normally you do **not** start it separately — `npm run start` already runs it alongside `ng serve`.
* To run it on its own: `node proxy` (optionally `PORT=3001 node proxy`).
* Browse the app at `http://localhost:4200/`, **not** at `http://localhost:3000/` — port 3000 is the
  API proxy, and opening it directly just forwards you to the backend site (which may be password
  protected).

Pointing at a different backend:

* Edit the `host` constant at the top of `proxy.js` (e.g. change `dev2.netztest.at` to another RMBT
  environment) and restart the proxy.
* The environment that a `ng serve --configuration=<env>` run targets is instead controlled by the
  matching `src/environments/environment.<env>.ts` (those set `api.baseUrl` to a real host and bypass
  the proxy). The proxy only matters for the default `npm run start` / `environment.ts` setup.

## Production server

Run `npm run start:prod` to launch a prod version of the application on a local server. The application will 
automatically open in the default browser and reload if you change any of the source files.

## Build

The code depends on [rmbtws](https://github.com/rtr-nettest/rmbtws), included as a git submodule. It is
initialised automatically on `npm install` (via the `preinstall` hook). Its compiled `dist/` is **not
committed** — instead the `postinstall` hook builds it locally with `npm run build:rmbtws`
(`cd rmbtws && npm install && npm run build`). A fresh `npm install` therefore produces `rmbtws/dist`
before any Angular build.

If you change the rmbtws sources during local development, rebuild the submodule with:

```
npm run build:rmbtws
```

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

The semantic version of both the web page and rmbtws is derived from their git tags (`git describe --tags`)
at build time and shown on the website under [Options](https://www.netztest.at/en/options), alongside the
git branch and commit fingerprint.

## Prerender routes

Deployment needs a plain list of all routes (every path × every i18n locale) to configure
server-side routing. This list is generated from the `ERoutes` enum and the locale files in
`src/assets/i18n/`, and is not committed — it is a build artifact you might produce on demand:

```
npm run set-prerender-routes
```

This writes `src/prerender-routes.txt`. Deployment then consumes it (see `/deployment`), e.g.:

```
cat src/prerender-routes.txt | python deployment/make_routes_config.py
```

Regenerate it whenever you add or change a route or a locale. It is not used by `ng build`.

## Deployment

Information regarding the deployment of this page can be found under `/deployment`.

## Dependencies

Run `npm run compile-deps-info` to compile a list of the project's dependencies with such info as licenses and authors in `dependencies.json`.

### Installing and updating the lockfile

`package-lock.json` is committed and must always be **in sync** with `package.json`.

* **Normal install (CI and reproducible local installs):** `npm ci`. It installs strictly
  from `package-lock.json` and **never modifies it**, so the working tree stays clean and the
  git-tag version is not falsely reported as `-dirty`. This is what the GitHub workflow runs.
  It fails fast if the lockfile is out of sync with `package.json`.

* **Intentionally changing dependencies** (adding, removing or bumping a package, or changing an
  entry under `overrides`):
  1. Edit `package.json`.
  2. Run `npm install` — this updates both `node_modules` and `package-lock.json` (and runs the
     `postinstall` rmbtws build). To refresh only the lockfile without a full install, use
     `npm install --package-lock-only`.
  3. Commit `package.json` **and** `package-lock.json` **together** in the same commit. Committing
     one without the other leaves the lockfile out of sync and breaks `npm ci` in CI.

Note: the rmbtws submodule is a local file dependency pinned to the placeholder version
`0.0.0-dev` (its real version is derived from its git tag at build time), so bumping rmbtws does
**not** require a lockfile update.
