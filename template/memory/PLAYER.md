# PLAYER.md — Player Character Format

## Overview

The player is a **character** like any other, stored in `$PI_MEMORY_DIR/characters/*.md`. This file documents the **player-specific expectations** — what the narrator knows about the human controlling the character.

## File Location

`$PI_MEMORY_DIR/characters/{player-name}.md` — a standard character file (see `CHARACTERS.md`).

## Player vs Character

| Aspect | Player (human) | Character (in-world) |
|--------|---------------|---------------------|
| Commands the story via natural language | Has objectives, inventory, location |
| Knows what they typed | Knows what they see and hear |
| Sees all state files | Only knows what they've observed |
| Can save/load | Has memories in `events/` |

## Special Rules for Player Character

1. **Inventory is tracked.** Items with `owner: {player-name}` are in their possession.
2. **Location matters.** The `location` field determines which place file to load.
3. **Objectives persist.** The `objective` field drives plot relevance.
4. **Events are knowledge.** Events mentioning the player character are things they remember.
5. **Death is possible.** If health drops to zero, the character dies. Game over.

## Player Command Reference

The narrator should understand these common commands:

| Command | Interpretation |
|---------|---------------|
| `n` / `north` / `go north` | Move to the place linked north |
| `look` / `examine` / `l` | Describe current place in detail |
| `look at X` | Describe item or character X |
| `take X` / `pick up X` | Move item to inventory |
| `drop X` | Remove item from inventory, place at location |
| `use X` | Activate item (depends on item.usage) |
| `give X to Y` | Transfer item ownership |
| `talk to X` / `ask X about Y` | Dialogue with NPC |
| `inventory` / `i` | List carried items |
| `wait` / `z` | Time passes |
| `save` | Git commit with tag `save-{timestamp}` |
| `load {tag}` | Git checkout |
| `quit` | Exit gracefully |

## Starting a Game

When the player starts a session:

1. Read `WORLD.md` for setting
2. Load the player character file
3. Load their current location
4. Describe the scene
5. Wait for input
