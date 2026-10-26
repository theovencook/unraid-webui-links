<?php
/* webui-links: reads settings and the Nginx Proxy Manager proxy host files.
 * NPM's files are only read, never written.
 */

function webui_links_cfg() {
  $cfg = @parse_ini_file('/usr/local/emhttp/plugins/webui-links/default.cfg') ?: [];
  $user = '/boot/config/plugins/webui-links/webui-links.cfg';
  if (is_file($user)) $cfg = array_merge($cfg, @parse_ini_file($user) ?: []);
  return $cfg;
}

// Map of "forward-host:forward-port" => "https://first-domain" for every NPM proxy host.
function webui_links_map($dir) {
  $map = [];
  if (!$dir || !is_dir($dir)) return $map;
  $files = glob(rtrim($dir, '/').'/*.conf') ?: [];
  natsort($files);
  foreach ($files as $file) {
    $conf = @file_get_contents($file);
    if ($conf === false) continue;
    if (!preg_match('/^\s*server_name\s+([^;]+);/m', $conf, $name)) continue;
    if (!preg_match('/set \$server\s+"?([^";\s]+)"?\s*;/', $conf, $server)) continue;
    if (!preg_match('/set \$port\s+(\d+)\s*;/', $conf, $port)) continue;
    $domain = preg_split('/\s+/', trim($name[1]))[0];
    $scheme = preg_match('/^\s*listen\s+(\[::\]:)?443\b/m', $conf) ? 'https' : 'http';
    $key = strtolower($server[1]).':'.$port[1];
    if (!isset($map[$key])) $map[$key] = "$scheme://$domain";
  }
  return $map;
}
?>
