/* webui-links: make a container's WebUI open its Nginx Proxy Manager domain,
 * and add a second menu entry that still opens the direct IP:port address.
 * The map ("ip:port" -> "https://domain") is written into the page by WebUILinks.page.
 */
(function (root) {
  'use strict';

  // Returns {proxied, direct, address} for a resolved WebUI URL, or null when no proxy host matches.
  function proxiedLinks(webui, map) {
    var url;
    try { url = new URL(webui); } catch (e) { return null; }
    var port = url.port || (url.protocol === 'https:' ? '443' : '80');
    var address = url.hostname.toLowerCase() + ':' + port;
    var target = map && map[address];
    if (!target) return null;

    var base = new URL(target);
    var basePort = base.port || (base.protocol === 'https:' ? '443' : '80');
    // Some WebUIs (noVNC) repeat the host and port in the query string; point those at the proxy too.
    var search = url.search.replace(/([?&][^=&]+=)([^&]*)/g, function (m, key, value) {
      if (value === url.hostname) return key + base.hostname;
      if (value === port) return key + basePort;
      return m;
    });
    return {proxied: base.origin + url.pathname + search + url.hash, direct: webui, address: address};
  }

  // Points the WebUI entry at the proxy and inserts the direct entry right after it.
  function rewriteMenu(opts, links, labelTemplate) {
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].icon !== 'fa-globe') continue;
      opts[i] = Object.assign({}, opts[i], {action: opener(links.proxied)});
      opts.splice(i + 1, 0, {
        text: String(labelTemplate || 'WebUI ({address})').replace('{address}', links.address),
        icon: 'fa-sitemap',
        action: opener(links.direct)
      });
      return true;
    }
    return false;
  }

  function opener(url) {
    return function (e) { e.preventDefault(); root.open(url, '_blank'); };
  }

  function install() {
    var cfg = root.webuiLinks;
    var original = root.addDockerContainerContext;
    if (!cfg || typeof original !== 'function' || original.webuiLinks || !root.context) return false;

    var wrapped = function (container, image, template, started, paused, update, autostart, webui) {
      var links = proxiedLinks(webui, cfg.map);
      if (!links) return original.apply(this, arguments);
      var attach = root.context.attach;
      root.context.attach = function (selector, opts) {
        rewriteMenu(opts, links, cfg.directLabel);
        return attach.apply(this, arguments);
      };
      try { return original.apply(this, arguments); }
      finally { root.context.attach = attach; }
    };
    wrapped.webuiLinks = true;
    root.addDockerContainerContext = wrapped;
    return true;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {proxiedLinks: proxiedLinks, rewriteMenu: rewriteMenu, install: install};
    return;
  }
  // docker.js may load after this script, so try now and again once the page is ready.
  if (!install() && root.jQuery) root.jQuery(install);
})(typeof window !== 'undefined' ? window : globalThis);
