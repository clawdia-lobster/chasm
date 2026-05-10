# ITEMS.md — Item File Format

## Overview

Items are **markdown files** in `$PI_MEMORY_DIR/items/*.md`. They define portable objects.

## Slug Derivation

When creating a new item file, derive the filename from the `name` field using this algorithm:

1. **Lowercase** the entire string.
2. **Replace all non-alphanumeric characters** with hyphens. (Spaces, apostrophes, commas, periods, etc. all become hyphens.)
3. **Collapse** consecutive hyphens to a single hyphen.
4. **Strip** leading and trailing hyphens.
5. Append `.md`.

| `name:` | Filename |
|---------|----------|
| `Rusty Key` | `rusty-key.md` |
| `Brass Astrolabe` | `brass-astrolabe.md` |
| `Grimbold's Hammer` | `grimbolds-hammer.md` |

## File Format

```markdown
---
name: "Rusty Key"
type: "key"
appearance: "iron key, pitted with rust, teeth worn smooth"
usage: "Unlocks the grate to the sewers beneath the Forge"
state: "intact"  # intact, broken, consumed, lit, extinguished
owner: "Grimbold the Smith"  # character name, or null if on ground
coords: {x: 0, y: 0}  # where it is (if owner: null)
properties:
  material: "iron"
  weight: "light"
  cursed: false
---

# Rusty Key

A heavy iron key, crusted with rust. It smells of the sewers. Grimbold kept it in his coal store — the only way down when the tide comes in.
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | str | Yes | Display name |
| `type` | str | Yes | `weapon tool key consumable document clothing` etc. |
| `appearance` | str | Yes | What it looks like |
| `usage` | str | Yes | What it does / how to use it |
| `state` | str | No | `intact broken consumed lit extinguished` etc. |
| `owner` | str | No | Character name carrying it, or `null` |
| `coords` | dict | No | Location if on ground (`owner: null`) |
| `properties` | dict | No | Custom key-value state |

## Body

**Narrative description** of the item. What the player notices when examining it. Include hints about usage or origin.

## Item Types

| Type | Examples | Usage Pattern |
|------|----------|---------------|
| `weapon` | sword, club, pistol | Combat, intimidation |
| `tool` | hammer, lockpick, crowbar | Overcome obstacles |
| `key` | brass key, combination | Open locked places |
| `consumable` | potion, food, lamp oil | One use, then gone |
| `document` | letter, map, book | Read for information |
| `clothing` | coat, boots, mask | Worn, may confer properties |
| `valuable` | coin, gem, art | Trade, bribe, quest item |
| `misc` | anything else | Context-dependent |

## Creating an Item

When spawning a new item:

1. Give it a **reason to exist** — who made it, why is it here?
2. Make usage **specific but flexible** — "Unfolds into a 12-inch blade" not "a sword"
3. Consider **state changes** — items can break, burn, rust
4. Link to **at least one place or character** — provenance matters

## Item State Transitions

| From | To | Trigger |
|------|-----|---------|
| `intact` | `broken` | Hard use, combat, sabotage |
| `intact` | `consumed` | Eaten, drunk, burned up |
| `intact` | `lit` | Activated (lamp, torch) |
| `lit` | `extinguished` | Doused, time passes |
| `extinguished` | `consumed` | Fuel runs out |

## Ownership and Location

An item is carried if `owner` is a character name. An item is on the ground if `owner: null` and `coords` match a place. Move items by updating these two fields.
