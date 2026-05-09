# Chasm

## A generative multiplayer interactive fiction text adventure

Chasm is a text adventure game in a world you can specify. It uses generative
artificial intelligence (LLMs) to generate scenes and characters as you play.

Unlike simply role-playing with a chatbot, important state persists (locations,
characters, dialogue, events and so on) between users.

Each world is simply a directory of markdown files: a language model narrates
your story through the [pi coding harness](https://pi.dev) (and inherits its
architecture).

## Install

Requires **Node.js 18+**, **npm**, **git**, and **Python 3**.

```bash
git clone https://github.com/clawdia-lobster/chasm.git
cd chasm
./install.sh --local
```

If `pi` is not on your PATH, the installer will install it via npm.

**Before playing:** configure a model in pi:

```bash
pi /login
```

Chasm requires a model with tool-use support (function calling). Good choices
as of 2026: Kimi K2.5, Mistral Medium 3.5, Sonnet 4.5 via OpenRouter. You can
configure local models via vLLM, for which you'll have to edit `models.json`
(see the `pi` [documentation to set up
models](https://pi.dev/docs/latest/providers)). Qwen 3.6 27b, Gemma 4 work
fine.

During play, switch models with **Ctrl+L**.

> **TODO:** A non-git install method (curl | bash) is planned.

## Quick Start

```bash
chasm new sunken-quarter
chasm play sunken-quarter
```

First launch triggers a short Q&A — title, setting, genre, tone, a unique rule,
and starting place. The narrator then drops you into the world.

Resume later: `chasm play sunken-quarter`.

## In-Game Commands

Type natural language to act in the world. The narrator interprets your
commands and responds in second-person prose.

| Command | What it does |
|----------|-------------|
| `/save` | Save game state. Reminds the narrator to persist any pending changes first. |
| `/sync` | Force the narrator to re-read key state files and persist changes. Use when the story feels stale or inconsistent. |
| `Ctrl+L` | Switch models mid-session. |
| `Ctrl+O` | Expand/collapse a tool call to see full output (file contents, command output). |

## How It Works (Briefly)

A Chasm world is a **git repo** of markdown files. The narrator reads state,
interprets your commands, and writes the story back. Everything is visible and
editable. See `docs/architecture.md` for the full picture.

## Troubleshooting

**Model not configured:** Run `pi /login` or edit `settings.json` and `models.json` manually.

**First launch shows placeholder text:** Run `chasm play` again; the bootstrap
runs only when `WORLD.md` is uninitialised.

**Permission denied on `chasm`:** Ensure `~/.local/bin` is on your PATH, or use
the full path.

## License

MIT. See `LICENSE`.
