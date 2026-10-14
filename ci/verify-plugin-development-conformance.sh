#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"
command -v rg >/dev/null 2>&1 || { echo '[verify-plugin-development-conformance] ripgrep is required' >&2; exit 1; }

failed=0
report_matches() {
  label=$1
  pattern=$2
  shift 2
  matches=$(rg -n --no-messages "$pattern" "$@" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "[verify-plugin-development-conformance] ${label}" >&2
    echo "$matches" >&2
    failed=1
  fi
}

echo "[verify-plugin-development-conformance] checking shared frontend UI contracts"
for package_json in yudream-frontend/packages/plugin-*/package.json; do
  [ -f "$package_json" ] || continue
  # Native React Native UI has a separate adapter contract and does not use Vue components.
  case "$package_json" in
    */plugin-mobile-ui/package.json|*/plugin-*-mobile/package.json) continue ;;
  esac
  if ! grep -q '"@yudream/components"' "$package_json"; then
    echo "[verify-plugin-development-conformance] missing @yudream/components: $package_json" >&2
    failed=1
  fi
done

node --test yudream-frontend/scripts/brand-token-scanner.test.mjs || failed=1
node yudream-frontend/scripts/audit-ui.mjs --baseline || failed=1

report_matches \
  "personal HTTP flows must not gain cross-user scope from management permission" \
  'hasPermission\([^)]*MANAGE_PERMISSION' \
  yudream-plugins -g '*HttpFacade.java'

# src/pages/admin/** is the admin surface layer (repo rule): the canManage scan
# below exempts that directory and code review owns its route/permission wiring.
# The only automated check here is path-based: pages under src/pages/admin must
# not contain user-side /me or /my API path literals.
report_matches \
  "personal frontend flows must not switch datasets based on management permission" \
  'v-if="[^"]*canManage|canManage\.value[[:space:]]*\?[[:space:]]*load|if[[:space:]]*\(canManage\.value\)' \
  yudream-frontend/packages -g '*.ts' -g '*.vue' -g '!**/src/pages/admin/**'

admin_page_dirs=$(find yudream-frontend/packages -type d -path '*/src/pages/admin' 2>/dev/null || true)
for admin_dir in $admin_page_dirs; do
  me_hits=$(rg -n --no-messages "['\"\`]/?(me|my)/" "$admin_dir" -g '*.vue' -g '*.ts' 2>/dev/null || true)
  if [ -n "$me_hits" ]; then
    echo "[verify-plugin-development-conformance] admin pages must not call /me or /my user-side APIs" >&2
    echo "$me_hits" >&2
    failed=1
  fi
done

report_matches \
  "personal API paths must use /me instead of /my" \
  'path[[:space:]]*=[[:space:]]*"/my|`/my/' \
  yudream-plugins yudream-frontend/packages -g '*.java' -g '*.ts'

if [ "$failed" -ne 0 ]; then
  echo "[verify-plugin-development-conformance] FAILED" >&2
  exit 1
fi

echo "[verify-plugin-development-conformance] OK"
