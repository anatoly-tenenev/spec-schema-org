# AGENTS.md

## Purpose

This file defines the working rules for AI agents in the `spec-schema-org` repository.
Project: a simple static site built with Eleventy (effectively 2 pages).

Project priorities:

- minimalism;
- code quality;
- site language: English (all user-facing content and UI).

## Fixed Technology Choices

- Site generator: Eleventy (11ty).
- Language for configuration and utilities: TypeScript.
- Package manager: `npm`.
- Node.js: `22.22.0` (Node 22 LTS, pinned version).
- Templates: hybrid approach:
  - pages with precise layout: `Nunjucks` (`.njk`);
  - content page: `Markdown` (`.md`) via a `Nunjucks` layout.
- Styles: plain CSS, with no CSS frameworks initially.

## Project Structure

- Source files: `src/`.
- Build output: `_site/`.

## Agent Rules

- Do not add new dependencies without the user's explicit request.
- Do not complicate the architecture unless necessary.
- Keep solutions simple and maintainable.
- Do not update `README.md` automatically (only if the user explicitly asks).
- In dialogue with the user, use the language in which the conversation started unless the user explicitly switches to another language.
- Deployment target: GitHub Pages with support for two URLs: `https://spec-schema.org` (primary) and `https://anatoly-tenenev.github.io/spec-schema-org` (fallback).
- If a task conflicts with `AGENTS.md`, the agent must explicitly ask the user for confirmation before proceeding.
- If the user confirms such a change, the agent must update `AGENTS.md` in the same change so that the rules and implementation do not diverge.

## Git Workflow

- Do not work directly in `main`.
- Always use a separate branch.
- Branch naming format:
  - `feat/<kebab-case>`
  - `fix/<kebab-case>`
  - `chore/<kebab-case>`

## Required Commands

- Local development: `npm run dev`
- Build: `npm run build`
- Formatting: `npm run format`

Before final handoff, the agent must run:

- `npm run format`
- `npm run build`

## CI (Required)

Every PR must include a GitHub Actions workflow with these checks:

- `npm run format -- --check`
- `npm run build`

CI must use Node.js `22.22.0`.
