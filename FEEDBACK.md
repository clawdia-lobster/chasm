# FEEDBACK.md - Feedback on Chasm

Feedback from playtests, design reviews, and agent reviews. Entries are dated;
adopted items link to the PRs that landed them. The source is the workspace
design-review loop around the narrator contract and game quality.

## 2026-09-06 - game-design review (Nereus + Ati)

Design review of the narrator contract and game quality. Centred on:
PRINCIPLES.md (new), AGENTS.md, APPEND_SYSTEM.md, and a comparison against
50 years of text-game craft.

### Adopted

- **PRINCIPLES.md** (PR #25): eight game-design principles binding the
  narrator as referee and author - play is learning; constraint makes choice
  real; offer only interesting decisions; honour the fantasy contract; be
  fair and legible; curiosity is a controlled economy; escalate and close;
  let the world outrun you. Lives in template/memory/, injected at session
  start via .pi-mem.json contextFiles, and propagated to existing games
  through MANAGED_FILES on `chasm update`.
- **Shorter narrator replies** (PR #26): reply length narrowed from "one or
  two paragraphs" to "one short paragraph, often a single sentence", in both
  AGENTS.md and APPEND_SYSTEM.md (the per-turn system-prompt layer).

### Backlog (adoptable, not yet built)

From the 50-years-of-text-games comparison, in rough build order:

- **/undo**: player-facing turn undo by reverting the last auto-save commit.
  The medium's oldest friction fix, already enabled by per-turn git commits.
- **Navigation grammar**: on arrival, name the place and state exits and
  salient objects plainly. Kills "where can I go" friction.
- **Gazette**: a periodic in-world news-sheet the narrator appends to,
  reporting the player's deeds back through the world. Makes the
  show-consequences principle felt as content, not duty.
- **Document items**: item files whose body is readable prose (letters,
  maps, ledgers). The Infocom "feelie"; hooks into real period documents
  (Gutenberg direction).
- **/status**: surface active quests and current objective. QUESTS.md exists
  but nothing shows it to the player; aimlessness is the classic complaint.
- **/hint**: graduated out-of-world hints (InvisiClues pattern), separate
  from narrative so character is never broken.
- **Design-health lint**: extend chasm-validate with reachability and
  closure checks - quests with unreachable next stages, places nothing
  points to, planted threats never resolved.
- **Timeline branches**: git branch per divergent path, the multi-ending
  save-slot made literal by the repo.
- **Episodic session framing**: designed session boundaries (opening
  situation, beats, closing hook), the serialised-mystery form.

### Themes that recurred

- Constraint is the engine: a narrator who can always say yes is a genie,
  not a game. LLM games die from narrator omnipotence.
- Grounding (real places, real books, real data) makes the world bigger than
  the model and lets the player bring real competence to the table.
- Brevity is craft: the reader supplies the graphics.
- The system prompt is for mechanical, unconditional, per-turn rules only;
  reasoned, tunable guidance (like PRINCIPLES.md) belongs in context.

## 2026-09-06 - playtest finding: amnesiac condition sticks after identity reveal

- Symptom: footer keeps showing "amnesiac" after the player identifies (baskerville playtest).
- Mechanism: template WORLD_STATE.md ships `condition: amnesiac` for the amnesia bootstrap; AGENTS.md's identity-reveal steps (create character file, set player.character pointer) never clear it, and the footer displays `condition` until it is no longer "amnesiac".
- Fix: AGENTS.md bootstrap step 5 now sets the condition to `normal` on identity reveal (PR #27); the live game was patched directly.
