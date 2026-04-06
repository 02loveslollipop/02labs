#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/render-tex-diagrams.sh [--format svg|png|both] <figures-dir> [file1.tex file2.tex ...]

Examples:
  ./scripts/render-tex-diagrams.sh blog/zipped/figures
  ./scripts/render-tex-diagrams.sh --format both blog/the_horn/figures
  ./scripts/render-tex-diagrams.sh blog/zipped/figures deflate-fallback-flow.tex biham-kocher-attack.tex

Behavior:
  - Renders every .tex file in <figures-dir> except common.tex by default
  - Writes outputs next to the source .tex files
  - Removes <figures-dir>/common.tex after a successful render pass
  - Uses an ephemeral build directory that is removed on exit
  - Honors TECTONIC_BIN=/path/to/tectonic when tectonic is not on PATH
EOF
}

find_tectonic() {
  if [[ -n "${TECTONIC_BIN:-}" ]]; then
    if [[ -x "$TECTONIC_BIN" ]]; then
      printf '%s\n' "$TECTONIC_BIN"
      return 0
    fi
    echo "error: TECTONIC_BIN is set but not executable: $TECTONIC_BIN" >&2
    return 1
  fi

  if command -v tectonic >/dev/null 2>&1; then
    command -v tectonic
    return 0
  fi

  local candidate
  for candidate in \
    "$HOME/.cargo/bin/tectonic" \
    "$HOME/.local/bin/tectonic" \
    /usr/local/bin/tectonic
  do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  candidate="$(find /tmp -maxdepth 3 -type f -name tectonic 2>/dev/null | head -n 1 || true)"
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

format="svg"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --format)
      if [[ $# -lt 2 ]]; then
        echo "error: --format requires a value" >&2
        usage >&2
        exit 1
      fi
      format="$2"
      shift 2
      ;;
    --format=*)
      format="${1#*=}"
      shift
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

case "$format" in
  svg|png|both) ;;
  *)
    echo "error: unsupported format '$format' (expected svg, png, or both)" >&2
    exit 1
    ;;
esac

figures_dir="$1"
shift

if [[ ! -d "$figures_dir" ]]; then
  echo "error: directory not found: $figures_dir" >&2
  exit 1
fi

figures_dir="$(cd "$figures_dir" && pwd)"

tectonic_bin="$(find_tectonic)" || {
  echo "error: tectonic is required on PATH or in a known local toolchain location" >&2
  exit 1
}

if ! command -v pdftocairo >/dev/null 2>&1; then
  echo "error: pdftocairo is required on PATH" >&2
  exit 1
fi

tectonic_root="$(cd "$(dirname "$tectonic_bin")/.." && pwd)"
export LD_LIBRARY_PATH="$tectonic_root/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

build_dir="$(mktemp -d "${TMPDIR:-/tmp}/tex-diagrams-XXXXXX")"
trap 'rm -rf "$build_dir"' EXIT

declare -a tex_files=()

if [[ $# -gt 0 ]]; then
  for tex in "$@"; do
    if [[ "$tex" != *.tex ]]; then
      tex="${tex}.tex"
    fi
    tex_files+=("$tex")
  done
else
  shopt -s nullglob
  for tex_path in "$figures_dir"/*.tex; do
    tex_name="$(basename "$tex_path")"
    if [[ "$tex_name" == "common.tex" ]]; then
      continue
    fi
    tex_files+=("$tex_name")
  done
  shopt -u nullglob
fi

if [[ ${#tex_files[@]} -eq 0 ]]; then
  echo "error: no renderable .tex files found in $figures_dir" >&2
  exit 1
fi

cd "$figures_dir"

rendered=0
for tex in "${tex_files[@]}"; do
  if [[ ! -f "$tex" ]]; then
    echo "error: file not found in $figures_dir: $tex" >&2
    exit 1
  fi
  if [[ "$tex" == "common.tex" ]]; then
    continue
  fi

  base="${tex%.tex}"
  "$tectonic_bin" --outdir "$build_dir" "$tex"

  if [[ "$format" == "svg" || "$format" == "both" ]]; then
    pdftocairo -svg "$build_dir/$base.pdf" "$figures_dir/$base.svg"
  fi

  if [[ "$format" == "png" || "$format" == "both" ]]; then
    pdftocairo -png -singlefile "$build_dir/$base.pdf" "$figures_dir/$base"
  fi

  rendered=$((rendered + 1))
  echo "rendered $tex"
done

common_tex="$figures_dir/common.tex"
if [[ -f "$common_tex" ]]; then
  rm -f "$common_tex"
  echo "removed common.tex"
fi

echo "Rendered $rendered diagram(s) in $figures_dir"
