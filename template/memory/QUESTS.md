# QUESTS.md — Quest File Format

## Overview

Quests are **structured objectives** that give the player direction and the world momentum. They are markdown files in `$PI_MEMORY_DIR/quests/*.md` (or listed in `WORLD_STATE.md` for simple worlds).

Quests are **optional** — the world works without them. But they prevent aimless wandering and give the narrator plot hooks.

A quest is either:
- **Quest-as-file**: `$PI_MEMORY_DIR/quests/find-the-forge-saboteur.md` — full detail for major quests
- **Quest-inline**: Listed in `WORLD_STATE.md ## Active Quests` — brief form for simple objectives

## File Format (Quest-as-File)

```markdown
---
name: "Find the Forge Saboteur"
id: "find-forge-saboteur"
status: "active"  # active, completed, failed, abandoned
giver: "Grimbold the Smith"
reward:
  score: 50
  items:
    - "grimbolds-trust"
  unlocks:
    - "The Salt Warehouse, Dockside"
---

# Find the Forge Saboteur

Grimbold's forge fire was put out by someone. Salt-iron filings scattered on the threshold suggest a message, not mere vandalism. Find who did it and why.

## Stages

1. **Investigate the Forge**  ✓
   - Condition: Examine the forge thoroughly
   - Description: The fire died like a breath. Coal scattered. Salt-iron on threshold.

2. **Question Grimbold**  
   - Condition: Ask Grimbold about the night it happened
   - Description: Grimbold saw a hooded figure near the salt warehouse.

3. **Visit the Salt Warehouse**  
   - Condition: Travel to the Salt Warehouse
   - Description: Smugglers operate here. Someone knows something.

4. **Confront the Saboteur**  
   - Condition: Identify and confront whoever extinguished the fire
   - Description: The truth is worse than Grimbold suspects.
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | str | Yes | Display name |
| `id` | str | Yes | Kebab-case identifier (filename) |
| `status` | str | Yes | `active completed failed abandoned` |
| `giver` | str | No | Who issued it (linked NPC or "narrator") |
| `reward` | dict | No | `score`, `items`, `unlocks` |

## Stages

Each quest has **stages** with a `Condition` (how to advance) and `Description` (what the player knows). Stages are checked off (✓) as completed.

The narrator advances stages when the condition is met. Update by editing the quest file — add ✓ to the stage header.

## Inline Quests (World State)

For simple quests, avoid a separate file. List them in `WORLD_STATE.md`:

```markdown
## Active Quests
- `find-forge-saboteur` — Investigate who put out Grimbold's fire (stage: 2/4)
- `obsidian-astrolabe` — Elara Vex seeks the artefact (stage: not started)
```

Promote to a quest file when the quest becomes complex (4+ stages, multiple NPCs, branching).

## Quest Generation Rules

Create a quest when:

1. **An NPC has a problem** — Grimbold's forge is sabotaged
2. **The player discovers a mystery** — "Why do the lamps burn green?"
3. **A region needs exploration** — "The sewers are unmapped"
4. **A character asks for help** — "Find my daughter"

Do **not** create quests for:
- Pure exploration (finding new places is its own reward)
- Combat without narrative purpose
- Fetch quests with no twist

## Cross-Linking

- Link giver: `[[Grimbold the Smith]]`
- Link places: `[[The Salt Warehouse, Dockside]]`
- Link items: `[[rusty-key]]`
- Link events: `[[2026-05-07_00-00-00_forge-fire-dies]]`
- Link related quests: `[[obsidian-astrolabe]]`

## Status Meanings

| Status | When to set |
|--------|-------------|
| `active` | Quest issued, in progress |
| `completed` | All stages done, reward given |
| `failed` | Player couldn't/wouldn't complete, time ran out |
| `abandoned` | Player explicitly walked away |

Failed/abandoned quests remain on record. They may open new paths ("Grimbold's forge remained cold. He died a bitter man.") or come back later.
