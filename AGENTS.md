# ui.sh MCP Viewer — Agent Instructions

An open-source, static React SPA for browsing the ui.sh MCP documentation graph from the browser.

## Vendored Repositories

This project vendors external repositories under @repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @repos/ unless explicitly asked
- Do not import from @repos/ - application code should continue importing from normal package dependencies

When writing Effect code, inspect @repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.

The Catalyst UI kit vendored under `src/catalyst/` follows the same rule: import and compose its components, but do not modify the kit files.
