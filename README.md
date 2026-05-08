# Chasm

Text adventures for humans who dream in prose. Each game is a living world of
markdown files, narrated by an AI agent through the [pi coding harness](https://pi.dev).

For the full system specification, see [SPEC.md](SPEC.md).

## Install

```bash
# Clone the repository
git clone https://github.com/clawdia-lobster/chasm.git
cd chasm

# Install pi (if not already)
npm install -g @earendil-works/pi-coding-agent

# Install Chasm
./install.sh --local
```

## Quick Start

```bash
# Create your first world
chasm new sunken-quarter

# Launch it (first run boots with a Q&A)
chasm play sunken-quarter
```

## How It Works

Each game is a **workspace** — a directory of markdown files that the narrator
reads and edits as the story unfolds:

- `memory/WORLD.md` — setting, genre, prose style
- `memory/WORLD_STATE.md` — time, weather, active quests
- `memory/places/*.md` — locations with exits and atmosphere
- `memory/characters/*.md` — NPCs with motives and memories
- `memory/items/*.md` — objects with stories
- `memory/events/*.md` — what happened, append-only

Everything is in git. Save with `bash bin/save "[narrative] what you did"`.

## Configure a Model

Chasm requires a language model. Run `pi /login` in any pi session to set up
providers (OpenRouter, Moonshot, etc.), or edit `settings.json` in your game
directory directly.

Sensible defaults for 2026:

- **Provider:** OpenRouter (pay-per-use, broad model access)
- **Models:** DeepSeek V4 Pro, Qwen3.6, or Sonnet 4.5

The model must support tool use (function calling) for state mutation.

## Design a New Game

The `chasm` CLI handles scaffolding. To design manually:

1. Copy the `template/` directory.
2. Edit `memory/WORLD.md` — your design document.
3. Create starting places and characters.
4. Ensure `memory/WORLD_STATE.md` points to the right starting place.

See [SPEC.md](SPEC.md) for the full bootstrap and format specifications.

## Distribution

A game workspace is a self-contained git repository. Players need only:

```bash
git clone https://github.com/you/my-world.git
cd my-world && pi
```

## Structure

```
chasm/                          # This repository (the system)
├── chasm                       # CLI script (new, play, list)
├── install.sh                  # System installer
├── template/                   # Skeleton game workspace
│   ├── settings.json           # Pi configuration
│   ├── extensions/             # UI tweaks
│   ├── bin/                    # save + bootstrap
│   └── memory/                 # Narrator spec + format docs
└── SPEC.md                     # Full specification
```

## License

Placeholder. (To be determined.)
