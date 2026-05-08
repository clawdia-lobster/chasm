# Specification: Chasm Game System

A filesystem-based text adventure engine built on the pi coding agent. Each game is a self-contained workspace of markdown state files; the system provides templating, launching, and distribution.

## Problem

### Context
The current game ("The Sunken Quarter") is hardcoded in a single pi agent workspace at `/pi/chasm`. A player has one world, one session, and no defined way to create a second.

### Symptoms
- No template exists for starting a new game. Creating one requires manually duplicating and scrubbing the current workspace.
- No launch script validates working directory and environment before starting pi.
- No install script handles dependency checks (pi present?) or respects XDG directories.
- No first-run bootstrap: a new workspace launched as-is would confuse the narrator with an empty or partially-initialised world.
- No distribution method exists for sharing games or the engine itself with other players.

### Impact
Ati cannot design new games, run multiple campaigns, or share the system with anyone else without ad-hoc manual steps.

### Current Workaround
Copy `/pi/chasm` by hand, delete all Sunken Quarter content from `memory/`, then manually write `WORLD.md` and `WORLD_STATE.md` from scratch.

### Success Criteria
- A new game can be scaffolded in one command.
- Multiple games can coexist without collision.
- First launch of a new game interactively bootstraps the world.
- Installation is one command that checks dependencies and respects XDG.
- The system can be distributed as a git repository or npm-like package.

## Solution

### Approach
Treat each game as an independent pi agent workspace. Provide a CLI (`chasm`) that handles installation, scaffolding, and launching. A template directory provides the skeleton. First-run bootstrap generates `WORLD.md` via a short user interview, then launches pi.

### Key Concepts

- **Workspace**: A single pi agent directory (e.g. `~/Games/milliways`). Contains `memory/`, `settings.json`, `extensions/`, `bin/save`.
- **Template**: A clean, content-free skeleton workspace stored at a well-known path. Copied when creating a new game.
- **System**: The collection of template, CLI scripts, and extensions. Lives in one git repository.
- **Game**: An instantiated workspace (a copy of the template with a populated `memory/WORLD.md` and active narrative state).

### Mental Model
Think of it as `rails new` for text adventures: one command scaffolds a workspace, another launches it. Each workspace is its own pi agent (own `PI_CODING_AGENT_DIR`, own git history, own sessions).

### Boundaries

**In scope:**
- Game workspace template (markdown skeleton, settings.json, extensions, save script)
- `chasm` CLI: `new`, `play`, `list`, `install-extensions`
- Install script: dependency check, XDG-respecting paths, template copy
- First-launch interactive bootstrap (Q&A → `WORLD.md`)
- Distribution as a git repository installable via clone + `./install.sh`

**Out of scope:**
- Multi-player / networked play (single-player only)
- Save/load separate from git (the `bin/save` script is the persistence layer)
- GUI or web interface (terminal-only via pi)
- Package registry publishing (npm, etc.) — focus on git-based distribution first
- In-game menu system (pi sessions are the interface)

### Alternatives Considered

1. **Single workspace with multiple sub-worlds**
   - Rejected: Session isolation is poor. Git history mixes games. `PI_MEMORY_DIR` would need runtime switching. Simpler to have N workspaces.

2. **Embed as a pi package**
   - Rejected: Pi packages are for extensions and skills. The game world itself is a directory of markdown files with live git history — not a code package.

3. **Template git branch instead of template directory**
   - Rejected: Requires users to understand branch workflows. A plain directory copy is simpler and clearer.

## Contract

### File Layout

Repository layout (the system):

```
chasm/
├── README.md
├── SPEC.md
├── install.sh              # System installer
├── chasm                   # CLI entrypoint
├── template/               # Game workspace skeleton
│   ├── settings.json
│   ├── extensions/
│   │   ├── chasm-tools.ts
│   │   └── chasm-ui.ts
│   ├── bin/
│   │   └── save
│   ├── memory/
│   │   ├── .pi-mem.json
│   │   ├── AGENTS.md
│   │   ├── WORLD.md          # SHELL — bootstrapped on first launch
│   │   ├── WORLD_STATE.md     # SHELL — bootstrapped on first launch
│   │   ├── CHARACTERS.md      # Format spec
│   │   ├── PLACES.md          # Format spec
│   │   ├── ITEMS.md           # Format spec
│   │   ├── EVENTS.md          # Format spec
│   │   ├── QUESTS.md          # Format spec
│   │   ├── PLAYER.md          # Format spec
│   │   ├── places/
│   │   ├── characters/
│   │   ├── items/
│   │   └── events/
│   └── .gitignore
└── ... (dev files, docs, etc.)
```

Installed layout (per user):

```
$XDG_DATA_HOME/chasm/
├── template/               # Copy of system template/
└── games/                  # Instanced game workspaces
    ├── sunken-quarter/
    └── milliways/
```

### Interface

#### `install.sh [--local] [--prefix PREFIX]`

Installs the chasm system. Dependencies: bash 4+, git, Node.js 18+, npm.

| Flag | Behaviour |
|------|-----------|
| `--local` | Install to `$HOME/.local` (default if not root) |
| `--prefix PREFIX` | Install binaries to `PREFIX/bin`, templates to `PREFIX/share/chasm` |

Flow:
1. Check for `pi` on PATH. If absent, run `npm install -g @earendil-works/pi-coding-agent` (or print instructions and exit if `--no-auto`).
2. Copy `template/` to `$PREFIX/share/chasm/template/`.
3. Copy `chasm` to `$PREFIX/bin/chasm` (or warn and create symlink if `$PREFIX/bin` is not writable).
4. Ensure `$PREFIX/bin` is on user's PATH (print reminder if not).
5. Print success message with `chasm --help`.

#### `chasm new GAME_NAME [--dir PATH]`

Scaffolds a new game workspace.

1. Validate `GAME_NAME` is filesystem-safe (`^[a-zA-Z0-9_-]+$`).
2. Determine target directory: `--dir` if given, else `$XDG_DATA_HOME/chasm/games/$GAME_NAME`.
3. Abort if target exists and is non-empty.
4. Copy `$XDG_DATA_HOME/chasm/template/` to target recursively.
5. `cd` into target, run `git init`.
6. Print: `Created $GAME_NAME at $PATH. Run 'chasm play $GAME_NAME' to begin.`

#### `chasm play GAME_NAME`

Launches a game.

1. Resolve workspace directory (same lookup as `chasm new`).
2. If workspace not found → error.
3. Detect first launch: if `memory/WORLD.md` contains only the template shell (empty world marker) or is missing:
   a. Run the bootstrap Q&A (see below).
   b. Write `memory/WORLD.md` and basic `WORLD_STATE.md` from answers.
   c. Commit: `[bootstrap] World created: $TITLE`.
4. Export `PI_CODING_AGENT_DIR` and `PI_MEMORY_DIR` to the resolved workspace.
5. Ensure `pwd` is the workspace root.
6. Launch `pi` (passing through any extra args after `--`).

#### `chasm list`

Lists games in `$XDG_DATA_HOME/chasm/games/`, showing last commit date and current world title (parsed from `memory/WORLD.md`).

#### `chasm install-extensions`

(Re-)installs the chasm extensions into the current game's `extensions/` directory. Primarily for updating extensions after a system update.

### Bootstrap Q&A

A bash/readline script, `bin/bootstrap`, invoked by `chasm play` on first launch. Runs before pi starts.

Questions (answers written to `memory/WORLD.md`):

1. "What is the name of your world?" → `title:`
2. "Describe the setting in one or two sentences:" → `setting:`
3. "What genre? (e.g. historical-fantasy, sci-fi, horror)" → `primary:` under `genre_tags`
4. "What tone? (e.g. grim-wry, epic, noir)" → `tone:` under `genre_tags`
5. "Describe one unique rule of this world:" → `rules:` (bullet list)
6. "What is the starting location called?" → `starting_place:` and creates initial place file

Output: A valid `WORLD.md` matching the narrator spec format, plus a minimal `WORLD_STATE.md` with the player in the starting place.

### Constraints

- The system MUST respect XDG Base Directory Specification. If `XDG_DATA_HOME` is unset, default to `$HOME/.local/share`.
- The system MUST NOT require root for `--local` installation.
- The template MUST initialise an empty git repository on `chasm new`.
- `chasm play` MUST set `PI_CODING_AGENT_DIR` and `PI_MEMORY_DIR` correctly before invoking pi.
- Extensions MUST be copied from the system template at scaffold time, not symlinked, to support standalone distribution of game workspaces.
- The `bin/save` script MUST work regardless of where it is invoked from (it already does via `cd` and relative paths).
- The bootstrap MUST produce a valid `WORLD.md` that satisfies the `AGENTS.md` narrator spec without requiring further manual editing.

### Errors

| Condition | Behaviour |
|-----------|-----------|
| pi not installed and `--no-auto` passed | Exit 1 with install instructions |
| `GAME_NAME` contains unsafe characters | Exit 1 with regex hint |
| Target directory exists and non-empty on `chasm new` | Exit 1, suggest `--force` or manual cleanup |
| `chasm play` invoked outside a valid workspace | Exit 1 with path hint |
| Bootstrap Q&A interrupted (Ctrl-C) | Clean up partial files; workspace remains uninitialised; next `play` repeats bootstrap |

## Verification

### Examples

```bash
# Install system
./install.sh --local

# Create a game
chasm new milliways
# -> Created milliways at ~/.local/share/chasm/games/milliways.

# First launch — triggers bootstrap
chasm play milliways
# -> Welcome to Chasm. Let's build your world.
# -> Name of your world? Milliways
# -> Setting? A spaceport bar at the end of the universe...
# -> ... [writes WORLD.md]
# -> [pi launches]

# Resume
chasm play milliways
# -> [pi launches directly, world exists]

# List games
chasm list
# -> milliways     (2026-05-08)  "Milliways"
# -> sunken-quarter (2026-05-06)  "The Sunken Quarter"
```

### Acceptance Criteria

- [ ] `chasm new foo` creates a directory with valid `settings.json`, `memory/`, and `.git` repo.
- [ ] `chasm play foo` on a new game triggers the bootstrap Q&A before launching pi.
- [ ] After completing bootstrap, `memory/WORLD.md` exists and `memory/WORLD_STATE.md` points to the named starting place.
- [ ] `chasm play foo` on an initialised game launches pi without re-asking questions.
- [ ] `chasm list` shows all games in the data directory with their titles.
- [ ] Running `bash bin/save "test"` from inside a game workspace creates a git commit.
- [ ] The install script succeeds on a fresh machine with Node.js 18+ and npm, and `chasm` is on PATH afterward.
- [ ] Two games can be played independently: changes to one do not appear in the other's git history.

---

*Version: 1.0 | Updated: 2026-05-08*

## Changelog

- 1.0 (2026-05-08): Initial specification
