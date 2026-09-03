# Repository Guidelines

## Project Overview

**WebSite-Kit** is the static site generator and web frontend for **Akaere's User Repo** (`packages.pysio.online`), an Arch Linux package repository maintained by the `Akaere-s-Packages` organization. The site provides an official [aurweb](https://gitlab.archlinux.org/archlinux/aurweb) / Arch Linux styled catalog for searching, viewing, and discovering packages, while also hosting machine-readable public API endpoints.

### Ecosystem Integration
- **`Registry`**: Stores package source specifications and recipes (`.toml`).
- **`workflow-build-kit`**: Executes containerized builds (`makepkg`), package signing, and generates metadata.
- **`WebSite-Kit` (this repository)**: Ingests generated metadata to produce the public AUR-styled website and mirrors JSON data endpoints for CI PR previews (`diff-against-published.py`) and external API consumers.

---

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Data Sources (src/_data/)            │
│  • site.js                • packages.json              │
│  • stats.json             • updates.json               │
│  • packageDetails/<pkg>.json                           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      Eleventy 3.1.6 on Deno (deno task build)          │
│  • Layout inheritance: src/_includes/base.njk          │
│  • Pages: index.njk, packages/index.njk                │
│  • Pagination: packages/detail.njk (size: 1 per pkg)   │
│  • Filters: formatBytes, formatDate, numberFormat      │
│  • Passthroughs: static/, CNAME, JSON endpoints        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Static Output (_site/)                      │
│  ├── index.html                                        │
│  ├── packages/index.html & packages/<pkg>/index.html   │
│  ├── packages.json & data/packages.json (mirrored)     │
│  ├── packageDetails/<pkg>.json & data/packageDetails/  │
│  └── static/ (css, js, images) & CNAME                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       GitHub Pages Deployment (.github/workflows)      │
│         Published to https://packages.pysio.online      │
└────────────────────────────────────────────────────────┘
```

### Key Modules & Data Flow
1. **Global Data Cascade (`src/_data/`)**:
   - `site.js`: Dynamic site-wide metadata (`title`, `aurwebVersion: "18.0.0"`, `repoName: "akaere"`, `githubRepo`, `buildTime`).
   - `packages.json`: Summary array of all packages (`name`, `pkgbase`, `version`, `maintainer`, `last_updated`, `build_status`, `detail_url`).
   - `stats.json`: Repository aggregate metrics (`packages`, `updated_7_days`, `maintainers`).
   - `updates.json`: Ordered list of recent package releases displayed on the homepage dashboard.
   - `packageDetails/<pkg>.json`: Deep metadata per package (dependencies, optdepends, sources, files list, votes, licenses).

2. **Template Pagination & Detail Fallback**:
   - `src/packages/detail.njk` paginates over `packages` (size 1, alias `pkg`), generating `/packages/<pkg.name>/index.html`.
   - Uses progressive detail resolution:
     ```jinja2
     {% set details = packageDetails[pkg.name] or pkg %}
     ```
     If deep metadata exists in `packageDetails/<pkg>.json`, it is merged and preferred; otherwise, it falls back to summary metadata in `packages.json`.

3. **Dual API Contract & Post-Build Mirroring**:
   - External tools (such as `diff-against-published.py` in the `Registry` repo) consume both root-level and `/data/`-prefixed endpoints.
   - `eleventy.config.mjs` configures passthroughs for `packages.json` and `packageDetails/`, and implements an `eleventy.after` lifecycle hook that automatically mirrors them into `_site/data/`:
     - `_site/packageDetails/` ➔ `_site/data/packageDetails/`
     - `_site/packages.json` ➔ `_site/data/packages.json`

4. **Client-Side Interactivity**:
   - `src/packages/index.njk`: Embedded vanilla JS IIFE provides instant client-side multi-term keyword search across Name, Description, Package Base, and Maintainer, with status filtering (`all`, `published`, `failed`) and column sorting. State is synchronized to URL query parameters via `window.history.replaceState`.
   - `src/static/js/copy.js`: Click-to-copy handler intercepting `.copy` link clicks to copy Git clone URLs using `navigator.clipboard.writeText()`.

---

## Key Directories

| Directory | Purpose |
|---|---|
| `src/` | Site input directory processed by Eleventy. |
| `src/_data/` | Global data files ingested into the Eleventy data cascade. |
| `src/_data/packageDetails/` | Detailed per-package JSON manifests (one file per package name). |
| `src/_includes/` | Reusable layout templates (`base.njk`). |
| `src/packages/` | Package directory views: search table (`index.njk`) and dynamic detail pages (`detail.njk`). |
| `src/static/` | Static assets passed through directly to `_site/static/`. |
| `src/static/css/` | Upstream Arch Linux and AUR stylesheets (`archweb.css`, `aurweb.css`, `archnavbar/`, `cgit.css`). |
| `src/static/js/` | Client-side JavaScript utilities (`copy.js`). |
| `src/static/images/` | Icons (Open Iconic SVGs), branding logos, and favicon. |
| `_site/` | Build output directory generated by Eleventy (gitignored). |
| `.github/workflows/` | GitHub Actions workflow (`deploy.yml`) for automated deployment to GitHub Pages. |

---

## Development Commands

All tasks are executed via **Deno**. Do not invoke Node.js or npm directly.

```sh
# Start local development server with hot reload (serves at http://localhost:8080)
deno task dev

# Build production static site into _site/
deno task build

# Format check and linting (native Deno utilities)
deno fmt --check
deno lint

# Run Deno test runner (when tests are added)
deno test
```

---

## Code Conventions & Common Patterns

### 1. Template Conventions (Nunjucks)
- **Layout Inheritance**: Child templates declare layout in YAML front matter:
  ```yaml
  ---
  layout: base.njk
  title: "Packages"
  permalink: "packages/index.html"
  ---
  ```
- **Content Injection**: `src/_includes/base.njk` wraps page content inside `<div id="content">{{ content | safe }}</div>`.
- **Defensive Data Handling**:
  - Always provide fallbacks for missing keys:
    ```jinja2
    {{ details.pkgbase or details.name }}
    {{ details.maintainer or "Lilithya" }}
    ```
  - Guard arrays against `undefined` before length checks or loops:
    ```jinja2
    {% if (details.dependencies or []).length %}
      {% for dep in details.dependencies %}
        <li>...</li>
      {% else %}
        <li><em>None</em></li>
      {% endfor %}
    {% endif %}
    ```
- **Custom Template Filters** (defined in `eleventy.config.mjs`):
  - `formatBytes`: Formats byte counts into binary units (`B`, `KiB`, `MiB`, `GiB`, `TiB`). Returns empty string on invalid/null/NaN.
  - `formatDate`: Formats ISO timestamps to `YYYY-MM-DD HH:MM UTC`.
  - `numberFormat(decimals = 2)`: Formats numeric values to fixed decimal places (e.g. `{{ details.popularity | numberFormat(2) }}`).

### 2. Upstream AUR & Arch Markup Emulation
- Maintain strict fidelity with official AUR markup conventions:
  - **IDs**: `#archnavbar`, `#archnavbarmenu`, `#archdev-navbar`, `#pkgdetails`, `#pkginfo`, `#pkgdeps`, `#pkgreqs`, `#pkgfiles`, `#pkglist-search`.
  - **Classes**: `.box`, `.filter-criteria`, `.filter-row`, `.filter-group`, `.results` (`table.results`), `.pkg-row`.
  - **Search & Sort Query Parameters**:
    - `K`: Keyword string.
    - `SeB`: Search by (`nd` = Name/Description, `n` = Name, `b` = Package Base, `m` = Maintainer).
    - `SB`: Sort by (`n` = Name, `m` = Maintainer, `l` = Last Updated).
    - `SO`: Sort order (`a` = Ascending, `d` = Descending).
    - `status`: Build status filter (`all`, `published`, `failed`).
- **Strict Light-Theme Enforcement**: To ensure exact parity with upstream AUR styling, `base.njk` specifies `<meta name="color-scheme" content="light">` and enforces light theme variables.

### 3. Client-Side JavaScript Conventions
- **Zero Bundler / Vanilla JS**: Write standards-compliant ES6+ vanilla JavaScript; no external frameworks or compile steps.
- **Event Handling**: Wait for `DOMContentLoaded` or encapsulate in self-executing functions (IIFE).
- **HTML Data Attributes**: State and metadata are transferred from Nunjucks to client scripts via `data-*` attributes on table rows (e.g. `data-name`, `data-version`, `data-maintainer`, `data-updated`, `data-status`).
- **Non-Destructive URL Sync**: Use `window.history.replaceState()` to persist search/filter state without triggering page navigation.

### 4. Public API & Mirroring Invariants
- Whenever adding new public endpoints in `src/_data/`, ensure they are registered for passthrough copy in `eleventy.config.mjs`.
- Any JSON endpoints intended for external PR previews must be accessible at both root (`/<endpoint>.json`) and `/data/` (`/data/<endpoint>.json`). Maintain the post-build mirror hook in `eleventy.config.mjs`.

---

## Important Files

| File Path | Description |
|---|---|
| `deno.json` | Project configuration specifying task aliases (`dev`, `build`) and the `@11ty/eleventy` npm import. |
| `deno.lock` | Deno lockfile (version 5) locking all runtime dependencies and sub-dependencies. |
| `eleventy.config.mjs` | Primary Eleventy configuration: passthroughs, filters, directory mapping, and post-build data mirroring hook. |
| `CNAME` / `src/CNAME` | Custom domain definitions (`packages.pysio.online`) for GitHub Pages deployment. |
| `src/_includes/base.njk` | Global site layout containing the Arch Linux navigation header, container structure, and footer. |
| `src/index.njk` | Homepage template with quick search, package stats widget, and recent updates list. |
| `src/packages/index.njk` | Package catalog page with live client-side search, filtering, and table sorting. |
| `src/packages/detail.njk` | Dynamic package detail template paginated per package, rendering metadata, dependencies, and file listings. |
| `src/_data/site.js` | Site configuration providing repository links, title, aurweb version, and build timestamp. |
| `src/_data/packages.json` | Master package list used for catalog rendering, pagination, and external API consumption. |
| `src/_data/packageDetails/*.json` | Individual package deep metadata files containing file lists, dependencies, and source links. |
| `src/static/js/copy.js` | Click-to-copy clipboard utility for package Git clone commands. |
| `src/static/css/aurweb.css` | AUR-specific CSS styles for ribbons, badges, filter boxes, and table layouts. |
| `src/static/css/archweb.css` | Official Arch Linux stylesheet for grids, typography, and base containers. |
| `.github/workflows/deploy.yml` | CI/CD workflow deploying the compiled `_site` to GitHub Pages upon push to `main`. |

---

## Runtime/Tooling Preferences

- **Runtime**: **Deno** (v2.x) is the **required** runtime.
  - **Do NOT use Node.js or Bun**. There is no `package.json` or `node_modules/` directory in the repository.
  - Dependencies are declared via Deno's `imports` map in `deno.json` using npm specifiers:
    ```json
    {
      "imports": {
        "@11ty/eleventy": "npm:@11ty/eleventy@^3.1.6"
      }
    }
    ```
- **Permission Flags**: All Deno tasks execute with `deno run -A` (`--allow-all`) because Eleventy requires full filesystem, environment, and local network socket access for the development server.
- **Module System**: All JavaScript/MJS files must use standard ECMAScript Modules (`import` / `export`).

---

## Testing & QA

### Current Status
- There is currently no dedicated automated unit test suite (`deno test` runner) configured in `deno.json`.
- The repository relies on **compile-time static site validation** via Eleventy and interactive verification.

### Verification Strategy for AI Assistants & Contributors

1. **Compile-Time Build Verification**:
   - Run `deno task build` after any change to templates (`.njk`), data files (`.json`, `.js`), or build configs (`eleventy.config.mjs`).
   - Eleventy verifies template syntax, pagination resolution, filter invocations, and JSON parsing. A syntax error or broken filter will cause the build to fail with a non-zero exit code.

2. **Artifact Contract Verification**:
   - Verify that expected output files exist in `_site/` after running `deno task build`:
     - `_site/index.html`
     - `_site/packages/index.html`
     - `_site/packages/<pkg>/index.html` for each package in `src/_data/packages.json`
     - `_site/packages.json` AND `_site/data/packages.json`
     - `_site/packageDetails/<pkg>.json` AND `_site/data/packageDetails/<pkg>.json`
     - `_site/CNAME` containing `packages.pysio.online`

3. **Data Schema Integrity**:
   - When modifying or adding packages in `src/_data/packages.json` or `src/_data/packageDetails/<pkg>.json`:
     - Ensure valid JSON formatting.
     - Confirm required summary fields (`name`, `pkgbase`, `version`, `maintainer`, `last_updated`, `build_status`, `detail_url`).
     - Confirm deep detail fields if adding to `packageDetails/` (`licenses`, `dependencies`, `sources`, `files`).

4. **Interactive Browser Verification**:
   - Run `deno task dev` to inspect changes in a browser:
     - Verify filter criteria box and live keyword search in `/packages/`.
     - Verify column sorting (Name, Maintainer, Last Updated) and URL query parameter persistence.
     - Verify Git clone URL copy-to-clipboard button interaction (`copy.js`).
     - Verify light-theme visual consistency with upstream AUR.
