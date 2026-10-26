# WebUI Links for Unraid

An Unraid plugin for people who reach their containers through [Nginx Proxy Manager](https://nginxproxymanager.com/).
Clicking WebUI on a container opens its proxy domain (for example `https://immich.home.example.com`) instead of
`http://IP:PORT`. A second menu entry, "WebUI (IP:port)", still opens the direct address for when the proxy is down.

It works on the Docker page, including FolderView3 folders that use the standard menu, and on the Dashboard.

## How it works

- `include/links.php` reads Nginx Proxy Manager's proxy host files (`data/nginx/proxy_host/*.conf`) and builds
  a map from forward address (`192.168.1.10:8081`) to domain. It never writes to them.
- `WebUILinks.page` is a `Buttons` page, so Unraid loads it on every page. It writes that map into the page.
- `js/webui-links.js` wraps Unraid's `addDockerContainerContext`. When a container's WebUI address matches a
  proxy host, the WebUI entry opens the domain and the direct entry is added after it. The path is kept, and host
  and port values in the query string are switched to the domain, which noVNC needs.
- Containers aren't touched: no template edits, no restarts. Uninstalling gives you the stock menu back.
- If a future Unraid release changes the menu code, the wrapper stops matching and the stock menu shows.

New proxy hosts show up on the next page load. A container only matches when its proxy host forwards to the same
IP and port its WebUI uses.

## Settings

Settings → User Utilities → WebUI Links:

| Setting | Default |
|---|---|
| Enable | Yes |
| NPM proxy host folder | `/mnt/user/appdata/Nginx-Proxy-Manager-Official/data/nginx/proxy_host` |
| Direct entry label | `WebUI ({address})` |

Settings are saved to `/boot/config/plugins/webui-links/webui-links.cfg`. The page also lists every proxy host
it found.

## Install

Go to Plugins → Install Plugin and paste:

```
https://raw.githubusercontent.com/theovencook/unraid-webui-links/main/plugin/webui-links.plg
```

It has also been submitted to Community Applications and will show up there once it's reviewed.

To install without internet access, copy `archive/webui-links-<version>-noarch-1.txz` to
`/boot/config/plugins/webui-links/` and run `plugin install /path/to/webui-links.plg` on the server. The plugin
manager checks the MD5 and uses the package on the flash drive instead of downloading it.

## Support

Questions and bug reports: the [Unraid forum thread](https://forums.unraid.net/topic/201057-plugin-webui-links-open-container-webuis-through-nginx-proxy-manager/) or [GitHub issues](https://github.com/theovencook/unraid-webui-links/issues).

## Layout

```
plugin/webui-links.plg                 plugin definition (version and MD5 filled in by the build)
plugins/webui-links.xml                Community Applications listing
ca_profile.xml                         Community Applications repository profile
icon.svg                               icon for Community Applications
src/install/slack-desc                 Slackware package description
src/usr/local/emhttp/plugins/webui-links/
  WebUILinks.page                      loads the map and script on every page
  WebUILinksSettings.page              settings page
  include/links.php                    settings and NPM proxy host reader
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

## License

[MIT](LICENSE)
