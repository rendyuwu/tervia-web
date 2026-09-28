# tervia-web

Landing page for [Tervia](https://github.com/rendyuwu/tervia), a desktop client for SSH, RDP, SFTP and port forwarding.

Live at <https://tervia.rendy.dev/>.

Looking for the app, releases or issues? Go to [rendyuwu/tervia](https://github.com/rendyuwu/tervia).

## Local preview

Plain HTML, CSS and JS with no build step. Serve the repo root:

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>. Download links resolve to the latest [release](https://github.com/rendyuwu/tervia/releases/latest) through the GitHub API when the page loads.
