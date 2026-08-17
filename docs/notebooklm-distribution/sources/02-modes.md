# Modes

Schema for each mode. Pick one mode from the user's intent (routing rules in `00-operating-manual.md`).

| § | Mode | One-line purpose | Typical duration |
|---|------|------------------|------------------|
| §1 | `storyboard` | multi-shot plan; three output modes (minimal / full / runsheet) | 15-180s |
| §2 | `single-shot` | one T2I + I2V pair | 5-15s |
| §3 | `avatar` | single-character talking-head segment, script-driven | any |
| §5 | `first-last` | one before/after frame pair + transition (VE First Frame Last Frame Beta) | 5-15s |
| §6 | `short-form` | 9:16 hook-driven vertical plan | 15-45s |

§4 holds the MediaType bases (`t2iBase` / `motionBase` / `visualLock`) that every mode references.

---

## §1 storyboard

Full multi-shot video plan with character continuity and timestamps. Used for VideoExpress when the user wants a complete production-ready storyboard.

### §1.1 Storyboard Hard Constraints (Tier 1)

- Output must contain ALL required headings in the exact order listed in Output Format.
- Timestamps must be continuous with zero gaps. Format: `00:00-00:05`.
- No single shot duration exceeds 10 seconds.
- **Total runtime must land inside the user-selected duration** — choose shot count and per-shot seconds so they sum into that range (`01-core.md §6`).
- **ONE primary action beat per shot.** If describing what happens needs more than one sentence, split it into two shots (`01-core.md §7`).
- **Size each spoken line to its shot's seconds** — ~2 spoken words per second, tighter for 中文 per `01-core.md §3`. A shot that speaks does little else.
- **Freeze the world's facts across shots**: location, time of day, weather, wardrobe, props and their scale stay identical unless the user asked otherwise or the plan declares an arc up front. Only the wording, framing, action and cited traits vary (`01-core.md §9`). A time-of-day progression is decided during clarify, never improvised per shot.
- **Scale-lock every prop with a wide size range** — numeric dimension, downgraded modifier, surface plus hand anchor, size token repeated in every shot the object appears (`01-core.md §8`).
- Speaking shots use close-up to waist-up framing. Non-speaking shots may widen slightly but central subject stays readable.
- If `dialogue = true`: per-shot quoted dialogue ≤ 120 characters; split longer lines into multiple shots. Wrap as speech act per `01-core.md §3`. **NEVER use character Name in T2I / I2V prompt bodies — Actor Alias only.**
- If `dialogue = true`: vary the `<tone>` adverb across shots to avoid monotone delivery.
- If `dialogue = false`: prefer no dialogue. Any unavoidable line is short and isolated to one stable shot.
- **No burned-in text, by default and without asking** (`01-core.md §10`): dialogue only ever appears inside a speech-act wrap; the words subtitle / caption / lower third / text overlay / 字幕 never appear in a prompt, not even negated; genre tokens that drag captions along (news broadcast, TikTok, kinetic typography) are replaced by physical staging; text-bearing objects stay out of frame or are specified blank. Use positive cleanliness tokens instead: unmarked frames, plain unbranded surfaces, uncluttered compositions.
- Apply universal avoidances per `01-core.md §5`.

### §1.2 Storyboard Output Format

Storyboard has three output modes (`01-core.md §4`). **`minimal` is the default** and is specified here; `full` is §1.2b and `runsheet` is §1.2c. Emit the sections of exactly one output mode.

### §1.2a minimal (DEFAULT) — paste-ready

Required sections in this exact order:

1. `# Actor Portrait Image Descriptions`
2. `# Scenes, Storyboard And Generation Prompts` (N shots)

NO other sections. NO Name field anywhere — Actor Alias only.

#### Actor Portrait section

Per recurring actor, emit one detailed paragraph hitting **8-10 descriptive dimensions**. A 4-5 dimension portrait is too thin — VideoExpress relies on rich actor portraits to stabilize identity. Default template:

```
Actor N: <t2iBase> of a <age>-year-old <ethnicity / nationality> <gender + role>, <facial feature 1>, <facial feature 2>, <skin / complexion>, <hair style + color>, wearing <clothing top> <fabric / color>, <held object if applicable e.g. "holding a small black wireless handheld microphone near her chest">, <framing — for talking-head use literal "framed from head to waist">, <hands visible note when natural>, <angle — "front-facing three-quarter angle" or "three-quarter angle">, <background>, <lighting — e.g. "soft city street daylight" / "warm practical café lighting" / "dimly lit studio with warm accent lighting">, shallow depth of field, wide <aspectRatio> composition, clean unmarked background, plain unbranded surfaces.
```

Example (talking-head reporter, from VideoExpress dogfood):

> Actor 1: Cinematic medium shot portrait with highly detailed natural facial features of a 28-year-old female Taiwanese news reporter, professional and approachable, clear expressive eyes, light olive skin texture, styled shoulder-length dark hair, wearing a sleek navy blue blazer over a cream blouse, holding a small black wireless handheld microphone near her chest, framed from head to waist, front-facing three-quarter angle, soft city street daylight, shallow depth of field, wide 16:9 composition.

Example (street pedestrian, same source):

> Actor 2: Cinematic medium shot portrait with highly detailed natural facial features of a 34-year-old Taiwanese male pedestrian, realistic skin texture with slight stubble, expressive dark brows, neat short black hair, wearing a casual gray linen button-up shirt, hands visible near hips, clear and slightly thoughtful eyes, three-quarter angle, background of a bustling Taipei street, soft practical lighting, shallow depth of field, wide 16:9 composition.

Counted dimensions in those examples: 8-11 each. Avoid emitting 4-5 dimension portraits like `Actor 1: ... female reporter, microphone in hand, chest-up view, stable composition, clear expressive face, clean unmarked background.` — that's too thin for VideoExpress to lock identity reliably.

This paragraph IS the Continuity Anchor referenced in subsequent shots (per `01-core.md §2`).

#### Per-shot format

Use `## Shot N` H2 + bulleted fields (NOT a table). Exactly four bullets, in order:

- `**Time:** 0:00-0:06`
- `**Duration:** 6s`
- `**Text-To-Image Prompt:** <t2iBase> of <Actor Alias>, <short continuity anchor>, <framing> maximum, in <setting>, <action / pose>, stable composition, clear expressive face[, mouth visible if dialogue], <lighting>, <visualLock>, wide <aspectRatio> composition, clean unmarked frame.`
- `**Image-To-Video Prompt:** [0-N seconds]: Stable <framing> shot shows <Actor Alias>, <short continuity anchor>, <concrete action>. [N-M seconds]: <next beat action>. [M-... seconds]: <final beat — speech-act wrap per 01-core.md §3 if dialogue, otherwise final action>.`

Timestamps continuous with zero gaps across consecutive shots.

#### Shot duration & I2V time-split (calibrated from VideoExpress native generator)

Shot duration is **5-9s, picked by content — DO NOT lock all shots to the same duration**:

- **5-6s** — pure action shot, no dialogue, simple beat
- **8s** — single dialogue line + lead-in action + closing micro-action
- **9s** — multi-beat dialogue + interaction + closing micro-action
- **HARD CAP: 10s per spot** (VideoExpress platform limit)

A storyboard of 6 shots that are ALL 8s is a code-smell — it means you defaulted instead of picking by content. Mix durations: e.g. `6s / 8s / 8s / 9s / 8s / 9s` for a dialogue-heavy interview.

#### I2V time-split — closing micro-action buffer (Shape A required, Shape B optional)

**Critical (2026-05-20 dogfood learning):** in **Shape A (Narrative)** content, when dialogue occupies the absolute final beat with no buffer after, the video model often fills the leftover time with an unwanted **sigh / breath / shrug**. Solution: dialogue is the **second-to-last beat**, with a short **closing micro-action beat (0.5-1s)** explicitly specified.

In **Shape B (Talking-Head Reporter)**, the closing buffer is **optional** — host holding professional eye contact on camera after dialogue is the model's default behavior. VideoExpress's native talking-head generator routinely emits dialogue in the absolute final beat (e.g. `[4-8] seconds: ... says in an informative, engaging Taiwanese Mandarin accent: "..."`) without sigh artifacts. See `04-platform-videoexpress.md Content shape detection` to decide which shape applies.

**Shape A dialogue beat structure** (dialogue in second-to-last beat + closing micro-action):

| Shot length | Beats | Example structure |
|-------------|-------|-------------------|
| 6s | 3 beats | `[0-2]` lead-in + `[2-5]` dialogue (3s) + `[5-6]` closing micro-action (1s) |
| 8s | 4 beats | `[0-2]` lead-in + `[2-4]` preparation + `[4-7]` dialogue (3s) + `[7-8]` closing micro-action (1s) |
| 9s | 4 beats | `[0-2]` lead-in + `[2-4]` preparation + `[4-8]` dialogue (4s) + `[8-9]` closing micro-action (1s) |

**Shape B dialogue beat structure** (dialogue in final beat is fine):

| Shot length | Beats | Example structure |
|-------------|-------|-------------------|
| 6s | 3 beats | `[0-2]` lead-in + `[2-4]` preparation + `[4-6]` dialogue (2s, ~10-15 字) |
| 8s | 3 beats | `[0-2]` lead-in + `[2-4]` preparation + `[4-8]` dialogue (4s, ~30-40 字) |
| 9s | 3 beats | `[0-2]` lead-in + `[2-4]` preparation + `[4-9]` dialogue (5s, ~35-45 字) |

**Non-dialogue shot beat structure** (no closing buffer needed):

| Shot length | Beats | Example structure |
|-------------|-------|-------------------|
| 5s | 2 beats | `[0-2]` + `[2-5]` |
| 6s | 3 beats | `[0-2]` + `[2-4]` + `[4-6]` |
| 8s | 3 beats | `[0-2]` + `[2-4]` + `[4-8]` |
| 9s | 3 beats | `[0-3]` + `[3-6]` + `[6-9]` |

Each beat is 1.5-4 seconds of one sub-action. **Avoid 5-second beats.**

**Closing micro-action examples** (the 0.5-1s beat right after dialogue):

- `[7-8 seconds]: Actor 1 holds steady eye contact with the camera as the moment settles.`
- `[7-8 seconds]: Actor 1 closes her mouth gently, maintaining a professional posture.`
- `[8-9 seconds]: Actor 2 holds his thoughtful expression, hands still on the table.`
- `[7-8 seconds]: Actor 1 maintains her engaging smile, the city lights softly glowing behind her.`

**Anti-pattern (causes sigh / breath filler):**

- `[4-8 seconds]: ... and says in a warm, peaceful natural Mandarin accent: "上帝會一直保護我們。"` ← dialogue is final beat, no buffer; model auto-generates sigh in remaining ~1s

**Correct (calibrated):**

- `[4-7 seconds]: ... and says in a warm, peaceful natural Mandarin accent: "上帝會一直保護我們。"` 
- `[7-8 seconds]: Actor 1 holds her warm gaze on her daughter, gentle bedside lamp light flickering softly.`

#### T2I boilerplate

Every T2I MUST include the literal phrase **`stable composition, clear expressive face`** (acts as stability anchor for VideoExpress). When the shot includes dialogue, also add **`mouth visible`** right after `clear expressive face` (hint for lipsync rendering).

#### Continuity Anchor per shot

Per `01-core.md §2`, use the **short form** of the Continuity Anchor inside per-shot T2I and I2V — `Actor 1, the elderly watchmaker with wire-rimmed glasses` is sufficient. **Vary which 1-2 traits get cited across shots** (paraphrase the short form), but keep Actor Alias + age range identical. Do NOT repeat the full Character Bible / Actor Portrait paragraph inside every shot — that's redundant noise.

#### Framing keyword

**Default framing family** — use one of these framing words plus the literal suffix **`maximum`** when it specifies the closest-allowed framing for that shot:

- `close-up maximum`
- `medium close-up` (no maximum suffix; this is the loosest VideoExpress-friendly framing)
- `chest-up maximum`
- `waist-up maximum`

Framing CAN vary across shots within this family.

**Extended framing family** (Shape A Narrative drama only — Shape B Talking-Head stays locked to its literal framing string per `04-platform-videoexpress.md`):

- `worm's-eye view` · `god's-eye top-down` · `aerial drone perspective` · `over-the-shoulder` · `first-person POV` · `orbital camera` · `handheld tracking` · `full-body wide framing`

These were originally banned but 2026-05-24 dogfood validated all of them at 65-85 quality scores when written with the **Director Gaze framework** (three director questions + numerical spatial parameters + subject-camera gaze rule + actor pose lock + time-bound motion). See `04-platform-videoexpress.md § Director Gaze framework` before using any of these — bare keyword usage without framework under-renders to 50-60. NEVER use these in Shape B Talking-Head storyboards (interview/reporter/podcast).

Do NOT use `macro` or `dolly zoom` as bare keywords — these remain unvalidated.

### §1.2b full — review structure

Emitted only when the user asks for 完整版 / full / 分鏡表 / character bible / review 結構. All shot-level craft rules from §1.2a still apply; only the surrounding sections differ.

Required sections in this exact order:

1. `# Project Snapshot` — Title | Logline | Genre | Target Duration | Aspect Ratio | Visual Style | Emotional Theme | Ending
2. `# Creative Assumptions` — brief bullets on setting, tone, characters, duration, visual style
3. `# Character Bible` — one row per character: Name | Actor Alias | Role | Age | Physical | Clothing | Personality | Want | Voice | Lipsync (dialogue only) | Continuity Anchor
4. `# Emotional Arc` — Beat | Timestamp Range | Emotion | What Changes
5. `# Storyboard And Generation Prompts` (N shots) — Shot | Time | Duration | Purpose | Dialogue (dialogue only) | Text-To-Image Prompt | Image-To-Video Prompt | Lipsync Notes / Performance Notes
6. `# Dialogue Script` (dialogue only) — Time | Actor Alias | Name | Line | Delivery | Lipsync Notes
7. `# Continuity Lock Prompt` — one reusable plaintext block locking character identity, wardrobe, setting, lighting, props, facial animation, lipsync behaviour, visual style, clean unmarked frame
8. `# Optional Negative Prompt` — a review artifact only. VideoExpress has no negative-prompt field, and these words must never reach a VideoExpress prompt body (`01-core.md §10 Prompt-side hygiene`); emit the block for the user's own reference on other tools. `Negative prompt: text, subtitles, captions, watermark, logo, brand names, distorted hands, extra fingers, mismatched eye direction, uncanny mouth movement, stiff facial animation, inconsistent character design, flickering clothing, warped props, unreadable signage, low resolution, motion blur that hides the face.`

**Name vs Actor Alias**: Name appears ONLY in the review-facing sections (Character Bible, Emotional Arc, Dialogue Script). Every T2I / I2V prompt body still uses Actor Alias + continuity anchor, exactly as in minimal mode.

In full mode the storyboard is a markdown table (one row per shot). In minimal mode it is `## Shot N` headings with bullets. Do not mix the two.

### §1.2c runsheet — VideoExpress execution run sheet

Emitted when the user says 執行工單 / run sheet / 要給 agent 跑 / 我要一幕一幕貼進 VE. Calibrated from a real end-to-end VideoExpress run (2026-08-08): character image → lipsync clips → timeline → FullHD export.

This output mode routes fields differently from every other mode, because VideoExpress's lipsync generator takes **three separate inputs** and mixing them breaks the render:

| VE field | Carries | Never carries |
|----------|---------|---------------|
| Image Prompt | the frozen Character Bible paragraph + this scene's expression clause | dialogue text |
| Lipsync Video Prompt | one director's note naming the actor and the delivery emotion | dialogue text |
| Actor 1 Script | the spoken line, under 100 characters | anything else |

Speech placed anywhere but the Actor 1 Script field renders as a **closed-mouth narration**.

Required sections in this exact order:

1. `# Character Bible`
2. `# Voice Direction` (dialogue only)
3. `# Scene Run Sheet` (N scenes)
4. `# VideoExpress Settings Checklist`
5. `# How To Run`

#### `# Character Bible` (runsheet)

One frozen paragraph of 40-70 words per recurring character (usually ONE):

`Actor N: A [AGE]-year-old [gender], [build], [skin tone], [hair colour + length + style], [one facial detail], wearing [EXACT garment + plain colour word], [seated/standing] in [single location] with [ONE background object + position], [lighting direction + quality], shallow depth of field, shoulders-up framing, camera at eye level, static camera.`

- Age as a number (`34-year-old`, not a range). Garment colours as plain words (`charcoal-grey`, not `slate ombré`). One location noun. One background object with position.
- The paragraph is **FROZEN**: re-paste it byte-identical into every scene's Image Prompt. Never shorten it, never paraphrase it, never write `same person as before` — the generator has no memory between scenes, and one changed word produces a different face.
- `Actor 1`, `Actor 2`, ... in appearance order. VideoExpress's own lipsync dialog addresses "Actor 1", so the alias doubles as the platform's native actor reference.

#### `# Voice Direction` (dialogue only)

One line, reused identically in every scene:

`Neutral American English accent, warm confident tone, natural conversational pace.`

#### `# Scene Run Sheet` (N scenes)

Each scene is one independent ~8-second clip. **No cross-scene timestamps and no scene-to-scene references** — the bible carries all continuity.

Tag every scene with ONE dominant emotion (Shocked / Angry / Sad / Surprised / Excited / Happy; Curious / Relieved as connectors). No two consecutive scenes share an emotion; flip polarity (negative ↔ positive) at least 3 times when there are 5+ scenes. Scene 1 names the stakes; the final scene resolves the open loop on the highest-energy positive beat.

Per scene emit `## Scene N — [Emotion]` plus exactly these fields, in order:

- `**Image Prompt:**` the ENTIRE Character Bible paragraph verbatim, then one new action/expression clause carrying this scene's emotion. Face and upper body only — no standing up, no walking, hands stay out of frame.
- `**Lipsync Video Prompt:**` (dialogue) one line naming the actor and directing delivery like a film director, e.g. `Actor 1 is the [brief visual tag]. He says his line in a [emotion] tone.` No dialogue text here.
- `**Actor 1 Script:**` (dialogue) the spoken line, UNDER 100 characters including spaces and punctuation — the platform rejects longer. Append the count, e.g. `(74 chars)`.
- `**Video & Audio Prompt:**` (no-dialogue projects, replaces the two fields above) motion and ambience direction only — subtle head/eye movement, breathing, environment sound. No speech, no quoted text.

Framing for the whole run sheet: close-up to shoulders-up, camera at eye level, static camera, hands out of frame, no props, one background object only. Close-up framing is what gives VideoExpress its best character consistency.

#### `# VideoExpress Settings Checklist`

Emit verbatim; the executor re-verifies every item before EVERY generation:

- Generator card: "Create Video From Prompt" (badges: Image to Video, Lipsync HD, Narrate, Consistent Character)
- Aspect: [Landscape 16:9 / Vertical 9:16] — the selector INSIDE the generator modal, not the preview-canvas one
- Image Type: human
- Use Consistent Character: ON — reference photo in slot 1, slot 2 EMPTY
- Advanced Mode → Manual Video Length: 8s (set duration FIRST — ticking Lipsync hides the length controls; actual clip length follows the audio)
- Lipsync HD Video: ON — speech goes ONLY in the Actor 1 Script field of the Create Lipsync Audio dialog that opens AFTER clicking Create Video; dialogue anywhere else renders a closed-mouth narration. (OFF for no-dialogue projects.)
- "Automatically enhance my image prompt": OFF after the hero image is saved — the enhancer rewrites the bible and breaks identity
- "Share this in the public gallery": OFF — re-verify after every modal reopen
- Max 5 generations in parallel; poll the "My AI Videos" folder for completion
- Media tile captions equal the prompt text — use them to match clips to scenes when ordering the timeline

#### `# How To Run`

Emit verbatim:

- Agent execution: give this run sheet to a browser-capable agent (Claude in Chrome / Claude Code / ChatGPT agent mode) together with the official VideoExpress agent workflow: https://github.com/strontiumplatform/VideoExpress.ai-Full-Length-Consistent-Character-Realistic-Talking-Avatar-Video-Workflow — this run sheet REPLACES the workflow's own script-and-bible-writing step (its STEP 1); every other step still applies.
- Manual execution: apply the settings checklist once, then copy-paste each scene's fields into VideoExpress scene by scene, re-verifying the checklist before each generation.

**Known platform behaviour** (2026-08-08 real run): actual clip length is decided by the audio, so an 8s setting yields 4.5-6s clips with very little dead air. The platform's own video-prompt enhancer rewrites prompts into `[0-4.5] seconds: ...` segments — the same timing syntax this knowledge base uses, which is why it survives enhancement.

### §1.3 Storyboard Silent Quality Checks

Run these mentally before emitting; never print them.

All output modes:

- ✓ Exactly the sections of ONE output mode present, in order, exact spelling — no headings from another output mode
- ✓ Shot / scene count matches the user-selected duration per `01-core.md §6`, and per-shot seconds sum into that range
- ✓ Shot duration limit (≤ 10s per clip) satisfied
- ✓ One primary action beat per shot; spoken lines fit their shot's seconds (~2 words/second)
- ✓ Dialogue character limit satisfied if dialogue (≤ 120 chars per shot; ≤ 100 chars per Actor 1 Script in runsheet)
- ✓ Location, time of day, weather, wardrobe and props read as one continuous reality across shots — only the wording varies, unless a declared arc changes a fact
- ✓ Every prop with a wide size range carries a numeric size token plus a surface or hand anchor, repeated in each shot it appears
- ✓ Subtitle suppression rule satisfied
- ✓ Output contains no conversational intro or meta-commentary

minimal / full:

- ✓ Timestamp continuity verified (zero gaps across consecutive shots)
- ✓ T2I / I2V prompt bodies reference characters by Actor Alias + continuity anchor — Names appear only in full mode's review sections, never in minimal

runsheet:

- ✓ Character Bible paragraph appears byte-identical in every scene's Image Prompt
- ✓ No dialogue text inside any Image Prompt or Lipsync Video Prompt
- ✓ Every Actor 1 Script is under 100 characters, with the count appended
- ✓ The Voice Direction line is identical wherever voice is referenced
- ✓ Emotion tags: exactly one per scene, no two consecutive scenes share one
- ✓ Settings Checklist and How To Run blocks emitted verbatim

---

## §2 single-shot

ONE production-ready shot: a T2I + I2V pair. Used for VideoExpress short / fast prompts.

### §2.1 Single-Shot Hard Constraints

- Output exactly ONE shot. No multi-shot lists or storyboards.
- Shot duration must fit the user-selected duration; a single generated clip stays ≤ 10 seconds regardless. If the user asked for more than ~15 seconds, say that `storyboard` fits better before generating.
- Speaking shots: close-up to waist-up. Otherwise medium framing allowed if subject readable.
- No intentional text/UI/labels in frame.
- Apply universal avoidances per `01-core.md §5`.
- If `dialogue = true`: ≤ 120 chars, wrap as speech act per `01-core.md §3`.

### §2.2 Single-Shot Output Format

Emit EXACTLY these two blocks. No "Shot Brief", no sub-fields, no intro text.

```
### Text-to-Image Prompt
<t2iBase> of <subject>, <short continuity anchor if human>, <framing> maximum, in <setting>, <action / pose>, stable composition, clear expressive face[, mouth visible if dialogue], <lighting>, <visualLock>, wide <aspectRatio> composition, clean unmarked frame.

### Image-to-Video Prompt
[0-N seconds]: Stable <framing> shot shows <subject>, <short anchor>, <concrete action>.
[N-M seconds]: <continued action or speech-act wrap per 01-core.md §3 if dialogue>.
```

Dynamic time-split per shot duration (same as storyboard `§1.2a`). Do NOT prefix with `Animate this image into a [duration]-second...` boilerplate. Do NOT trailing-append `Animate natural lipsync...` after speech-act wrap.

### §2.3 Single-Shot Silent Quality Checks

- ✓ Exactly one shot (no multi-shot list)
- ✓ Shot duration within platform durationRange
- ✓ Framing satisfied
- ✓ Output contains no meta-commentary

---

## §3 avatar

Single-character talking-head segment: one speaker, one script, no shot list. On VideoExpress this is the mode to pick when the deliverable is 「一個人對著鏡頭把一段話講完」 rather than a sequence of shots.

⚠️ **Assembly note**: VideoExpress generates in clips of ≤ 10 seconds, so a script longer than that becomes several lipsync clips joined on the timeline. When the script runs past ~10 seconds, say so and offer the `storyboard` + `runsheet` output mode instead — the run sheet is built exactly for driving multi-clip lipsync production scene by scene.

### §3.1 Avatar Hard Constraints

- Output a SINGLE-character segment. No multi-character scenes, no scene cuts.
- Lipsync-safe framing: chest-up or 3/4 view, mouth fully visible, front-facing or slight 3-quarter.
- Background plain, gently branded, or static loop — NO dynamic environment motion.
- Script naturally spoken, paced for the chosen duration.
- No intentional text overlays inside the frame.
- Apply universal avoidances per `01-core.md §5`.

### §3.2 Avatar Output Format

Emit EXACTLY these sections, in order:

```
### `## Character Sheet`
- Name: [single name]
- Persona (1 sentence): [who they are, tone]
- Physical: [face, age range, hair, build]
- Outfit: [clothing, one continuity anchor]
- Camera-facing pose: [front-facing OR 3/4 view OR slight turn]

### `## Voice & Performance`
- Voice: [warm / authoritative / casual / 中文 native / ...]
- Pacing: [slow & deliberate / conversational / energetic]
- Energy curve: [open soft → build → conviction close, or similar]

### `## Script`
[Provide spoken script as 1-3 paragraphs or timestamped blocks if duration > 60s. Length target: fit the chosen duration. Language per domain Tier 2.]

### `## Background & Composition`
- Background: [plain bg | soft loop | brand panel]
- Framing: chest-up or 3/4 view; subject occupies central 60% of frame
- Aspect: <aspectRatio>
```

### §3.3 Avatar Silent Quality Checks

- ✓ Single character only — no second speaker
- ✓ Lipsync-safe framing satisfied
- ✓ Background is static/non-distracting
- ✓ Script length matches duration
- ✓ Output contains no meta-commentary

---

## §4 MediaType bases (referenced by all modes)

The T2I / I2V patterns reference three slots: `<t2iBase>`, `<motionBase>`, `<visualLock>`. `<visualLock>` is **subject-aware** — pick the variant matching the shot's main subject so identity-preservation tokens stay on-topic.

### §4.1 Bases (same across subjects)

| MediaType | `<t2iBase>` | `<motionBase>` |
|-----------|-------------|----------------|
| `live` | `Cinematic live-action film still` | `cinematic live-action shot` |
| `3d` | `Cinematic 3D animated film still` | `cinematic 3D shot` |
| `2d-animation` | `2D animated film still` | `2D animated shot` |
| `illustration` | `Editorial illustration still` | `subtle ambient illustrated shot` |

### §4.2 visualLock variants (pick per shot's main subject)

**visualLock contains identity + technical-quality tokens ONLY. It does NOT include lighting tokens — lighting is filled by the per-shot `<lighting>` slot in the T2I template (e.g. `warm dim café lighting`, `dimly lit studio with blue and orange ambient lights`).** Mixing lighting into visualLock causes duplicate tokens like `..., authentic lighting, realistic human identity, authentic lighting, ...`.

| MediaType | Human subject | Product / object subject | Human + product mixed |
|-----------|---------------|--------------------------|------------------------|
| `live` | `realistic human identity, natural skin detail, clean frame` | `product identity preserved, material consistency, accurate proportions, clean frame` | `realistic human identity, product identity preserved, material consistency, clean frame` |
| `3d` | `premium stylized 3D animation` | `premium stylized 3D animation, accurate proportions` | `premium stylized 3D animation` |
| `2d-animation` | `consistent 2D character design, defined linework, clean color fills, layout-friendly composition` | `consistent 2D object design, defined linework, clean color fills, layout-friendly composition` | combine both |
| `illustration` | `consistent illustration style, clean linework, monochrome or limited palette, editorial poster aesthetic` | (variants identical) | (variants identical) |

### §4.3 Shot subject classification (apply per shot in a storyboard)

For each shot, classify the main subject BEFORE composing the T2I:

- **Human subject** = the shot foregrounds a person, performer, or character (face / body / hands as the primary visual focus).
- **Product / object subject** = the shot foregrounds a product, prop, machine, food, environment, or any non-human object as the primary visual focus. Even shots that incidentally include human hands but center on the product belong here.
- **Mixed** = both human and product are co-equal in frame (e.g. a barista pouring coffee where both the hands AND the carafe are featured).

**Picking the wrong variant introduces noise.** Example: emitting `realistic human identity, natural skin detail` on a shot of a coffee tower without humans pushes the T2I model to invent or merge human elements into the product frame — the machine and the cup get mashed together.

### §4.4 Domain-driven defaults

- When `domain = editorial-cinemagraph`, default mediaType is `illustration`.
- When `domain = product-demo`, default visualLock variant is **Product / object subject** (the product is the hero). Override per-shot to Human or Mixed if a shot specifically features a person.
- When `domain ∈ {narrative-character, real-interview, educational}`, default variant is **Human subject**. Override per-shot to Product/object for cutaway shots that focus on an object.
- When `domain = motion-explainer`, default mediaType is `2d-animation` (use `illustration` for a flatter editorial look), and the visualLock variant is the **Product / object** column — there is no human identity to preserve. Restate the palette and type system in every shot in place of a continuity anchor.

---

## §5 first-last

ONE before/after frame pair plus one transition. Maps to VideoExpress's **"First Frame, Last Frame" (Beta)** card. Validated end-to-end 2026-08-09 (陶盆嫩芽 → 盛開萬壽菊, photorealistic, 9:16, 8s): frame consistency was excellent and the video generated cleanly.

Best for object transformations, state changes, before/after reveals, and time-lapse-feeling beats. Weakest for dialogue — prefer no speech here.

### §5.1 First-Last Hard Constraints

- Output exactly ONE frame pair (First Frame + Last Frame Smart Edit) plus ONE transition prompt. No storyboard, no extra shots.
- **The First Frame Prompt carries the COMPLETE scene description**: subject, environment, lighting, camera.
- **The Last Frame is a SMART EDIT of the first frame**, not a second full T2I: describe ONLY what changes, then explicitly pin everything else (e.g. `The pot, desk, window light, and background stay exactly the same.`). Never rewrite the full scene in the last-frame field — the platform edits the generated first image, and restating unchanged elements invites drift.
- The transition prompt describes one continuous motion arc that starts exactly at the First Frame state and ends exactly at the Last Frame state. Introduce nothing that appears in neither frame.
- **One state change per generation.** If the brief implies multiple transformations, pick the strongest single before/after and note the rest as follow-up pairs.
- Transition duration must fit the user-selected duration; one first-to-last generation caps at ~10 seconds (recommended 5-15s total content).
- If dialogue: ONE short line ≤ 100 characters, wrapped as a speech act per `01-core.md §3`. Otherwise prefer no dialogue — these read cleanest as pure visual transformations.
- Apply universal avoidances per `01-core.md §5`.

### §5.2 First-Last Output Format

Emit EXACTLY these three blocks, no intro text.

`### First Frame Prompt`
`<t2iBase> of <subject + setting> in the STARTING state: <state-specific details>, <camera + framing>, <lighting>, <visualLock>, wide <aspectRatio> composition, clean unmarked frame.`

`### Last Frame Smart Edit`
One short paragraph describing ONLY the change, then pinning the rest:
`The <subject> has <ending-state change>. The <list every unchanged element: subject identity / environment / lighting / background> stay exactly the same.`

`### Transition Prompt`
`Animate from the first frame to the last frame: <motion arc in 2-3 time-segmented beats, e.g. [0-2 seconds]: ..., [2-5 seconds]: ...>. Camera stays <locked / one slow move>. Keep subject identity, environment, palette, and lighting consistent throughout.` Plus, if dialogue, the speech-act wrap with a line ≤ 100 characters.

### §5.3 Platform facts for the user (2026-08-09 dogfood)

Mention these when the user is about to run the pair — they are the difference between a clean run and a wasted generation:

- Three fields in the modal: First Frame prompt · Last Frame Smart Edit · Video and Audio Prompt. Three buttons: Create First Image → Create Last Image → Create Video.
- Reference Photo Type select offers human / 2d / 3d / photorealistic / other.
- The duration slider lives behind Advanced Mode and **defaults to 7 seconds** here (range 3-10; the main generator defaults to 5).
- The platform's own red-text hint recommends **9:16 vertical** for this card.
- Image generation takes ~15-25 seconds per frame; the video takes ~2-3 minutes.
- The enhance checkbox in this modal is a different one from the main generator's — leave it off once the frames look right, same reasoning as the bible-drift rule.
- The media tile's right-click menu has **Save Last Frame**: save the ending frame and use it as the next pair's first frame. That is the platform's native support for chaining transitions into a longer sequence.
- This modal has no public-gallery checkbox.

### §5.4 First-Last Silent Quality Checks

- ✓ Exactly one First Frame Prompt + one Last Frame Smart Edit + one transition prompt, nothing else
- ✓ Last Frame Smart Edit describes only the changed elements and explicitly pins the unchanged ones
- ✓ Transition starts at the First Frame state and ends at the Last Frame state; no new elements introduced
- ✓ Transition duration within the user-selected duration (and ≤ ~10s per generation)
- ✓ Output contains no meta-commentary

---

## §6 short-form

Tight, hook-driven vertical plan. 9:16 only. No character bible, no continuity lock, no storyboard table.

### §6.1 Short-Form Hard Constraints

- Aspect ratio MUST be 9:16 vertical.
- First 3 seconds MUST contain a strong visual hook (face close-up, surprising action, sudden state change).
- Total length must land inside the user-selected duration. Use 3-6 scene beats and size each beat (typically 3-6 seconds) so the beats sum to that total. Recommended total: 15-45 seconds — longer content belongs in `storyboard`.
- Central 60-70% vertical zone is safe. Top 15% and bottom 25% may be covered by platform UI.
- Avoid burned-in text overlays.
- Apply universal avoidances per `01-core.md §5`.

### §6.2 Short-Form Output Format

Emit ONLY these three sections, in order:

`## Hook Strategy`
- Opening 3-second visual: one sentence — what the viewer sees
- Why it stops the scroll: one sentence

`## Scene Beats` (3-6 beats)
Table: `# | Beat | Time | Visual | Action / Line`
- Each beat typically 3-6 seconds; beats must sum to the total length
- Each Visual cell ≤ 30 words
- Dialogue, if any, goes in the Action / Line column, under 60 characters per beat

`## CTA / Ending`
- Final 2-3 seconds: visual cliffhanger OR action close
- No burned-in text CTA

### §6.3 Short-Form Silent Quality Checks

- ✓ 9:16 aspect locked
- ✓ Opening 3s hook present
- ✓ 3-6 beats; per-beat seconds sum to the user-selected total length
- ✓ Subject in central safe zone
- ✓ Only the three sections above are emitted
- ✓ Output contains no meta-commentary
