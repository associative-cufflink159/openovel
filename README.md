<p align="center">
  <img src="./assets/hero.webp" alt="Openovel" width="760" />
</p>

<p align="center">
  <strong>Local-first AI interactive fiction: a fast narrator for the reader, background agents for the story files.</strong>
</p>

<p align="center">
  <a href="#download">Download</a> ·
  <a href="#preview">Preview</a> ·
  <a href="#quick-start-from-source">Quick start</a> ·
  <a href="#why-openovel">Why openovel</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="./README.zh-CN.md">中文</a>
</p>

openovel is an open-source desktop app for playing AI interactive fiction. You type what the protagonist does; a foreground narrator streams the next beat; slower background agents read the resulting turn, update ordinary Markdown / JSON files, and shape the context future turns will use.

The project is built around a **dual-loop** runtime. The foreground loop is small and latency-sensitive. The background loop is asynchronous, tool-using, and file-native. By default it runs as a resident team: a Showrunner coordinator plus World Keeper, Director, Card Manager, and Memory agents. Disabling `OPENOVEL_RESIDENT_TEAM` falls back to the older single Storykeeper path.

Status: **beta / demo phase**. The app is usable end to end, but internal APIs and story workspace layouts may still change. The maintained surface is the Electron desktop app. macOS is the best-tested platform today; Windows and Linux packages are produced but lighter-tested.

## Download

The latest beta release has desktop packages for macOS, Windows, and Linux: [GitHub Releases](https://github.com/Feed-Scription/openovel/releases).

macOS builds are ad-hoc signed but not notarized because the project does not currently have an Apple Developer ID certificate. Gatekeeper warnings are expected; see [`docs/macos-gatekeeper.md`](./docs/macos-gatekeeper.md) for the workaround.

Release-process notes for maintainers live in [`docs/releases.md`](./docs/releases.md).

## Preview

A real openovel session running in the Electron desktop app.

<p align="center">
  <img src="./assets/screenshot.webp" alt="openovel Electron app showing a running interactive fiction scene" width="860" />
</p>

## Quick Start From Source

Requirements for source runs:

- Node.js >= 20
- npm
- A supported LLM provider key. The desktop onboarding flow can collect it.

```bash
git clone https://github.com/Feed-Scription/openovel.git
cd openovel
npm install
npm run electron
```

`npm run electron` bundles the renderer and launches the desktop app. On first run, onboarding asks for language preferences and model access. A fresh packaged library is also seeded with bundled starter stories when available, so you can open a playable example before creating your own.

Try a first action in the input bar:

```text
I wake up in the abandoned ferry terminal and look around.
```

You can also pick a suggested action when choices are enabled, or type anything free-form.

## Why Openovel

Long-running interactive fiction has two needs that pull against each other:

- The reader should get prose quickly.
- The world, memory, promises, and consequences should survive many turns.

openovel separates those jobs instead of asking one large agent loop to do everything at once.

- **Foreground narrator**: a streaming model call with no tools and no file writes. It sees compiled foreground guidance, triggered context cards, durable memory, and recent canon.
- **Suggested choices**: a separate post-narration model call proposes 2-4 next actions. Choices are UI affordances; the reader can ignore them and type instead.
- **Background maintenance**: after a turn is written, the runtime records events, enqueues background work, broadcasts compact turn summaries to resident agents, and lets the Showrunner / Storykeeper update the files that feed future narration.
- **File-native story state**: canon, guidance, context cards, memory, state, research notes, and agent notebooks are ordinary files. There is no vector store, RAG database, or graph database in the default runtime.

## How It Works

<p align="center">
  <img src="./assets/architecture.svg" alt="openovel dual-loop architecture: foreground narrator, file-native story substrate, asynchronous background resident team" width="100%" />
</p>

A reader turn roughly follows this path:

1. Record the reader action in the append-only scene log.
2. Trigger-match context cards and recompose `story/guidance/FOREGROUND.md`.
3. Compile the narrator context from foreground guidance, story memory, durable user preferences, and recent canon.
4. Stream one foreground narration beat.
5. Generate optional choices and run the background signal in parallel-side paths.
6. Append the narration to `story/canon/chapters.md` and record the foreground turn.
7. Enqueue background inbox items, broadcast compact turn summaries to the resident agents, and start or delegate the Showrunner / Storykeeper loop.
8. Apply background updates back into `story/frontend/*`, `story/guidance/*`, `story/context-cards/*`, `story/memory/*`, `story/state/*`, and agent-owned internal notebooks.

The narrator reads only the foreground working set and recent canon. Internal files under `story/director/`, `story/worldkeeper/`, `story/state/`, `story/packets/`, and agent domain folders are for analysis, bookkeeping, and recovery; they are not directly composed into narrator prose.

Context cards use the same `@include` composition path as foreground sections. `story/guidance/cards.auto.md` is rewritten by deterministic trigger matching before the narrator runs; `story/guidance/cards.md` is the curated durable set maintained by the background loop.

## Features

Most player-facing toggles live in Settings. Defaults below describe a fresh install unless noted.

**On by default**

- **Desktop story library**: create, rename, import, restart, delete, and export stories from the Electron app.
- **Bundled starter stories**: packaged builds can seed pre-initialized examples into an empty library.
- **Suggested choices**: a post-narration options call suggests next actions (`OPENOVEL_OPTIONS_ENABLED`).
- **Reading-paced reveal**: text can reveal at a local reading pace independent of provider streaming speed (`OPENOVEL_DISPLAY_PACING`; speed via `OPENOVEL_DISPLAY_CPM`, default 720).
- **Resident background team**: Showrunner plus specialized sub-agents run by default; set `OPENOVEL_RESIDENT_TEAM=0` to use the single Storykeeper fallback.
- **Auto context cards**: trigger-matched cards are included for the current turn without a selector model.
- **Repetition / tic control**: incremental n-gram tracking and optional operator tic patterns feed the background quality loop.
- **Novel export**: export story prose as EPUB or TXT from the story card menu.

**Opt-in / experimental**

- **Rich rendering**: per-story `ovl:<kind>` blocks render from sanitized HTML templates and scoped CSS (`OPENOVEL_ENABLE_FORMAT_CONTRACT`).
- **Media includes**: embed files from `story/includes/` through reserved `ovl:include` fences when both the toggle and contract opt-in allow it (`OPENOVEL_ENABLE_STORY_INCLUDES`).
- **Scene backdrops**: switch a prepared `story/includes/bg/` image behind the reading surface with reserved `ovl:bg` fences (`OPENOVEL_ENABLE_IMAGE_BACKGROUND`).
- **Story illustrations**: an Image agent can prepare images into `story/includes/`; this requires image-provider settings and forces rich rendering plus media includes on (`OPENOVEL_ENABLE_IMAGE_GEN`).
- **Character sheets**: when image generation is enabled, character visual references can anchor later illustrations (`OPENOVEL_ENABLE_CHARACTER_SHEETS`).
- **Narration audio**: configured TTS providers can read narration sentence by sentence with audio-synced text reveal (`OPENOVEL_ENABLE_TTS`).
- **Comic mode**: a per-story mode that asks the foreground to emit panel scripts and generates image panels as they stream (`OPENOVEL_ENABLE_COMIC_MODE`; image setup required for the full experience).
- **Fast mode**: a per-story prose mode for short bursts that move quickly to the next meaningful decision (`OPENOVEL_ENABLE_FAST_MODE`).
- **Setup voice preview**: story initialization can audition narrator voice before play begins (`OPENOVEL_ENABLE_INIT_NARRATOR_PREVIEW`).

Model-authored rich content is sandboxed. HTML block templates are sanitized into a HAST tree that the renderer walks as React elements; the renderer does not use `innerHTML`. CSS is scoped and property-filtered. Story media paths are re-validated before Electron serves bytes through the privileged asset protocol.

## Settings And Providers

For normal use, configure models in the desktop app. First launch walks through language and model access; later changes live under Settings.

Settings supports built-in providers plus custom OpenAI-compatible or Anthropic-format endpoints. Advanced settings also expose model routing, per-agent routing, model catalog edits, search provider configuration, image generation settings, and TTS settings.

Desktop stores such as API keys, Behavior toggles, Image settings, optional service settings, and TTS settings write to `$OPENOVEL_HOME/settings.local.json` (default `~/.openovel/settings.local.json`) and mirror the active values into the app process environment on startup.

General JSONC configuration for runtime and CLI-style tooling layers in this order, with later layers winning:

```text
defaults
  -> ~/.openovel/settings.jsonc
    -> .openovel/settings.jsonc
      -> .openovel/settings.local.json
        -> environment variables
```

JSONC and trailing commas are supported, along with `{env:VAR}` and `{file:path}` interpolation.

Useful diagnostics:

```bash
npm run config:doctor       # show settings layering + effective config
npm run provider:doctor     # show provider + model resolution
```

## Project Structure

```text
src/
  runtime/       shared engine: sessions, jobs, bus events, tools, permissions
  workflows/     initializer, Storykeeper / Showrunner, resident agents, memory review
  lib/           story files, narration, snapshots, paths, rich rendering, media
  context/       foreground prompt compilation and context-card activation
  provider/      provider registry, model profiles, OpenAI-compatible adapters
  electron/      desktop app: main process, preload, renderer, IPC bridge
  tools/         background tool registration
  agents/        resident agent cards (*.agent.yaml) and subagent definitions
  memory/        file-native memory provider
  search/        web search provider registry
  services/      export services for EPUB / TXT
  eval/          smoke tests, probes, model-player, judge, benchmark adapters
  config/        settings resolution and doctor
test/            node --test suites
scripts/         build, release, launch, and diagnostics helpers
resources/       bundled starter stories
story/           project-local runtime story workspace, normally gitignored
```

Main runtime path:

```text
UI -> SessionViewModel -> SessionProcessor
   -> foreground narrator -> provider
   -> BackgroundJob -> BackgroundAgentRuntime -> ToolLoop -> ToolRegistry
   -> story files
```

## Storage Model

openovel uses two roots:

```text
~/.openovel/                 user-global data
  memory/USER.md             user-owned preferences
  memory/OBSERVED.md         model-observed reader notes
  context-cards/             reusable cards
  references/                shared references
  stories/<story-id>/        normal per-story workspaces

story/                       project-local fallback story workspace
  BRIEF.md                   original story brief, written once at init
  canon/                     chapters, recent chapter mirror, append-only scene log
  frontend/                  narrator-facing section files
  guidance/                  FG_template.md, FOREGROUND.md, cards.md, cards.auto.md
  director/                  internal pacing, options, quality, and tic notebooks
  worldkeeper/               world-state agent notebook
  state/                     structured world state
  context-cards/             story-scoped cards
  inbox/                     pending and resolved background work
  memory/                    story-scoped memory and optional preferences override
  format/                    optional rich-render contract
  includes/                  optional media files for render-time includes
  research/                  search log and editable research notes
  packets/ profiles/ jobs/   diagnostics, usage profiles, background job ledger
```

`story/frontend/`, `story/guidance/`, and context cards are narrator-facing. `story/director/`, `story/worldkeeper/`, `story/state/`, `story/packets/`, and per-agent folders are internal or diagnostic inputs for background work.

`OPENOVEL_HOME`, `OPENOVEL_STORY_ID`, and `OPENOVEL_STORY_ROOT` control where stories resolve. Legacy `AI_STORY_*` variables are still accepted for compatibility.

## Commands

```bash
# interactive
npm run electron              # default desktop client, bundles renderer first
npm run electron:dev          # desktop client with devtools

# build / package
npm run build:electron
npm run dist                  # electron-builder package
npm run dist:mac
npm run dist:win
npm run dist:linux

# tests
npm test
node --test test/sessionViewModel.test.js
node --test --test-name-pattern "<regex>" test/foo.test.js

# diagnostics
npm run config:doctor
npm run provider:doctor

# evals
npm run eval:smoke -- --action "..." --expect "..." --wait-background
npm run eval:model-player
npm run eval:judge
npm run eval:ablation
npm run eval:probe
npm run eval:tms:prepare && npm run eval:tms
```

There is no separate lint step.

## Tests

`npm test` runs the Node test suite through `scripts/run-tests.mjs`. Tests should stay hermetic: no network calls, no real model invocations, and no writes outside temporary directories. For behavior changes, prefer assertions on durable file patches, scene events, or `SessionViewModel` state instead of exact generated prose.

## Contributing

Issues and focused pull requests are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development guidelines and good first contribution areas.

## Troubleshooting

- Provider routing looks wrong: run `npm run provider:doctor`.
- Settings are not taking effect: run `npm run config:doctor` to inspect the layering order.
- Renderer bundle is stale after a pull: remove `dist-electron/` and run `npm run electron`.
- macOS blocks the app after download: see [`docs/macos-gatekeeper.md`](./docs/macos-gatekeeper.md).
- A clean local story workspace: `story/` is runtime data and is normally gitignored.

## FAQ

**What is openovel?**
openovel is a local-first AI interactive fiction desktop app. It streams narration for the reader while background agents maintain the story substrate in ordinary files.

**Does it replace cloud AI-fiction tools?**
It is a bring-your-own-model alternative for people who want local story files, inspectable memory, and a runtime built for long-running interactive fiction rather than one-off chat.

**Where is my data stored?**
Story data lives under `story/` or `$OPENOVEL_HOME/stories/<story-id>/`. Global preferences and reusable memory live under `$OPENOVEL_HOME`, defaulting to `~/.openovel/`. Model calls still send the relevant prompt context to the provider you configure.

**Which models does it support?**
Use Settings -> AI -> API Keys to pick a built-in provider or add a custom OpenAI-compatible / Anthropic-format endpoint.

**What platforms does it run on?**
The maintained app is Electron desktop for macOS, Windows, and Linux. macOS currently has the most testing.

**Is openovel free and open source?**
Yes. It is released under the Apache-2.0 license.

## Acknowledgements

The dual-loop interaction model is inspired by Thinking Machines writing on interaction models. The runtime shape also borrows lessons from Claude Code, opencode, and Hermes Agent. The file-native context substrate is a deliberate departure from vector-RAG patterns common in AI-fiction tools, informed by long-run experiments with AI fiction and `fate-river`, this project's predecessor.
