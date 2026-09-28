# Repository Guidelines

## Project Overview
The static landing page for **Tervia**, a Tauri 2 desktop client for SSH, RDP, SFTP and port forwarding. It is served at `https://tervia.rendy.dev/` (from `og:url`). The app itself lives in the sibling repo `../tervia` (GitHub `rendyuwu/tervia`), and its About dialog links back here (`src/settings/sections/AboutSection.tsx`, `SITE_URL`).

There is no framework, no build step, no `package.json` and no dependencies. The site is three hand-written files plus `assets/`.

## Architecture & Data Flow
- `index.html`: a single page. It has a header/nav, a hero with an inline SVG "host tree", the main screenshot, then `.branches`, which holds one `<section class="branch" id="…">` per feature: `hosts`, `vault`, `ssh`, `forwards`, `sftp`, `rdp`, `sync`, `workspace`, `download`. After those come the footer and `<dialog class="viewer">`.
- There is an inline `<script>` in `<head>` that sets `data-theme="light"` on `<html>` before first paint if `localStorage["tervia-theme"] === "light"`. `main.js` loads with `defer`.
- `main.js` has three independent top-level blocks and no modules:
  1. **Downloads.** `detectOs()` returns `mac`, `linux`, `windows` or `null` (mobile and iPad give `null`). It relabels the hero `[data-primary]` button and adds `.is-yours` to `[data-os="…"]`. It then fetches `api.github.com/repos/rendyuwu/tervia/releases/latest`, matches `release.assets` against the `FILES` regexes and rewrites each `[data-file="<key>"]` link's `href`/`title`/`data-size`. It also fills `[data-version]` with the tag and `[data-primary-file]` with the file name and size. If the fetch fails, it does nothing (`.catch(() => {})`).
  2. **Theme toggle.** `[data-theme-toggle]` starts `hidden` and JS unhides it. The page is dark by default. Choosing light stores `tervia-theme=light`, and switching back to dark removes the key. `aria-pressed` means "dark is on".
  3. **Screenshot viewer.** A click on `.zoom` (an `<a>` pointing at the image file) opens `dialog.viewer` via `showModal()`. Clicking anywhere or pressing Esc closes it.
- **Progressive enhancement is the core pattern.** Every link works without JS: download links default to `https://github.com/rendyuwu/tervia/releases/latest`, and `.zoom` links open the raw image. Keep that property when adding behavior.

## Key Directories
- `assets/`: `logo.svg` (favicon plus header logo), `icon.png` (750×750, apple-touch and `og:image`), `fonts/recursive-latin.woff2` (the only font, variable, preloaded), `shots/*.webp` (shipped screenshots).
- `.omp/dev/*.png`: PNG originals of `assets/shots/*.webp` at the same sizes. Gitignored and not served.
- `.playwright-cli/`: old accessibility snapshots. Gitignored scratch, not tests.

## Development Commands
There is nothing to build, lint or install. Serve from the repo root, because the brand link uses the root-relative `href="/"`:
```bash
python3 -m http.server 4173   # then open http://127.0.0.1:4173/
```
The GitHub API is unauthenticated (60 requests/hour per IP). If it gets rate-limited, download links quietly stay on `releases/latest`, and that is expected.

## Code Conventions & Common Patterns
- **Formatting:** Prettier-like style with no config in the repo, so match it by hand: 2-space indent, double quotes, semicolons, trailing commas, lines of roughly 120 characters, self-closing void tags in HTML (`<meta … />`).
- **JS:** vanilla ES2020+ (`?.`, `for…of`, arrow functions, `const`). Elements are found with eager top-level `querySelector`s on `data-*` hooks. Use `data-*` attributes as the JS hooks, not styling classes (`.zoom` and `.viewer` are the only class hooks). Set untrusted strings with `textContent` (see `primaryFile.firstChild.textContent`), never through `innerHTML`. Wrap `localStorage` in `try {} catch {}`.
- **Comments** explain intent and browser quirks in full sentences (for example, Apple silicon reporting as Intel, or iPad reporting as a Mac). Keep that style.
- **CSS theming:** every colour token in `:root` is `light-dark(light, dark)`. The default `color-scheme: dark` is switched by `:root[data-theme="light"]`. **A new colour token must also be added to the `@supports not (color: light-dark(…))` fallback block** (dark values).
- **Font axes:** set per element through the custom properties `--mono: 0|1` and `--casl: 0|1`. The global `*` rule turns them into `font-variation-settings`. Do not write `font-variation-settings` directly. The `.mono` class switches to mono.
- **CSS layout:** plain descriptive class names (no BEM, no utilities), sections marked with `/* Header */`-style comments, `clamp()` for fluid sizing, two breakpoints (`max-width: 960px`, `640px`). The feature-tree geometry is driven by `.branches` variables (`--tx`, `--sw`, `--r`, `--gut`) that are redefined at 640px.
- **Motion:** all animation and smooth scrolling sit inside `@media (prefers-reduced-motion: no-preference)`.
- **CSS reads JS state:** `.platform.is-yours` shows the "Your system" label, and `.files a::after { content: attr(data-size) }` shows the file size.
- **Accessibility:** every section has `aria-labelledby` pointing at its `h2` id (`<id>-h`). Decorative SVGs get `aria-hidden`, informative ones get `role="img"` plus `<title>`. Screen-reader text uses `.sr`. Images need `alt` plus `width`/`height`, and below-the-fold images get `loading="lazy"`.
- **Copy:** English, plain and factual, with concrete claims and no hype. Limitations are stated openly (unsigned builds, FUSE, SmartScreen).

## Important Files
- `index.html`: all markup, meta/OG tags and the inline theme bootstrap script.
- `main.js`: `FILES` (asset key → filename regex), `DOWNLOAD_BASE`, `PLATFORMS` (OS → label and default file).
- `styles.css`: design tokens (`:root`), the dark fallback and all layout.

## Couplings That Break Silently
- `FILES` keys must match the `data-file` values (`mac-arm`, `mac-intel`, `appimage`, `deb`, `rpm`, `exe`), and each regex must match the release asset names produced by `../tervia` CI (`_aarch64.dmg`, `_x64.dmg`, `_amd64.AppImage`, `_amd64.deb`, `.x86_64.rpm`, `_x64-setup.exe`). Adding a platform or file means updating `FILES`, the `data-file` link and possibly `PLATFORMS`.
- `data-os` values must match the `detectOs()` return values.
- `main.js` assumes `[data-primary]`, `[data-primary-file]`, `[data-theme-toggle]` and `.viewer` exist. If one is missing, it throws and stops every block that runs after it.
- Do not hardcode versions or download URLs. `[data-version]` and the links are filled at runtime.
- To replace a screenshot, put the PNG in `.omp/dev/`, ship it as WebP in `assets/shots/`, and update the `<img>` `width`/`height` to the new size.

## Runtime/Tooling Preferences
- The only runtime is a browser. Don't add npm, a bundler, a framework, a CSS preprocessor or a CDN dependency. The only network request is the GitHub API call.
- Keep the file count as it is: behavior goes in `main.js`, styles in `styles.css`.

## Testing & QA
There are no automated tests, CI or coverage, and none are expected for this small page. Check changes by hand in a browser served as above:
- Dark and light theme both render, and the choice survives a reload.
- Download links resolve to real assets, and the `.is-yours` card and hero label match your OS.
- A screenshot opens and closes in the viewer.
- Layout holds at roughly 640px and 960px widths.
- With JS disabled, the links still work.
