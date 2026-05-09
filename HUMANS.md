# Contributing to chasm

This document covers the process for both human and AI-assisted contributions.

## Getting Started, Making Changes

1. Fork the repository or create a feature branch.

### Codebase

- Read and understand the documentation and design choices
- Follow codebase idioms
- All tests must pass before submission (there aren't any yet, but in case there will be)

### Documentation

- Update README.md if adding CLI flags or changing user-facing behaviour
- Documentation is required for anything non-obvious

## AI-Assisted Contributions

We accept contributions generated with LLM assistance, subject to these requirements:

- **Human review required.** All AI-generated PRs must be reviewed and approved by a human maintainer.
- **Declare non-trivial assistance.** Note in the PR description: "Generated with assistance from [Claude/ChatGPT/etc]."
- **No autonomous merges.** AI agents must not merge, approve, or create releases.
- **Quality bar is the same.** AI-generated code must be idiomatic, pass all tests, and pass checks.

See `AGENTS.md` for the concise agent checklist.

## Submission

1. Push your branch to your fork.
2. Open a PR against `main` with a clear description.
3. Respond to review feedback promptly.

## Questions?

Open an issue for discussion before major changes.
