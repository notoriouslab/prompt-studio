# PromptStudio Gemini Gem — Setup

> **⚠️ Deprecated (2026-08-16).** Google is retiring Gemini Gems on 2026-10-20 and moving the capability into paid Skills. The chat-first channel has moved to **[`../notebooklm-distribution/`](../notebooklm-distribution/)**, which is also the only version kept in sync with `prompt-studio.html`. This directory is frozen at its 2026-05-27 rule set (no first-last mode, no run sheet output, 8 domains, pre-duration-authority shot counts) and is kept for reference only.

A chat-first distribution of PromptStudio for **VideoExpress** workflows.

The HTML app (`prompt-studio.html`) covers 9 platforms with a visual UI; this Gem covers VideoExpress — the platform the author uses daily — with conversational input.

## Quick start (~5 minutes)

1. Open [Gemini](https://gemini.google.com/) and go to **Gems** → **New Gem**
2. **Name**: `PromptStudio`
3. **Instructions**: paste the entire contents of [`INSTRUCTION.md`](./INSTRUCTION.md)
4. **Knowledge**: upload all four files from [`knowledge/`](./knowledge/):
   - `core.md`
   - `modes.md`
   - `domains.md`
   - `platform-videoexpress.md`
5. **Save** the Gem

That's it. Open a chat with the Gem and try:

> 我想做一支 30 秒的咖啡冷萃介紹影片，用 VideoExpress

The Gem will ask 2-3 clarifying questions (mode / domain / mediaType), then emit the **final video prompt** — concrete T2I + I2V text for every shot — that you copy and paste directly into VideoExpress. No middleman LLM step.

## How it works

```
You → Gem chat:        "我想做關於 X 的影片"
Gem  → You:            2-3 clarifying questions (mode / domain / mediaType)
You  → Gem:            answer
Gem  → You:            ```markdown
                       <final video prompt with concrete T2I + I2V text per shot>
                       ```
You  → VideoExpress: paste and render
```

The Gem IS the expansion agent — it applies PromptStudio's rule library (the uploaded knowledge files) to your idea and emits the production-ready video prompt in one turn. No second LLM, no template-then-expand step.

This is consistent with PromptStudio's [API-free philosophy](../../README.md): the HTML app (`prompt-studio.html`) generates meta-prompts because it has no LLM of its own; the Gem distribution uses Gemini as the LLM and emits the final prompt directly. Either way, you own the workflow and the video-gen platforms are not called from inside PromptStudio.

## File layout

```
docs/gemini-gem-distribution/
├── README.md                          ← you are here
├── INSTRUCTION.md                     ← Gem instructions (paste into Gem)
└── knowledge/
    ├── core.md                        ← Actor Alias, dialogue framing, output modes
    ├── modes.md                       ← storyboard / single-shot schemas
    ├── domains.md                     ← 8 domain rule sets
    └── platform-videoexpress.md       ← VideoExpress-specific rules
```

## Coverage

| Dimension | Supported |
|-----------|-----------|
| Platforms | VideoExpress |
| Modes | storyboard, single-shot |
| Domains | narrative-character, narrative-scene, real-interview, real-report, product-demo, educational, lifestyle-vlog, editorial-cinemagraph |
| MediaTypes | live, 3d, 2d-animation, illustration |
| Output modes | minimal (paste-ready 2 sections), full (8 sections with review structure) — storyboard only |

For the other 8 platforms (TalkingPhoto / Seedance / Runway / Kling / Sora 2 / Veo 3.1 / HeyGen / TikTok), use the HTML app `prompt-studio.html`. TalkingPhoto's avatar workflow lives in the HTML app — it's a poor fit for chat-first input, so it was dropped from this Gem.

## Extending

Adding a new platform later:

1. Create `knowledge/platform-<name>.md` following the structure of the existing `platform-videoexpress.md`
2. Update `INSTRUCTION.md` Router with the new platform → mode mapping
3. Re-upload the changed files to your Gem (Gem auto-picks up the latest versions for Drive-linked files; for direct uploads, re-upload)

6 of the 10 knowledge-file slots are free, so 6 more platforms fit within Gem's file budget.

## License

MIT — same as the parent repo. Fork, modify, ship.
