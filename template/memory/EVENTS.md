# EVENTS.md — Event File Format

## Overview

Events are **append-only markdown files** in `$PI_MEMORY_DIR/events/*.md`. They record things that happened. They are **logs, not state** — write once, never edit. The filename is a **real-world timestamp** + slug: `YYYY-MM-DD_HH-MM-SS_brief-slug.md`. This is for ordering and deduplication — it is not the in-game date.

The frontmatter `time` field should use **in-game time** (the day/season from `WORLD_STATE.md`), not the real-world clock. Example: if the game is set in 1979 and it's day 3, morning, the frontmatter might read `time: "day 3, morning"`.

## File Format

```markdown
---
time: "day 1, morning"
place: "The Forge, Anchor Street"
coords: {x: 0, y: 0}
characters:
  - "Grimbold the Smith"
  - "The Player"
classification: "significant"  # significant, minor, forgettable
source: "narrator"
---

# Forge Fire Dies

Grimbold's forge fire went out — not gradually, but all at once, as if extinguished by a single breath. Salt-iron filings were scattered across the threshold. Grimbold suspects sabotage but has told no one.
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `time` | str | Yes | ISO timestamp |
| `place` | str | Yes | Where it happened |
| `coords` | dict | No | `{x: int, y: int}` |
| `characters` | list | No | Who was involved |
| `classification` | str | Yes | `significant minor forgettable` |
| `source` | str | No | `narrator character-name player` |

## Body

**What happened.** Write in past tense, concise summary. This becomes knowledge for characters who witnessed it.

## Classification

| Class | Who remembers | Use case |
|-------|--------------|----------|
| `significant` | All characters present + narrator | Plot events, discoveries, deaths |
| `minor` | Characters present only | Side conversations, observations |
| `forgettable` | Narrator only, may compress | Atmospheric details, routine actions |

## Memory Index

The narrator has two sources for "what happened":

| Source | Scope | Use case |
|--------|-------|----------|
| **Character `memories`** | Per-character | What *this specific character* knows or observed |
| **Events** | Global | What *everyone present* witnessed; world-level facts |

### Narrator Algorithm

When generating dialogue or narrative for a character:

1. Load their character file → read `memories` for personal knowledge
2. Search `events/` for files where their name appears in `characters` → merge witnessed facts
3. Include **recent significant events** in context (last 3-5)
4. Never reveal knowledge a character doesn't have (no omniscient NPCs)

## What Gets Logged as an Event?

**Events are for narrative facts, not state changes.** Entity files already track state. Don't duplicate.

### DO log events for:

1. **Dialogue revelations** — "Grimbold admits he saw a hooded figure near the warehouse"
2. **Global/world events** — "The Drowned King's bell tolls at midnight"
3. **Multi-character interactions** — deals struck, betrayals, shared experiences
4. **Plot discoveries** — decoding a message, learning a secret, finding a map
5. **Permanent consequences** — a character dies, a place is destroyed (capture the moment)

### DON'T log events for (already in entity files):

| What happened | Where it lives | Why no event |
|---|---|---|
| Player moves north | Character `coords` / `location` | State tracks position |
| Item picked up | Item `owner` | State tracks ownership |
| Place catches fire | Place `state: burning` | State tracks condition |
| Character's mood shifts | Character `emotions` | State tracks current mood |
| Routine looking/examining | (no state change) | Nothing to remember |

### Character Memories (Per-Character Events)

When a character **learns something**, append to their `memories` list in their character file:

```yaml
memories:
  - "Grimbold admitted he saw a hooded figure near the salt warehouse."
```

Global events are for facts that **multiple characters witness** or that **affect the world** beyond individual knowledge. Character memories are for **private knowledge** gained through dialogue or observation.

## Compaction (Preventing File Bloat)

Events accumulate. Left unchecked, the `events/` directory becomes unwieldy. Use this strategy:

| Classification | Retention | Action |
|----------------|-----------|--------|
| `forgettable` | 7 days | Delete files older than 7 days. These are atmospheric noise. |
| `minor` | 30 days | Compress into monthly summary `events/archive/YYYY-MM_summary.md` |
| `significant` | Forever | Keep as individual files. These are plot-critical. |

### Monthly Compression (minor events)

Create `$PI_MEMORY_DIR/events/archive/2026-05_summary.md`:

```markdown
# May 2026 — Minor Events Summary

- 05-03: Player examined the forge sign (Grimbold annoyed)
- 05-04: Rats scurried in the coal store (atmosphere)
- 05-05: Green gaslamp flickered near Anchor Street (spirit proximity suspected)
```

Then delete the original minor event files. The summary is greppable and keeps the narrative texture without file bloat.

### Alternative: One-Line Log Format

For very high-volume worlds, consider a single `$PI_MEMORY_DIR/events/log.md` with one event per line:

```
2026-05-07T14:30:00Z | significant | forge-fire-dies | Grimbold the Smith | Forge extinguished, salt-iron scattered
2026-05-07T14:31:00Z | minor | player-look-sign | The Player | Examined the creaking forge sign
```

Significant events from the log can be promoted to individual files when they need cross-linking or narrative attention.

## Cross-Linking

- Link places: `[[The Forge, Anchor Street]]`
- Link characters: `[[Grimbold the Smith]]`
- Link items: `[[rusty-key]]`
- Link related events: `[[2026-05-06_09-00-00_forge-sabotage]]`
- Link compressed summaries: `[[2026-05_summary]]`
