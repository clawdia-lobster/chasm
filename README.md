# Chasm

Filesystem-based text adventures for the terminal. Each world is a directory of
markdown files; a language model narrates your story through the [pi coding
harness](https://pi.dev).

## Install

Requires **Node.js 18+**, **npm**, **git**, and **Python 3**.

```bash
git clone https://github.com/clawdia-lobster/chasm.git
cd chasm
./install.sh --local
```

This copies `chasm` to `~/.local/bin` and installs the game template to
`~/.local/share/chasm/template/`. If `pi` is not on your PATH, the installer
will install it via npm.

**Before playing:** configure a model in pi:

```bash
pi /login
```

Chasm requires a model with tool-use support (function calling). Good choices
in 2026: DeepSeek V4 Pro, Qwen3.6, Sonnet 4.5 via OpenRouter.

## Quick Start

```bash
chasm new sunken-quarter
chasm play sunken-quarter
```

First launch triggers a short Q&A — title, setting, genre, tone, a unique rule,
and starting place. The narrator then drops you into the world.

Resume later: `chasm play sunken-quarter`.

## How It Works

A Chasm world is a **git repo** of markdown files. The narrator reads state,
interprets your commands, and writes the story back:

| File | What it holds |
|------|---------------|
| `memory/WORLD.md` | Setting, genre, prose style, rules |
| `memory/WORLD_STATE.md` | Time, weather, player pointer, quests |
| `memory/places/*.md` | Locations with exits and sensory detail |
| `memory/characters/*.md` | NPCs with motives, memories, inventory |
| `memory/items/*.md` | Portable objects with usage and provenance |
| `memory/events/*.md` | Append-only log of what happened |

Everything is visible. Everything is editable. Save in-world with:

```bash
bash bin/save "[narrative] what you did"
```

The narrator loads `memory/AGENTS.md` at session start — a spec defining narrative
voice, state-mutation rules, and the amnesia bootstrap. See `SPEC.md` for the
full system contract.

## Design a World

`chasm new` copies the template. To design a world manually, write
`memory/WORLD.md` — the design document — then create starting places and
characters. The rest emerges through play.

Key format specs live in the template itself:

- `memory/CHARACTERS.md` — character frontmatter and archetypes
- `memory/PLACES.md` — place format, coordinates, exits
- `memory/ITEMS.md` — item types and state transitions
- `memory/EVENTS.md` — classification and compaction strategy
- `memory/QUESTS.md` — quest stages and status tracking

A world workspace is self-contained. Distribute it as a git repository. Players
need only `pi` and the world files.

## Structure

```
chasm/                          # This repository (the system)
├── chasm                       # CLI — new, play, list
├── install.sh                  # System installer
├── template/                   # Skeleton game workspace
│   ├── settings.json           # Pi config (model, extensions)
│   ├── extensions/             # chasm-ui.ts (compact tool output)
│   ├── bin/                    # save script + bootstrap Q&A
│   └── memory/                 # Narrator spec + format docs
└── SPEC.md                     # Full system specification
```

Each instantiated game is:

```
~/.local/share/chasm/games/my-world/
├── settings.json
├── extensions/
├── bin/
└── memory/
    ├── WORLD.md
    ├── WORLD_STATE.md
    ├── places/
    ├── characters/
    ├── items/
    └── events/
```

## Troubleshooting

**Model not configured:** Run `pi /login` or edit `settings.json` manually.

**First launch shows placeholder text:** Run `chasm play` again; the bootstrap
runs only when `WORLD.md` is uninitialised.

**Permission denied on `chasm`:** Ensure `~/.local/bin` is on your PATH, or use
the full path.

## License

AGPL-3.0. See `LICENSE`.
