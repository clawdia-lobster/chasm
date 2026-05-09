#!/usr/bin/env bash
# web-install.sh - Fetch and install Chasm via curl one-liner
#
# Usage: curl -sSL https://raw.githubusercontent.com/atisharma/chasm/main/web-install.sh | bash
#
# Clones the chasm repo to ~/.local/share/chasm/chasm/ and runs install.sh.

set -e

REPO_URL="${CHASM_REPO_URL:-https://github.com/atisharma/chasm.git}"
CHASM_DIR="${CHASM_DIR:-$HOME/.local/share/chasm/chasm}"

# Detect if already in a chasm repo
if [ -f .git/config ]; then
    if grep -q 'atisharma/chasm\|clawdia-lobster/chasm' .git/config; then
        CHASM_DIR=$(pwd)
        echo "Already in Chasm repo: $CHASM_DIR"
    fi
fi

# Clone if not found
if [ ! -d "$CHASM_DIR/.git" ]; then
    echo "Cloning Chasm to $CHASM_DIR..."
    mkdir -p "$(dirname "$CHASM_DIR")"
    git clone "$REPO_URL" "$CHASM_DIR"
else
    echo "Updating existing Chasm repo..."
    cd "$CHASM_DIR"
    git pull
fi

# Run the installer
cd "$CHASM_DIR"
exec ./install.sh "$@"
