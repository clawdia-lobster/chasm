# CHARACTERS.md — Character File Format

## Overview

Characters are **markdown files** in `$PI_MEMORY_DIR/characters/*.md`. They define NPCs and the player character.

## Slug Derivation

When creating a new character file, derive the filename from the `name` field using this algorithm:

1. **Lowercase** the entire string.
2. **Replace all non-alphanumeric characters** with hyphens. (Spaces, apostrophes, commas, periods, etc. all become hyphens.)
3. **Collapse** consecutive hyphens to a single hyphen.
4. **Strip** leading and trailing hyphens.
5. Append `.md`.

| `name:` | Filename |
|---------|----------|
| `Grimbold the Smith` | `grimbold-the-smith.md` |
| `Elara Vex` | `elara-vex.md` |
| `O'Connor` | `oconnor.md` |

## File Format

```markdown
---
name: "Grimbold the Smith"
gender: "M"
appearance: "huge, soot-stained, grey beard in braids, missing left ear"
health: "healthy"
emotions: "gruff, secretly worried"
location: "The Forge, Anchor Street"  # narrative convenience
coords: {x: 0, y: 0}  # canonical spatial key
objective: "Find out who sabotaged his forge"
score: 0

# Immutable attributes (set at creation)
backstory: "Once a soldier, now a smith. The forge was his penance."
voice: "gravelly, terse, occasional dry humour"
traits: "ISTJ, proud, stubborn, loyal to friends"
likes: "hot steel, honest work, strong ale"
dislikes: "nobles, liars, cold damp mornings"
skills: "smithing, sword-play, intimidation"
occupation: "Blacksmith"
motivation: "Guardian — protects those who can't protect themselves"

# Mutable state (changes through play)
inventory:
  - "hammer"  # references item in $PI_MEMORY_DIR/items/
  - "iron-key"
memories:
  - "The forge fire went out three nights ago. Not natural."
  - "Saw a hooded figure near the salt warehouse."
destination: "The Salt Warehouse, Dockside"  # where they're heading
properties:
  reputation: 12
  secret_known: false
---

# Grimbold the Smith

Grimbold stands at his anvil, hammer frozen mid-strike. The forge is cold — the fire died three nights past and he hasn't been able to relight it. His eyes are red-rimmed. He looks at you sidelong.

"You're not from the Quarter," he says. "Good. Need fresh eyes."
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | str | Yes | Display name |
| `gender` | str | Yes | M / F / N |
| `appearance` | str | Yes | Physical description, current state |
| `health` | str | Yes | `healthy wounded dying dead` |
| `emotions` | str | No | Current mood |
| `location` | str | No | Place name for readability. Must match the place whose `coords` match this character's `coords`. |
| `coords` | dict | No | `{x: int, y: int}` — canonical spatial key. Source of truth for where this character is. |
| `objective` | str | No | Current goal (drives behaviour) |
| `score` | int | No | Achievement/quest score |
| `backstory` | str | No | Origin story |
| `voice` | str | No | Speech pattern |
| `traits` | str | No | Personality, MBTI, quirks |
| `likes` | str | No | Desires, wants |
| `dislikes` | str | No | Fears, aversions |
| `skills` | str | No | What they're good at |
| `occupation` | str | No | Job or role |
| `motivation` | str | No | Archetype + driving force |
| `inventory` | list | No | Item names they carry |
| `memories` | list | No | Observable facts they know |
| `destination` | str | No | Where they're moving to |
| `properties` | dict | No | Custom key-value state |

## Body

Write the character's **current narrative description** — what the player sees when they encounter them. Update this when appearance or circumstances change.

## Spatial Tracking

Characters occupy a place in the world via `coords`. This is the **canonical key** for location. The `location` field is narrative convenience — it should match the display `name` of the place at those `coords`.

When moving a character:
1. Update `coords` to the new place's coordinates.
2. Update `location` to that place's display `name`.

If `location` and `coords` disagree, `coords` wins. Resolve the correct `location` by finding the place file whose `coords` match.

## Cross-Linking

- Link places: `[[The Forge, Anchor Street]]`
- Link items: `[[iron-key]]` (from inventory)
- Link other characters: `[[Elara Vex]]`
- Link events: `[[2026-05-07_14-30-00_forge-sabotage]]`

## Creating a Character

When spawning a new character:

1. Choose a **memorable name** (not generic)
2. Give them a **secret** — something they know or hide
3. Connect them to **at least one existing place or character**
4. Give them **urgency** — a reason to be doing something now
5. Write `motivation` as `{Archetype} — {specific goal}`

### When to Write a Character File

Write a character file when:
- The player **encounters** a named character who may reappear
- A character has **inventory, objectives, or secrets** worth tracking
- A character **moves independently** — they need a location to track

Don't write a character file when:
- A character is **mentioned but not present** — note them in the place description or an event instead
- A character is **generic/background** ("the barman", "a guard") — they don't need a file unless they become recurring
- The **player character** has not yet declared a name or identity — until then, describe them in second person only (see Amnesia Bootstrap above)

When in doubt, write the file. It's easier to delete a redundant file than to reconstruct a character from scattered events.

## Character Archetypes

Use one as baseline, then complicate:

- **Hero** — acts for others, often reluctantly
- **Mentor** — guides, may have failed their own quest
- **Villain** — thinks they're right, not mustache-twirling
- **Informant** — knows something, unsure if they should tell
- **Guardian** — protects something, may be misguided
- **Shadow** — mirrors the player, shows what they could become
