<div align="center">

# PromptStudio

[![License](https://img.shields.io/github/license/notoriouslab/prompt-studio?style=flat-square)](LICENSE)
[![Single-file HTML](https://img.shields.io/badge/Single--file-HTML-orange?style=flat-square)]()
[![No build](https://img.shields.io/badge/No-Build-7C3AED?style=flat-square)]()
[![Local-first](https://img.shields.io/badge/Local--first-localStorage-blue?style=flat-square)]()
[![Last Commit](https://img.shields.io/github/last-commit/notoriouslab/prompt-studio?style=flat-square)](https://github.com/notoriouslab/prompt-studio)

**Turn one idea into production-ready prompts for VideoExpress.ai.**

Built for and tested on **VideoExpress.ai** · single-file HTML · local-first · no build · no account

[繁體中文](./README.zh-TW.md)

![PromptStudio](./docs/intro.jpg)

</div>

---

## Why PromptStudio?

Writing prompts for AI video tools is messy. Characters drift between shots. Chinese dialogue gets rendered as floating subtitles. The official one-size-fits-all workflows leave no room for directing.

PromptStudio bakes real-run-calibrated VideoExpress best practices into an orthogonal **Mode × Platform × Domain × MediaType** matrix. Pick the combination, fill in the idea, get a system prompt — feed it to your LLM (Claude / GPT / Gemini) and the LLM expands it into a production-ready storyboard or single-shot script you can paste straight into VideoExpress.

> **Honesty note**: every pattern in this tool is dogfooded on VideoExpress.ai with real video-gen credits. Support for other platforms was removed rather than shipped untested — you can still add your own platform (with its own `customPromptBlock`) in the Platform registry.

### Three differentiators

| Feature | How it works |
|---|---|
| **Real-run-calibrated syntax** | The VideoExpress `customPromptBlock` reflects actual generation runs (timing syntax, lipsync dialogue routing, per-shot actor re-description), not just docs. |
| **Cross-shot identity safety** | Built-in **Actor Alias dual-track** convention (`Actor 1, the 50-year-old host in a dark blue suit`) anchors character identity to visual traits, not names. Dialogue gets wrapped as a speech act (`says in a confident, clear Mandarin accent: "..."`) so Chinese lines route to TTS rather than appearing as on-screen subtitles. |
| **Two-layer regression-tested** | L1 snapshot tests (14 cases) guarantee spec byte-stability. L2 LLM eval (5 cases, regex assertions, free Gemini tier) verifies the rules actually land with a real LLM. Reproducible baselines ship in [`samples/eval/`](./samples/eval/). |

---

## Quick Start

1. Clone or download [`prompt-studio.html`](https://raw.githubusercontent.com/notoriouslab/prompt-studio/main/prompt-studio.html)
2. Open it in any modern browser — no install, no server, no account
3. Pick **Mode** / **Platform** / **Domain** / **MediaType**, fill in your idea
4. Copy the generated prompt → feed it to your LLM → paste the LLM output into the video-gen tool

```bash
git clone https://github.com/notoriouslab/prompt-studio.git
open prompt-studio/prompt-studio.html
```

---

## Supported Platform

| Platform | Modes | Highlight |
|---|---|---|
| **VideoExpress.ai** | storyboard / single-shot / first-last / avatar / short-form | full pipeline (6-9 shots), lipsync, consistent character, first/last frame — every rule dogfooded on real runs |

Need another platform? Add it yourself in the Platform registry (name, families, modes, and a custom prompt block) — it will show up in the selector alongside VideoExpress. Earlier registry entries for other platforms (Sora 2 / Veo 3.1 / Runway / Kling / Seedance / Talkingphotos / HeyGen / TikTok) were removed in favor of shipping only what is actually tested; they remain recoverable from git history.

## Supported Content Types

**5 modes × 9 domains × 4 mediaTypes**:

| Domain | Use case |
|---|---|
| `narrative-character` / `narrative-scene` | drama, epic, fiction |
| `real-interview` / `real-report` | KOL interview, documentary |
| `product-demo` | e-commerce, unboxing |
| `educational` | tutorials, knowledge content |
| `motion-explainer` | motion-graphics explainer (shapes, icons, kinetic type) |
| `lifestyle-vlog` | travel, food, pet |
| `editorial-cinemagraph` | living poster, subtle-motion poster |

MediaType: **3D Animation** / **Live Action** / **2D Animation** / **Illustration**

Mode: **Storyboard** (full / minimal / VE run sheet) / **Single-Shot** / **First-Last** (frame-pair transition, maps to VE's First Frame Last Frame Beta) / **Avatar** / **Short-Form**

---

## Features

### Live prompt preview
The "Real-time Prompt" pane updates as you change any field.

### Output modes
Storyboard mode has three output styles — **Full** (8 sections including Character Bible, Emotional Arc, Continuity Lock) for production review, **Minimal** (2 sections, paste-ready) aligned with VideoExpress's compact format, or **VE Run Sheet**: an execution run sheet (frozen character bible, per-scene 3-field prompts with the <100-char Actor Script limit, settings checklist calibrated on real runs) that a browser agent — Claude in Chrome, Claude Code, ChatGPT agent mode — can execute against app.videoexpress.ai via the [official VideoExpress agent workflow](https://github.com/strontiumplatform/VideoExpress.ai-Full-Length-Consistent-Character-Realistic-Talking-Avatar-Video-Workflow), replacing its auto-written script with your directed one. The same sheet doubles as a manual copy-paste checklist for users without an agent.

### Template + version management
Save / load builder presets, track multiple versions per template.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Cmd/Ctrl + Z` | Undo builder changes |
| `Cmd/Ctrl + Shift + Z` / `Ctrl + Y` | Redo |
| `Cmd/Ctrl + S` | Save Version (template selected) |

### Bilingual UI
🌐 EN / 中 toggle (bottom of Advanced section).

### Custom rules
Add per-session rules that layer on top of Tier 3 style hints.

### Local-first
All state lives in `localStorage`. No cloud, no account, no server.

---

## Validation

Two automated layers + one manual layer:

| Layer | Validates | Tool | Cost |
|---|---|---|---|
| **L1** | Spec text byte-stability | `snapshot-test.js` (14 cases) | Free / instant |
| **L2** | LLM follow-through on spec rules | `eval.js` (Gemini 2.0 Flash + regex assertions) | Free (Gemini free tier) |
| **L3** | Real video-gen output matches intent | Human dogfood + reference | Real video-gen credits |

[`samples/eval/`](./samples/eval/) ships baseline Gemini outputs from L2 — concrete proof that spec rules take effect when fed to a real LLM.

```bash
node snapshot-test.js              # L1 (no API key needed)
node eval.js                       # L2 (GEMINI_API_KEY required)
```

Get a free `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). `eval.js` reads it from `~/.paiop_secrets.json` by default.

---

## Local Expand (optional local LLM bridge)

If [ollama](https://ollama.com) is running on your machine, the page auto-detects it and shows a "🖥️ Local Expand" section: type an IDEA, click once, and the generated prompt is expanded by your local model (e.g. `qwen3.8:27b`) with streaming output — no copy-pasting into another AI agent.

- Serve the page from localhost (ollama's default CORS allowlist only covers localhost origins). Double-click **`PromptStudio.command`** (macOS) or **`PromptStudio.bat`** (Windows) — starts the server and opens the browser — or manually:
  ```bash
  cd prompt-studio && python3 -m http.server 8765
  open http://localhost:8765/prompt-studio.html
  ```
- Opening via `file://` or a remote domain requires setting `OLLAMA_ORIGINS` on the ollama side (e.g. `launchctl setenv OLLAMA_ORIGINS "*"` then restart ollama)
- Three input types — IDEA / Screenplay / Concept→Script: pasting a screenplay triggers the Screenplay Input Protocol (dialogue verbatim, scenes split into shots, characters mapped to Actor N, dialogue mode auto-on); Concept→Script first drafts a screenplay locally (screenwriting rules condensed from the MIT-licensed [AI-drama-pound](https://github.com/POUND0423/AI-drama-pound), duration & aspect injected from your settings), which you review and move over in one click
- After an expansion a Revise row appears: type a critique (e.g. "shot 5 lacks in-motion environmental flow") and the model rewrites the full output with the complete rulebook still in context — iterate as many rounds as needed
- When ollama is detected the Live Prompt body starts collapsed (buttons and word count stay; click ▸ to expand) — in the local flow it is only an intermediate artifact
- When no ollama endpoint is found the section stays hidden; the classic template-copy workflow is untouched

---

## Privacy

| Thing | Where it lives |
|---|---|
| Builder state, templates, versions | Browser `localStorage` only |
| Generated prompts | In-memory only |
| LLM expansion | Your choice of LLM; PromptStudio calls no LLM by default (Local Expand is opt-in and only talks to your own `localhost` ollama) |
| Validation eval | Optional, runs on your machine with your own `GEMINI_API_KEY` |

No analytics. No telemetry. No cloud sync. No account.

---

## Design Principles

- **Mode × Platform orthogonality** — mode shapes scaffolding, platform injects syntax
- **Rule once-only** — every rule lives in exactly the highest-weight Tier
- **Local-first** — `localStorage` only, zero cloud
- **Single-file** — one HTML, no build pipeline, no module resolution

---

## Contributing

Spec rule changes should keep both validation layers green:

```bash
node snapshot-test.js && node eval.js
```

New platform / domain / mediaType: edit the corresponding const in `prompt-studio.html` (`db.platforms` / `DOMAINS` / `MEDIATYPES`). They are single sources of truth — one edit propagates to the HTML form, i18n, rule lookups, and the prompt() hint.

---

## License

[MIT](./LICENSE) © 2026 notoriouslab
