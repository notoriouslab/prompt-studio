# PromptStudio for NotebookLM — Setup

A chat-first distribution of PromptStudio for **VideoExpress.ai** workflows, built as a NotebookLM notebook.

The HTML app (`prompt-studio.html`) is the visual UI and the reference implementation; this notebook is the conversational one. You describe an idea in chat, answer two or three questions, and get the finished video prompt to paste into VideoExpress — no middleman LLM step.

> This replaces the earlier Gemini Gem distribution (`docs/gemini-gem-distribution/`). Google is retiring Gems on 2026-10-20 and moving the capability into paid Skills, so the chat-first channel moved to NotebookLM, which now supports per-notebook custom instructions.

## Quick start (~10 minutes)

1. Open [NotebookLM](https://notebooklm.google.com/) and create a new notebook. Name it **PromptStudio**.
2. Add all five files from [`sources/`](./sources/) as sources (Add source → Upload → select the `.md` files; NotebookLM accepts Markdown):
   - `00-operating-manual.md` — session protocol and output contract
   - `01-core.md` — Actor Alias, dialogue speech-act wrap, duration authority, density budget
   - `02-modes.md` — the five mode schemas
   - `03-domains.md` — the nine domain rule sets
   - `04-platform-videoexpress.md` — VideoExpress platform rules (the big one)
3. Open the chat panel's **設定對話 / Configure Chat** dialog (the tune icon in the 對話 header, not the ⋮ menu), pick **自訂 / Custom**, and paste one of these into the instruction box:
   - [`CUSTOM-INSTRUCTION-EXTENDED.md`](./CUSTOM-INSTRUCTION-EXTENDED.md) — ~9,850 chars, recommended. Carries the whole protocol in the always-on layer, so behaviour does not depend on retrieval.
   - [`CUSTOM-INSTRUCTION.md`](./CUSTOM-INSTRUCTION.md) — ~4,980 chars, **frozen and behind the extended one**. Only for preset chat modes capped at 5,000 characters; it lacks the 2026-08-18 background findings. See the banner at the top of that file.

   While the dialog is open, set **選擇回覆內容長度 / response length** to **較長** — a full storyboard is a long answer.

   **This is a one-time, notebook-level setting.** It is saved with the notebook, persists across sessions, and is applied automatically to every future conversation in it — and to Studio outputs such as Audio Overview. You never paste it into the chat box.
4. Start a chat and try:

   > 我想做一支 30 秒的咖啡冷萃介紹影片

PromptStudio will ask for the missing fields (duration / mode / domain / mediaType), then emit the full prompt.

## How it works

```
You  → chat:   「我想做關於 X 的影片」
It   → you:    one numbered message asking only what is missing
You  → it:     answers
It   → you:    the final video prompt — concrete T2I + I2V text per shot
You  → VideoExpress: paste and render
```

The notebook IS the expansion agent. It applies PromptStudio's rule library — the uploaded sources — to your idea and emits the production-ready prompt in one turn. There is no second LLM and no template-then-expand step.

This stays consistent with PromptStudio's API-free philosophy: the HTML app generates meta-prompts because it has no LLM of its own; this distribution uses NotebookLM's model and emits the final prompt directly. Either way, PromptStudio never calls a video-gen API itself.

## Coverage

| Dimension | Supported |
|-----------|-----------|
| Platform | VideoExpress.ai only |
| Modes | storyboard · single-shot · first-last · avatar · short-form |
| Storyboard output modes | minimal (default) · full · runsheet (VE execution run sheet) |
| Domains | narrative-character · narrative-scene · real-interview · real-report · product-demo · educational · motion-explainer · lifestyle-vlog · editorial-cinemagraph |
| MediaTypes | live · 3d · 2d-animation · illustration |
| Output language | 繁體中文 body, dialogue preserved in the user's language |

Dogfood status: everything except `motion-explainer` and parts of the extended framing family has been run on real VideoExpress credits. Untested items are labelled as such in the sources, and the notebook is told to say so rather than imply validation.

## Where the rules come from

The rule library is calibrated on real VideoExpress runs, not on documentation. Where a rule rests on a measurement, the measurement is recorded — see [`EXPERIMENTS.md`](./EXPERIMENTS.md) for the burned-in-text campaign (~70 clips, 2026-08-16 → 08-18), including the arms that refuted earlier rules. Rules live in `sources/`; evidence lives in `EXPERIMENTS.md`. When the two disagree, the evidence wins.

## NotebookLM-specific notes

- **Custom instruction cap**: 5,000 characters in the preset modes, 10,000 in Custom mode. The extended block is ~9,880 and the short one ~4,980, both sized to fit with a small margin; `00-operating-manual.md` carries the same protocol on the source side. If you edit a block, re-count it — the field truncates silently.
- **Grounding behaviour**: NotebookLM defaults to answering *about* its sources. The custom instruction explicitly reframes the sources as a rulebook and authorizes generating new text. If it ever starts summarizing the documents instead of writing a prompt, say 「照 00-operating-manual 的流程，直接產出 prompt」 and it snaps back.
- **Citation chips**: NotebookLM may attach citation markers to its answers. The instruction tells it not to write citation text inline, but the UI chips are outside the model's control — select the prompt text itself when copying.
- **Chat limits**: the free tier allows 50 chats/day and 50 sources per notebook. This notebook uses five sources.
- **Saved history**: conversations persist since January 2026, so an iteration thread on one video project stays available across sessions.
- **No code blocks**: the sources tell the model to emit plain rendered markdown. That is deliberate — you copy by mouse-selecting, and code blocks make long prompts harder to grab cleanly.

## Updating the notebook

The sources are generated from the same rules as `prompt-studio.html`. When the HTML app's rules change, update the matching source file and re-upload it (NotebookLM replaces a source in place via **Source → ⋮ → refresh/replace**, or delete and re-add). The custom instruction only needs re-pasting when the protocol itself changes, which is rare.

## When to use the HTML app instead

- You want to save, diff, or version prompt specs (the app has presets, templates, versions, and snapshot tests).
- You want to add your own platform with its own rule block.
- You want the full review structure side by side with the raw spec.
