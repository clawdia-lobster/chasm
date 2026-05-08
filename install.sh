#!/usr/bin/env bash
# Chasm install script.
# Usage: ./install.sh [--local] [--prefix PREFIX]
#
# Default behaviour:
#   If run as root: install system-wide to /usr/local
#   If run as user: install to ~/.local

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFIX=""
LOCAL=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --local) LOCAL="1"; shift ;;
        --prefix) PREFIX="$2"; shift 2 ;;
        --help)
            echo "Usage: ./install.sh [--local] [--prefix PREFIX]"
            echo ""
            echo "  --local           Install to ~/.local (default if not root)"
            echo "  --prefix PREFIX   Install to PREFIX/bin and PREFIX/share/chasm"
            exit 0
            ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

if [[ -n "$PREFIX" ]]; then
    true
elif [[ -n "$LOCAL" || $EUID -ne 0 ]]; then
    PREFIX="${HOME}/.local"
else
    PREFIX="/usr/local"
fi

BIN_DIR="${PREFIX}/bin"
SHARE_DIR="${PREFIX}/share/chasm"
TEMPLATE_SRC="${SCRIPT_DIR}/template"
CLI_SRC="${SCRIPT_DIR}/chasm-cli"

echo "Installing Chasm..."
echo "  prefix:  ${PREFIX}"
echo "  bin:     ${BIN_DIR}"
echo "  share:   ${SHARE_DIR}"
echo ""

# Dependency checks
die() { echo "Error: $*" >&2; exit 1; }

command -v git >/dev/null || die "git is required."
command -v npm >/dev/null || die "npm is required (install Node.js first)."
command -v python3 >/dev/null || die "python3 is required."

# Check Node version
NODE_VER="$(node -v | sed 's/^v//' 2>/dev/null || echo '0')"
if ! printf '%s\n18.0.0\n' "$NODE_VER" | sort -V -C; then
    die "Node.js 18+ is required. Found: ${NODE_VER}"
fi

# Check pi
echo "Checking pi..."
if command -v pi >/dev/null; then
    echo "  pi is already installed."
else
    echo "  pi not found. Installing via npm..."
    npm install -g @earendil-works/pi-coding-agent
    command -v pi >/dev/null || die "pi installation failed. Try: npm install -g @earendil-works/pi-coding-agent"
    echo "  pi installed."
fi

# Create directories
echo ""
echo "Creating directories..."
mkdir -p "$BIN_DIR" "$SHARE_DIR"

# Copy template
echo "Copying template..."
if [[ -d "$TEMPLATE_SRC" ]]; then
    rm -rf "${SHARE_DIR}/template"
    cp -r "$TEMPLATE_SRC" "${SHARE_DIR}/template"
else
    die "Template not found at ${TEMPLATE_SRC}"
fi

# Copy CLI
echo "Installing chasm CLI..."
cp "$CLI_SRC" "${BIN_DIR}/chasm-cli"
cp "${BIN_DIR}/chasm-cli" "${BIN_DIR}/chasm"
chmod +x "${BIN_DIR}/chasm"

# Ensure bin is on PATH
if [[ ":${PATH}:" != *":${BIN_DIR}:"* ]]; then
    echo ""
    echo "WARNING: ${BIN_DIR} is not on your PATH."
    echo "Add this to your shell profile (e.g. ~/.bashrc):"
    echo "  export PATH=\"${BIN_DIR}:\${PATH}\""
fi

echo ""
echo "Done."
echo ""
echo "Usage:"
echo "  chasm new GAME_NAME     -- scaffold a new game"
echo "  chasm play GAME_NAME    -- launch a game"
echo "  chasm list              -- list all games"
echo ""
echo "Before playing, configure a model in pi:"
echo "  pi /login               -- set up API providers"
echo ""
echo "Then run 'chasm play GAME_NAME' to begin."
