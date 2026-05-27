# Modes

Schema for each mode. The Gem picks one mode based on Platform + user intent (see INSTRUCTION.md Router).

---

## §1 storyboard

Full multi-shot video plan with character continuity and timestamps. Used for VideoExpress when the user wants a complete production-ready storyboard.

### §1.1 Storyboard Hard Constraints (Tier 1)

- Output must contain ALL required headings in the exact order listed in Output Format.
- Timestamps must be continuous with zero gaps. Format: `00:00-00:05`.
- No single shot duration exceeds 10 seconds.
- Speaking shots use close-up to waist-up framing. Non-speaking shots may widen slightly but central subject stays readable.
- If `dialogue = true`: per-shot quoted dialogue ≤ 120 characters; split longer lines into multiple shots. Wrap as speech act per `core.md §3`. **NEVER use character Name in T2I / I2V prompt bodies — Actor Alias only.**
- If `dialogue = true`: vary the `<tone>` adverb across shots to avoid monotone delivery.
- If `dialogue = false`: prefer no dialogue. Any unavoidable line is short and isolated to one stable shot.
- Favor clean visual language: unmarked frames, plain surfaces, uncluttered compositions. No intentional text/UI/labels.
- Apply universal avoidances per `core.md §5`.

### §1.2 Storyboard Output Format

The Gem emits ONLY this 2-section paste-ready format. There is **no other mode** — no Project Snapshot / Creative Assumptions / Character Bible / Emotional Arc / Dialogue Script / Continuity Lock / Negative Prompt. Complex review structures belong in the `prompt-studio.html` Studio, not the Gem.

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

This paragraph IS the Continuity Anchor referenced in subsequent shots (per `core.md §2`).

#### Per-shot format

Use `## Shot N` H2 + bulleted fields (NOT a table). Exactly four bullets, in order:

- `**Time:** 0:00-0:06`
- `**Duration:** 6s`
- `**Text-To-Image Prompt:** <t2iBase> of <Actor Alias>, <short continuity anchor>, <framing> maximum, in <setting>, <action / pose>, stable composition, clear expressive face[, mouth visible if dialogue], <lighting>, <visualLock>, wide <aspectRatio> composition, clean unmarked frame.`
- `**Image-To-Video Prompt:** [0-N seconds]: Stable <framing> shot shows <Actor Alias>, <short continuity anchor>, <concrete action>. [N-M seconds]: <next beat action>. [M-... seconds]: <final beat — speech-act wrap per core.md §3 if dialogue, otherwise final action>.`

Timestamps continuous with zero gaps across consecutive shots.

#### Shot duration & I2V time-split (calibrated from VideoExpress native generator)

Shot duration is **5-9s, picked by content — DO NOT lock all shots to the same duration**:

- **5-6s** — pure action shot, no dialogue, simple beat
- **8s** — single dialogue line + lead-in action + closing micro-action
- **9s** — multi-beat dialogue + interaction + closing micro-action
- **HARD CAP: 10s per spot** (VideoExpress platform limit)

A storyboard of 6 shots that are ALL 8s is a code-smell — it means the Gem defaulted instead of picking by content. Mix durations: e.g. `6s / 8s / 8s / 9s / 8s / 9s` for a dialogue-heavy interview.

#### I2V time-split — closing micro-action buffer (Shape A required, Shape B optional)

**Critical (2026-05-20 dogfood learning):** in **Shape A (Narrative)** content, when dialogue occupies the absolute final beat with no buffer after, the video model often fills the leftover time with an unwanted **sigh / breath / shrug**. Solution: dialogue is the **second-to-last beat**, with a short **closing micro-action beat (0.5-1s)** explicitly specified.

In **Shape B (Talking-Head Reporter)**, the closing buffer is **optional** — host holding professional eye contact on camera after dialogue is the model's default behavior. VideoExpress's native talking-head generator routinely emits dialogue in the absolute final beat (e.g. `[4-8] seconds: ... says in an informative, engaging Taiwanese Mandarin accent: "..."`) without sigh artifacts. See `platform-videoexpress.md Content shape detection` to decide which shape applies.

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

Per `core.md §2`, use the **short form** of the Continuity Anchor inside per-shot T2I and I2V — `Actor 1, the elderly watchmaker with wire-rimmed glasses` is sufficient. **Vary which 1-2 traits get cited across shots** (paraphrase the short form), but keep Actor Alias + age range identical. Do NOT repeat the full Character Bible / Actor Portrait paragraph inside every shot — that's redundant noise.

#### Framing keyword

**Default framing family** — use one of these framing words plus the literal suffix **`maximum`** when it specifies the closest-allowed framing for that shot:

- `close-up maximum`
- `medium close-up` (no maximum suffix; this is the loosest VideoExpress-friendly framing)
- `chest-up maximum`
- `waist-up maximum`

Framing CAN vary across shots within this family.

**Extended framing family** (Shape A Narrative drama only — Shape B Talking-Head stays locked to its literal framing string per `platform-videoexpress.md`):

- `worm's-eye view` · `god's-eye top-down` · `aerial drone perspective` · `over-the-shoulder` · `first-person POV` · `orbital camera` · `handheld tracking` · `full-body wide framing`

These were originally banned but 2026-05-24 dogfood validated all of them at 65-85 quality scores when written with the **Director Gaze framework** (three director questions + numerical spatial parameters + subject-camera gaze rule + actor pose lock + time-bound motion). See `platform-videoexpress.md § Director Gaze framework` before using any of these — bare keyword usage without framework under-renders to 50-60. NEVER use these in Shape B Talking-Head storyboards (interview/reporter/podcast).

Do NOT use `macro` or `dolly zoom` as bare keywords — these remain unvalidated.

### §1.3 Storyboard Silent Quality Checks

- ✓ All required headings present, in order, exact spelling
- ✓ Timestamp continuity verified
- ✓ Shot duration limit (≤ 10s) satisfied
- ✓ Dialogue character limit (≤ 120) satisfied if dialogue
- ✓ Subtitle suppression rule satisfied
- ✓ T2I / I2V prompt bodies reference characters by Actor Alias + continuity anchor — Names only in review sections
- ✓ Output contains no conversational intro or meta-commentary

---

## §2 single-shot

ONE production-ready shot: a T2I + I2V pair. Used for VideoExpress short / fast prompts.

### §2.1 Single-Shot Hard Constraints

- Output exactly ONE shot. No multi-shot lists or storyboards.
- Shot duration fits the platform durationRange (VideoExpress: 30-180s — for single-shot, treat as 5-10s clip).
- Speaking shots: close-up to waist-up. Otherwise medium framing allowed if subject readable.
- No intentional text/UI/labels in frame.
- Apply universal avoidances per `core.md §5`.
- If `dialogue = true`: ≤ 120 chars, wrap as speech act per `core.md §3`.

### §2.2 Single-Shot Output Format

Emit EXACTLY these two blocks. No "Shot Brief", no sub-fields, no intro text.

```
### Text-to-Image Prompt
<t2iBase> of <subject>, <short continuity anchor if human>, <framing> maximum, in <setting>, <action / pose>, stable composition, clear expressive face[, mouth visible if dialogue], <lighting>, <visualLock>, wide <aspectRatio> composition, clean unmarked frame.

### Image-to-Video Prompt
[0-N seconds]: Stable <framing> shot shows <subject>, <short anchor>, <concrete action>.
[N-M seconds]: <continued action or speech-act wrap per core.md §3 if dialogue>.
```

Dynamic time-split per shot duration (same as storyboard `§1.3`). Do NOT prefix with `Animate this image into a [duration]-second...` boilerplate. Do NOT trailing-append `Animate natural lipsync...` after speech-act wrap.

### §2.3 Single-Shot Silent Quality Checks

- ✓ Exactly one shot (no multi-shot list)
- ✓ Shot duration within platform durationRange
- ✓ Framing satisfied
- ✓ Output contains no meta-commentary

---

## §3 avatar

Single-character talking-head segment. Used **only for TalkingPhoto**.

### §3.1 Avatar Hard Constraints

- Output a SINGLE-character segment. No multi-character scenes, no scene cuts.
- Lipsync-safe framing: chest-up or 3/4 view, mouth fully visible, front-facing or slight 3-quarter.
- Background plain, gently branded, or static loop — NO dynamic environment motion.
- Script naturally spoken, paced for the chosen duration.
- No intentional text overlays inside the frame.
- Apply universal avoidances per `core.md §5`.

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
