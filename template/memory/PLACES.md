# PLACES.md — Place File Format

## Overview

Places are **markdown files** in `$PI_MEMORY_DIR/places/*.md`. They define locations in the world. Coordinates are in frontmatter for topology.

## Slug Derivation

When creating a new place file, derive the filename from the `name` field using this algorithm:

1. **Lowercase** the entire string.
2. **Replace all non-alphanumeric characters** with hyphens. (Spaces, commas, apostrophes, periods, colons, etc. all become hyphens.)
3. **Collapse** consecutive hyphens to a single hyphen.
4. **Strip** leading and trailing hyphens.
5. Append `.md`.

| `name:` | Filename |
|---------|----------|
| `The Forge, Anchor Street` | `the-forge-anchor-street.md` |
| `St. John's Gate` | `st-johns-gate.md` |
| `O'Connor's Pub` | `oconnors-pub.md` |
| `Room 42` | `room-42.md` |
| `The Well...` | `the-well.md` |

## File Format

```markdown
---
name: "The Forge, Anchor Street"
coords: {x: 0, y: 0}
appearance: "soot-blackened stone building, chimneys cold, sign creaking"
atmosphere: "oppressive, silent, smell of cold iron and regret"
terrain: "urban cobbles"
state: "normal"  # normal, ruined, flooded, burning, etc.
rooms:
  - "smithy floor"
  - "coal store"
  - "sleeping nook"
properties:
  fire_lit: false
  sabotaged: true
  searchable: true
---

# The Forge, Anchor Street

The forge lies cold. Grimbold's hammers rest on the anvil, untouched for three days. The coal store smells of damp. Someone has scattered salt-iron filings across the threshold — a ward, or a threat?

## Exits

- **north** → [[The Salt Warehouse, Dockside]] — through a narrow alley
- **east** → [[Anchor Street]] — the main thoroughfare, muddy and dim
- **down** → [[The Sewer Junction]] — a loose grate in the coal store

## Things Here

- `$PI_MEMORY_DIR/items/hammer.md` — Grimbold's hammer (if he dropped it)
- `$PI_MEMORY_DIR/items/salt-iron-filings.md` — scattered on the threshold

## Characters Here

- `$PI_MEMORY_DIR/characters/grimbold-the-smith.md` — standing by the cold anvil
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | str | Yes | Display name |
| `coords` | dict | No | `{x: int, y: int}` — unique identifier for outdoor/exterior places. Optional for rooms/sub-places. |
| `appearance` | str | Yes | What you see (keywords, concrete) |
| `atmosphere` | str | Yes | Mood, feeling, smell, sound |
| `terrain` | str | Yes | Terrain type (urban, forest, cave, etc.) |
| `state` | str | No | `normal ruined flooded burning collapsed` etc. |
| `rooms` | list | No | Sub-rooms if building/indoor |
| `properties` | dict | No | Custom key-value state |

## Body Sections

### `# Place Name`

**Narrative description** — what the player sees, hears, smells when they arrive. Update when state changes.

### `## Exits`

**Compass directions and their destinations.** Use `[[Place Name]]` links. Include a brief sensory hint for each exit.

### `## Things Here`

**Items at this location.** Use paths relative to `$PI_CODING_AGENT_DIR`: `memory/items/item-name.md`. Items with `owner: null` and matching `coords` are here.

### `## Characters Here`

**Characters present.** Use paths relative to `$PI_CODING_AGENT_DIR`: `memory/characters/char-name.md`. Characters with matching `coords` are here.

## Creating a Place

When generating a new place:

1. Choose **distinctive name** — avoid generic (" Tavern" → "The Drowned Rat, Salt Lane")
2. Make it **sensory and specific** — "smell of stale beer and green soap"
3. **Outdoor/exterior places**: prefer 2+ exits. **Rooms/sub-places** (cupboards, cellars, alcoves): one exit back to parent is normal and expected
4. **Dead ends are fine** if deliberate — a hidden chamber, a collapsing cul-de-sac, a locked cell. Just don't accidentally strand the player
5. Add **something to interact with** — an item, a character, a secret
6. **Link backward** — when you add an exit from place A to place B, you **must** also add the reverse exit from place B to place A (north ↔ south, east ↔ west, up ↔ down, etc.). One-way passages are rare; if you deliberately create one, note it in both places. Ensure no place is orphaned — every outdoor place needs at least one incoming exit.

## Place States

| State | Meaning |
|-------|---------|
| `normal` | As intended |
| `ruined` | Damaged, partially collapsed |
| `flooded` | Waterlogged, difficult |
| `burning` | On fire, dangerous |
| `collapsed` | Impassable |
| `locked` | Can't enter without key |
| `hidden` | Must be discovered |

## Coordinates and Topology

### Coordinates (`coords`)
- **Required** for outdoor/exterior places (streets, districts, landmarks) that have spatial relationships to other places
- **Optional** for rooms/sub-places (cupboards, cellars, alcoves) that exist within a parent place
- When present, coordinates allow **spatial queries**: "what's nearby?", "how far is X?"
- Format: `{x: int, y: int}` — greppable in frontmatter

### Topological Links
- **Exits** define player navigation via compass directions
- Exits are the primary way players move between places
- Coordinates are secondary — used for spatial reasoning (distance, "nearby", etc.)

### When to include `coords`

| Place type | coords | Example |
|---|---|---|
| Outdoor location | Yes | `coords: {x: 0, y: 0}` — "The Forge, Anchor Street" |
| Room inside building | No | "smithy floor" exists within "The Forge" |
| Hidden chamber | No | "Secret Cache" is discovered within "The Salt Warehouse" |
| Procedurally generated | Yes | Needed for spatial generation |
| Hand-crafted locale | Optional | Only if spatial queries matter |

### Grepping Coordinates

Use `rg` (ripgrep) for coordinate lookups. YAML frontmatter may use inline or block form, so match `x:` and `y:` separately.

```bash
# Find the place file at origin — match x: 0 AND y: 0
rg "x: 0" "$PI_MEMORY_DIR/places/" | rg "y: 0"

# Find nearby things in a radius (~2 units around {x: 1, y: 1})
# Read matching files and check both coordinates
rg "x: [0-2]" "$PI_MEMORY_DIR/places/" | rg "y: [0-2]"
```

### Coordinates as Canonical Key

`coords` is the **canonical spatial key**. `name` is the human-readable label. When resolving spatial queries, prefer `coords` over `name`. If two entities have the same `coords`, they occupy the same location.

## Topology

A place is a **node**. Exits are **edges**. The narrator must verify accessibility before allowing movement. Ask: "Would a person reasonably reach {destination} from here?"",
