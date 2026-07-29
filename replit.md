# Go Lana – Free Online Tools

A pre-built React SPA for [golana.online](https://golana.online) — a browser-based utility hub with PDF tools, media tools, calculators, everyday utilities, AI mini tools, and developer tools.

## Stack

- React (pre-built, no build step needed)
- Compiled output: `index.html` + `assets/`

## Running the project

```bash
python3 -m http.server 5000
```

The workflow **Start application** is configured to run this automatically. The app is served at port 5000.

## Project structure

| Path | Purpose |
|------|---------|
| `index.html` | App entry point |
| `assets/` | Compiled JS and CSS bundles |
| `favicon.svg` | Site favicon |
| `404.html` | Custom 404 page |
| `lib/` | Source library packages (api-spec, api-zod, db, api-client-react) |
| `artifacts/` | Build artifacts (api-server, mockup-sandbox, tudoin1) |

## User preferences

_None recorded yet._
