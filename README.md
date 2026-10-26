# WebUI Links for Unraid

An Unraid plugin that makes each Docker container's **WebUI** menu entry open the container's
[Nginx Proxy Manager](https://nginxproxymanager.com/) domain (for example `https://immich.home.example.com`)
instead of `http://IP:PORT`, and adds a second menu entry, **WebUI (IP:port)**, that still opens the direct address.

It works on the Docker page (including FolderView folders that use the standard menu) and the Dashboard.

## How it works

- `include/links.php` reads Nginx Proxy Manager's proxy host files (`data/nginx/proxy_host/*.conf`) and builds
  a map of forward address (`192.168.1.10:8081`) to domain. The files are only read.
- `WebUILinks.page` (a `Buttons` page, so it loads on every page) writes that map into the page.
- `js/webui-links.js` wraps Unraid's `addDockerContainerContext`. When a container's resolved WebUI address
  matches a proxy host, the WebUI entry opens the domain (keeping the path, and rewriting host/port values in
  the query string, which noVNC needs) and the direct entry is added after it.
- Nothing about the containers changes: no template edits, no restarts. Uninstalling returns the stock menu.
- If a future Unraid release changes the menu code, the wrapper simply never matches and the stock menu shows.

New proxy hosts are picked up on the next page load. A container is matched only when its proxy host forwards to
the same IP and port that its WebUI resolves to.

## Settings

Settings → User Utilities → **WebUI Links**:

| Setting | Default |
|---|---|
| Enable | Yes |
| NPM proxy host folder | `/mnt/user/appdata/Nginx-Proxy-Manager-Official/data/nginx/proxy_host` |
| Direct entry label | `WebUI ({address})` |

Saved to `/boot/config/plugins/webui-links/webui-links.cfg`. The page also lists every proxy host it found.

## Layout

```
plugin/webui-links.plg                 plugin definition (version + MD5 filled in by the build)
src/install/slack-desc                 Slackware package description
src/usr/local/emhttp/plugins/webui-links/
  WebUILinks.page                      loads the map and script on every page
  WebUILinksSettings.page              settings page
  include/links.php                    settings + NPM proxy host reader
  js/webui-links.js                    menu wrapper
  default.cfg                          default settings
  README.md                            text shown on the Plugins page
archive/webui-links-<version>-noarch-1.txz  built package
scripts/build.sh                       builds the package and updates the .plg
tests/                                 node tests for the URL and menu logic
```

## Build and test

```bash
node --test tests/*.test.js
scripts/build.sh            # version defaults to today, e.g. 2026.10.26; pass 2026.10.26a for a same-day rebuild
```

Commit the new `archive/*.txz` together with the updated `plugin/webui-links.plg`.

## Install

From a public copy of this repository: Plugins → Install Plugin →
`https://raw.githubusercontent.com/theovencook/unraid-webui-links/main/plugin/webui-links.plg`

While the repository is private, copy `archive/webui-links-<version>-noarch-1.txz` to `/boot/config/plugins/webui-links/`
and run `plugin install /path/to/webui-links.plg` on the server. The plugin manager uses the package already on
the flash drive (it checks the MD5) instead of downloading it, and reinstalls it the same way at every boot.
"Check for updates" can't reach a private repository, so it will report an error until the repository is public.

## License

[MIT](LICENSE)
