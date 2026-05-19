# Eval Samples (L2 Validation Baseline)

This directory holds **L2 validation baseline samples** — real LLM output captured from running PromptStudio's eval pipeline.

## What these are

Each `.md` file is produced by:

1. Running PromptStudio's `generatePrompt(state)` to produce a system prompt spec
2. Feeding the spec + a test idea to Google Gemini 2.0 Flash
3. Capturing Gemini's expanded production-ready output
4. Running regex assertions to verify the spec rules took effect

Each sample contains:

- **Input state** — mode / platform / domain / mediaType / etc.
- **Test idea** — the user-provided prompt that gets expanded
- **Assertion results** — pass/fail per regex check
- **Gemini expanded output** — the full LLM-produced storyboard / single-shot / etc.

## Purpose

1. **Reference baseline** — show what well-formed PromptStudio output looks like
2. **Open-source proof** — demonstrate that spec rules (dialogue speech-act wrap, Actor Alias double-track, minimal mode section purging, MEDIATYPES-driven T2I/I2V base aesthetics) actually get followed by a real LLM
3. **Debug aid** — when assertions fail or output looks off, compare current run against these samples to spot drift

## How to regenerate

```bash
# from PromptStudio/
node eval.js --save-samples
```

Requires:
- Node 18+ (for native `fetch`)
- `~/.paiop_secrets.json` with `GEMINI_API_KEY` set
- Gemini 2.0 Flash free tier (15 req/min) — no payment needed

LLM output is non-deterministic; rerunning will produce different samples each time. The assertion results should remain stable as long as the spec rules in `prompt-studio.html` are not changed.

## Last regenerated

2026-05-19 — 5 cases, 8/8 assertions passed (2 cases have no assertions, human-review only).

## Cases

| Case | Mode | Platform | Domain | MediaType | Assertions |
|---|---|---|---|---|---|
| `videoexpress_real_interview_dialogue` | storyboard (full) | VideoExpress | real-interview | 3d | dialogue_wrap / actor_alias / full_section_count |
| `videoexpress_minimal_dialogue` | storyboard (minimal) | VideoExpress | real-interview | 3d | dialogue_wrap / actor_alias / minimal_section_purge / minimal_section_count |
| `sora2_single_shot_dialogue` | single-shot | Sora 2 | narrative-character | live | dialogue_wrap |
| `veo3_single_shot_narrative` | single-shot | Veo 3.1 | narrative-scene | live | — (human review) |
| `cinemagraph_illustration_kyoto` | single-shot | Sora 2 | editorial-cinemagraph | illustration | — (human review) |

## Validation layer overview

PromptStudio uses three layers of validation:

| Layer | What it validates | Tool | Cost |
|---|---|---|---|
| **L1** | Spec text is deterministic and stable | `snapshot-test.js` (14 cases) | Free / automatic |
| **L2** | LLM follows the spec rules when expanding | `eval.js` (this dir) | Free (Gemini 2.0 Flash free tier) |
| **L3** | Final video-gen output matches intent | Manual dogfood + ground-truth references | Real video-gen credits |

L1 catches structural regressions immediately on every commit. L2 catches semantic regressions when spec wording becomes ambiguous or rules stop landing with the LLM. L3 is reserved for milestone validation (after major spec overhauls) and is owned by the human operator.
