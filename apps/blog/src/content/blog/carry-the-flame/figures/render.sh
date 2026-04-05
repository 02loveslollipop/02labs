#!/usr/bin/env bash
set -euo pipefail

if ! command -v tectonic >/dev/null 2>&1; then
  echo "error: tectonic is required on PATH" >&2
  exit 1
fi

if ! command -v pdftocairo >/dev/null 2>&1; then
  echo "error: pdftocairo is required on PATH" >&2
  exit 1
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/carry-flame-figures-XXXXXX")
trap 'rm -rf "$build_dir"' EXIT

cd "$script_dir"

tectonic --outdir "$build_dir" spn-structure.tex
pdftocairo -svg "$build_dir/spn-structure.pdf" "$script_dir/spn-structure.svg"

echo "Rendered spn-structure.svg into $script_dir"
