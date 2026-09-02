# WebSite-Kit

A pure [Eleventy](https://www.11ty.dev/) static site running on [Deno](https://deno.com/).

## Project structure

```
src/
├── _data/site.js   # Global data — filename becomes the template variable (e.g. site.title)
└── index.html      # Page template
eleventy.config.mjs  # Eleventy config (input/output dirs, etc.)
```

## Usage

```sh
deno task dev    # Start the dev server with live reload, default http://localhost:8080
deno task build  # Build the static site into _site/
```

## Requirements

- Deno 2.x
