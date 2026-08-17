# Experiment log — burned-in text on VideoExpress

Full record of the 2026-08-16 → 08-18 campaign. The **rules** derived from it live in `sources/01-core.md §10`; this file keeps the **process**: what was run, how many times, what it showed, and which hypotheses died. If a rule in §10 ever looks wrong, the raw grouping is here to re-examine.

All runs: VideoExpress `Create Video From Prompt`, 16:9, 8s requested, `Automatically enhance my video prompt` **off** (the enhancer rewrites the prompt and would void every comparison), `Automatically enhance my image prompt` off after the hero image was saved.

## The phenomenon

Garbled Chinese glyphs appear across the bottom ~12% of the frame. They are not a caption track: the characters are malformed, which is the signature of the video model *drawing* text rather than a captioner *rendering* it. There is no platform setting that produces or suppresses them (UI audit below).

## Results by arm

| # | First frame | Dialogue line | Where the line lived | Runs | Text | Rate |
|---|-------------|---------------|----------------------|------|------|------|
| A | kitchen woman, wooden counter, mug in hand | `這杯咖啡我等了一整個早上。` | inline, ASCII `"..."` | 3 | 0 | 0% |
| B | same | same | inline, curly `“...”` | 3 | 0 | 0% |
| C | same | same | **Actor 1 Script**, Lipsync HD **on** | 3 | 2 | 67% |
| P1 | news reporter, plain grey studio wall | 40-char news-report line | inline, `台詞：「…」`, 新聞播報 genre token | 3 | 0 | 0% |
| D/T1-T4 | café host behind counter holding iced coffee (T4: kitchen woman) | `你喝過冷萃咖啡嗎，今天帶你認識它的魅力。` | inline | ~8 | ~7 | ~88% |
| L2 | kitchen woman | `這杯冷萃我從早上等到現在，味道真的不一樣。` | inline | 12 | 4 | 33% |
| A′ | kitchen woman | `這杯咖啡我等了一整個早上。` (A repeated at n=10) | inline | 10 | 4 | 40% |
| H | kitchen woman | promo hook line | inline | 10 | 5 | 50% |
| S1 | **plain studio wall**, hands out of frame, no props | promo hook line | inline | 5 | 0 | **0%** |
| S2 | **plain studio wall**, both hands holding a glass of iced coffee | promo hook line | inline | 5 | 0 | **0%** |
| W | outdoor sidewalk, blurred street, walking, glass in hand, reverse dolly | promo hook line | inline | 5 | 1 | 20% |

Totals: ~70 clips.

## What the numbers say

**Line held constant, image varied** — the decisive comparison:

- café counter frame → ~88% (≈7/8)
- plain wall frame → 0% (0/10 across S1+S2)
- Fisher exact ≈ **0.003**

**Image held constant, line varied** — kitchen woman across three registers:

- safe statement 4/10 · product statement 4/12 · promo hook 5/10
- 5/10 vs 4/10 → Fisher **p = 1.0**. No effect.

**Aggregate by background**: plain wall 0/13 · outdoor 1/5 · interior counter 20/35+ · retail counter ~7/8. Plain wall vs all staged locations: Fisher ≈ **0.002**.

## Hypotheses killed, and how

| Hypothesis | Killed by | Note |
|-----------|-----------|------|
| Quote style: ASCII vs curly | A vs B, 3+3, both 0 | The platform's own Text-To-Video example uses curly quotes |
| Prompt body language: English body + Chinese line | promo line failed 4/4 with a fully 繁體中文 body | |
| Punctuation `？！` | the failing line retested with `，。` still failed | |
| Beat structure / missing closing micro-action | 2-, 3- and 4-beat variants all failed | |
| Dialogue register: promo hook vs in-scene statement | H vs A′ on a matched image, 5/10 vs 4/10, p = 1.0 | **Looked like a huge effect until the image was matched.** The earlier promo-line runs had used a different first frame. Textbook confounding — and it had already been written into the rules before the matched test caught it |
| Lipsync pipeline as the cause | C 2/3 vs the same image's 31% baseline → p ≈ 0.24 | Not established either way; would need ~15 runs |
| Props / hands in frame | S2 (product held, plain wall) 0/5 | Rules out the held object, the visible hands and the product itself |
| 2026-05-20 note: bare quoted text becomes subtitles | P1 stacked every suspected trigger, 0/3 | Never reproduced |

## What survived

1. **The background of the first frame decides it.** Plain wall 0/13 versus staged locations 20/43.
2. Which trait of a staged location matters — the horizontal surface in the lower band, the scene depth, or the commercial register — is **not isolated**. They co-occurred in every failing frame.
3. The text always lands in the bottom ~12%, so a bottom crop removes it deterministically.
4. Re-rolling and re-generating the first frame change the outcome; rewriting the sentence does not.

## Platform UI audit (2026-08-16/17)

Walked every surface looking for a caption control. There is none.

- **Create Video From Prompt** — Lipsync HD · Narration · Video Only · public gallery · Advanced Mode (enhance video prompt + Manual Video Length 3-10s, default 5). Ticking Lipsync disables the Video and Audio Prompt field and hides Advanced Mode, so the length must be set *before* ticking Lipsync.
- **Text To Video** — Simple: Video Prompt + Actor 1 Script + Add Actor 2 with a character counter. Advanced: one free-form prompt with dialogue inline. Two actor slots only.
- **First Frame, Last Frame (Beta)** — three prompt fields.
- **Create Lipsync Audio** (second step, opens after Create Video) — no caption control. Confirmed by the user, not by the audit, which could not open it without starting a generation.
- **Export Video** — File name · Quality · Resolution · Format.
- **Automatic Captions** in the editor's right rail opens an external third-party service (vidsubtitleapp.com). Not part of generation, nothing applied by default.

## Side findings

- Non-Lipsync inline dialogue produces audible speech with good mouth sync — nine clips confirmed. The Lipsync path is not required for talking video.
- **Reverse dolly walk-and-talk works**: camera ~3m ahead at chest height retreating at matched pace; walking motion, background parallax and to-camera dialogue all rendered correctly in one 8s clip.
- Actual clip length follows the audio when Lipsync is on (an 8s request yields 4.5-6s).

## Method notes for the next campaign

- **Find a positive control first.** The first A/B was run on a scene whose base rate was near zero; six clean clips taught nothing. A comparison is only informative where the failure actually occurs.
- **Match every arm on the image.** The one confound that produced a wrong rule was an unmatched first frame.
- **n=3 is not a result.** Two conclusions were written and then withdrawn off three-run arms. Ten runs per arm was the point where the picture stopped moving.
