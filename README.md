# WebSite-Kit

An official [aurweb](https://gitlab.archlinux.org/archlinux/aurweb) / Arch Linux styled AUR static site generator for **Akaere's User Repo**, built with [Eleventy](https://www.11ty.dev/) running on [Deno](https://deno.com/).

All stylesheets, layout hierarchy, navigation bars, colors, and components strictly adhere to the official Arch Linux and AUR upstream design systems (`archweb.css`, `aurweb.css`, `archnavbar`).

## Project structure

```
WebSite-Kit/
├── .github/workflows/
│   └── deploy.yml            # GitHub Pages deployment workflow (Deno + Eleventy)
├── src/
│   ├── _includes/
│   │   └── base.njk          # Arch global navbar + subnav + footer layout
│   ├── _data/
│   │   ├── site.js           # Site metadata
│   │   ├── packages.json     # Package summary list (Docs/05 contract)
│   │   └── packageDetails/   # Individual package metadata & file lists (Docs/05 contract)
│   │       ├── asusctl.json
│   │       └── rog-control-center.json
│   ├── static/
│   │   ├── css/              # Upstream archweb.css, aurweb.css, archnavbar.css
│   │   ├── images/           # Favicon, SVG icons, logos
│   │   └── js/               # Upstream copy.js
│   ├── index.njk             # Homepage & package search/filter list (/)
│   └── packages/
│       ├── index.njk         # Package search page (/packages/)
│       └── detail.njk        # Package details & file viewer (/packages/<name>/)
├── eleventy.config.mjs       # Eleventy configuration, filters, and JSON passthroughs
└── deno.json                 # Deno tasks and dependencies
```

## Features

- **Arch & AUR Native Design**: Uses original Arch global navbar, logo, search criteria box, and `table.results` styling.
- **Interactive Search & Sort**: Real-time client-side search by Name, Package Base, or Maintainer with column sorting (Name, Votes, Popularity, Last Updated) and status filtering.
- **Package Details View**: Full AUR-style details table with Git clone URL (click-to-copy), Package Actions card, dependencies, reverse dependencies, sources, and detailed package files table (`bsdtar -tf` artifact outputs).
- **Public Data Endpoints**: Serves `packages.json`, `data/packages.json`, and `packageDetails/<name>.json` directly for CI PR previews (`diff-against-published.py`) and external API consumers.

## Usage

```sh
# Start local development server
deno task dev

# Build production static site into _site/
deno task build
```

## License and Attribution

- This project incorporates stylesheets (`archweb.css`, `aurweb.css`, `archnavbar.css`) and scripts (`copy.js`) derived from the official [aurweb](https://gitlab.archlinux.org/archlinux/aurweb) and [archweb](https://gitlab.archlinux.org/archlinux/archweb) projects, Copyright (C) 2004-2026 aurweb Development Team, licensed under the [GNU General Public License v2.0](LICENSE) (GPL-2.0).
- Icons in `src/static/images/` originate from the Open Iconic project, Copyright (c) 2014 Waybury, licensed under the [MIT License](src/static/images/ICON-LICENSE).
- The mascot logo used in this project is an independent custom creation for Akaere's User Repo.
