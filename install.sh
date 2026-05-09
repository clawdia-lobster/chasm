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
CLI_SRC="${SCRIPT_DIR}/chasm"

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

# Create user gaming config if it doesn't exist
USER_CONFIG="${SHARE_DIR}/models.json"
TEMPLATE_CONFIG="${SHARE_DIR}/template/models.json"
if [[ ! -f "$USER_CONFIG" ]]; then
    echo "Creating user gaming config..."
    cp "$TEMPLATE_CONFIG" "$USER_CONFIG"
else
    echo "User gaming config already exists."
fi

# Copy CLI
echo "Installing chasm CLI..."
cp "$CLI_SRC" "${BIN_DIR}/chasm"
chmod +x "${BIN_DIR}/chasm"

# Ensure bin is on PATH
if [[ ":${PATH}:" != *":${BIN_DIR}:"* ]]; then
    # Detect the user's shell profile file
    profile_file=""
    case "${SHELL:-}" in
        */zsh)  profile_file="${HOME}/.zshrc" ;;
        */bash) profile_file="${HOME}/.bashrc" ;;
        *)      profile_file="${HOME}/.profile" ;;
    esac

    echo ""
    echo "${BIN_DIR} is not on your PATH."
    read -r -p "Add it to ${profile_file}? [Y/n] " answer
    case "${answer,,}" in
        n|no)
            echo "Skipped. Add this line to your shell profile manually:"
            echo "  export PATH=\"${BIN_DIR}:\${PATH}\""
            ;;
        *)
            echo "export PATH=\"${BIN_DIR}:\${PATH}\"" >> "${profile_file}"
            echo "Added to ${profile_file}. Run 'source ${profile_file}' or open a new terminal."
            ;;
    esac
fi

echo ""
echo "Done."
echo ""
echo "Usage:"
echo "  chasm new GAME_NAME     -- scaffold a new game"
echo "  chasm play GAME_NAME    -- launch a game"
echo "  chasm list              -- list all games"
echo ""
echo "Before playing:"
echo "  1. Configure a model provider in pi:  pi /login"
echo "  2. Edit gaming models (optional):     ${USER_CONFIG}"
echo ""
echo "Then run 'chasm play GAME_NAME' to begin."
