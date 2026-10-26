// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const {proxiedLinks, rewriteMenu} = require('../src/usr/local/emhttp/plugins/webui-links/js/webui-links.js');

const map = {
  '192.168.1.10:8081': 'https://metube.home.example.com',
  '192.168.1.10:32400': 'https://plex.home.example.com',
  '192.168.1.10:6080': 'https://krusader.home.example.com',
  '192.168.1.10:81': 'https://npm.home.example.com'
};

test('maps a plain WebUI to its proxy domain', () => {
  assert.deepStrictEqual(proxiedLinks('http://192.168.1.10:8081', map), {
    proxied: 'https://metube.home.example.com/',
    direct: 'http://192.168.1.10:8081',
    address: '192.168.1.10:8081'
  });
});

test('keeps the path', () => {
  assert.strictEqual(proxiedLinks('http://192.168.1.10:32400/web', map).proxied, 'https://plex.home.example.com/web');
});

test('rewrites host and port repeated in the query string', () => {
  const links = proxiedLinks('http://192.168.1.10:6080/vnc.html?resize=remote&host=192.168.1.10&port=6080&autoconnect=1', map);
  assert.strictEqual(links.proxied, 'https://krusader.home.example.com/vnc.html?resize=remote&host=krusader.home.example.com&port=443&autoconnect=1');
});

test('returns null when no proxy host matches', () => {
  assert.strictEqual(proxiedLinks('http://192.168.1.10:18888/', map), null);
  assert.strictEqual(proxiedLinks('', map), null);
  assert.strictEqual(proxiedLinks('#', map), null);
});

test('uses the default port when the WebUI has none', () => {
  assert.strictEqual(proxiedLinks('http://192.168.1.10/', {'192.168.1.10:80': 'https://x.example'}).proxied, 'https://x.example/');
});

test('menu: WebUI gets the proxy URL and the direct entry follows it', () => {
  const opened = [];
  global.window = {open: (url) => opened.push(url)};
  const {rewriteMenu: rewrite} = loadFresh();
  const opts = [
    {text: 'WebUI', icon: 'fa-globe', action: () => opened.push('original')},
    {text: 'Console', icon: 'fa-terminal'},
    {divider: true}
  ];
  const links = proxiedLinks('http://192.168.1.10:81', map);
  assert.strictEqual(rewrite(opts, links, 'WebUI ({address})'), true);
  assert.deepStrictEqual(opts.map(o => o.text), ['WebUI', 'WebUI (192.168.1.10:81)', 'Console', undefined]);
  const e = {preventDefault() {}};
  opts[0].action(e);
  opts[1].action(e);
  assert.deepStrictEqual(opened, ['https://npm.home.example.com/', 'http://192.168.1.10:81']);
  delete global.window;
});

test('menu: left alone when there is no WebUI entry (stopped container)', () => {
  const opts = [{text: 'Start', icon: 'fa-play'}];
  assert.strictEqual(rewriteMenu(opts, proxiedLinks('http://192.168.1.10:81', map), ''), false);
  assert.strictEqual(opts.length, 1);
});

// Loads the script again so it binds to the stubbed global window.
function loadFresh() {
  const path = require.resolve('../src/usr/local/emhttp/plugins/webui-links/js/webui-links.js');
  delete require.cache[path];
  return require(path);
}
