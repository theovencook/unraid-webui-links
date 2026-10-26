#!/usr/bin/env bash
# Builds archive/webui-links-<version>-noarch-1.txz from src/ and writes the version and MD5 into the .plg.
# Usage: scripts/build.sh [version]   (default version: today as YYYY.MM.DD)
set -euo pipefail
cd "$(dirname "$0")/.."

name=webui-links
version=${1:-$(date +%Y.%m.%d)}
plg="plugin/$name.plg"
pkg="archive/$name-$version-noarch-1.txz"

mkdir -p archive
rm -f "$pkg"
tar --owner=0 --group=0 --numeric-owner --mode='u=rwX,go=rX' --sort=name \
    -C src -cJf "$pkg" install usr
md5=$(md5sum "$pkg" | cut -d' ' -f1)

sed -i \
  -e "s|^<!ENTITY version   \"[^\"]*\">|<!ENTITY version   \"$version\">|" \
  -e "s|^<!ENTITY md5       \"[^\"]*\">|<!ENTITY md5       \"$md5\">|" \
  "$plg"

echo "Built $pkg"
echo "MD5 $md5"
