# Core Conventions

Cross-cutting rules that apply to every generated prompt regardless of platform, mode, or domain.

---

## §1 Actor Alias

When a prompt references recurring characters, identify them by **Actor Alias** (`Actor 1`, `Actor 2`, ...) assigned in appearance order — **not** by Name.

- **Why**: Visual anchoring beats narrative names for cross-shot identity stability in T2I / I2V pipelines. Names tempt the model to invent appearance from name semantics.
- **Where Actor Alias is used**: inside T2I prompts, inside I2V prompts, inside Continuity Anchor references.
- **Where Names are used**: only in review-facing sections (Character Bible, Emotional Arc, Dialogue Script). Never inside generation prompts.

### Pattern

```
Actor 2, the 30-year-old Asian male host in a dark blue suit, ...
└────┬─────┘ └──────────────────┬───────────────────────────┘
  alias              continuity anchor (visual traits, plaintext)
```

---

## §2 Continuity Anchor

A short plaintext description of a character's visual traits. Paired with the Actor Alias in every shot the character appears in.

- Length: ~5-15 words per reference (one phrase, not a full sentence)
- Content: age range + ethnicity/role + 1-2 signature visual traits + key wardrobe item
- Example (long form, for Character Bible): `the 30-year-old Asian male host in a dark blue suit, short black hair, square jaw`
- Example (short form, for per-shot reference): `the 30-year-old Asian host in a dark blue suit`
- Example (alternate short form): `the elderly watchmaker with wire-rimmed glasses`

**Partial paraphrase across shots is OK and expected.** VideoExpress's own native prompt generator does this routinely — Shot 1 may reference the actor as `the elderly Taiwanese watchmaker with silver hair and wire-rimmed glasses`, while Shot 2 references the same actor as `the elderly watchmaker with a canvas apron`. The invariant is: **Actor Alias is identical across shots**, and **at least one signature visual trait carries over** in each reference. Avoid swapping all traits at once.

Generated prompts should provide a long-form Continuity Anchor once (in Character Bible for `full` mode, in Actor Portrait Image Descriptions for `minimal` mode) and then use the short form in each per-shot T2I / I2V reference, varying which 1-2 traits get cited but keeping the Actor Alias fixed.

---

## §3 Dialogue Speech-Act Wrap

Every spoken line in a generated I2V prompt MUST be wrapped as a **speech act**, never left as bare quoted text.

### Pattern (calibrated from VideoExpress native generator)

```
<Actor Alias> [optional brief lead-in action], and says in a <2-word tone combo>, [neutral accent type] accent: "<line>"
```

Or when there's no lead-in action:

```
<Actor Alias> says in a <2-word tone combo>, [neutral accent type] accent: "<line>"
```

### Examples (from VideoExpress dogfood)

- `Actor 1 slowly turns his head toward the door, his eyes widening in recognition, and says in a trembling, emotional voice: "Is that... is that really you?"`
- `Actor 2 lets out a shaky breath, a gentle tearful smile appearing on her face, and replies in a soft, emotional neutral accent: "Dad, I'm home. I've missed you so much."`
- `Actor 1 says in a whispered neutral American accent: "This plot makes absolutely no sense."`
- `Actor 2 says in a sharp, hushed neutral American accent: "Shh! It's supposed to be romantic, Jack."`

### Why

Bare quoted text like `"我們現在就走吧"` inside an I2V prompt risks being rendered as **on-screen subtitles** by the video model. Wrapping as a speech act tells the model to animate lipsync to the words, not display them.

### Tone (2-word combo)

**Pick by emotional context, NOT by rotation.** Do not mechanically cycle through the palette below — match the tone to what the character is actually feeling and saying in that beat. A street-interview passerby saying "I'm a bit worried about the economy" needs `concerned, candid` — NOT `measured, profound` (too formal) or `steady, loving` (intimate, wrong context).

Pick from the group that matches the scene's emotional register:

**Intimate / personal** (family, romance, vulnerable moments):
- `soft, nostalgic` · `trembling, emotional` · `warm, peaceful` · `steady, loving` · `gentle, remorseful`

**Tense / conflict** (arguments, disagreements, defensive moments):
- `tense, upset` · `sharp, hushed` · `agitated, sharp` · `defensive, hushed` · `dismissive, casual`

**Casual / candid** (street interviews, vox-pop, everyday talk, off-the-cuff reactions):
- `casual, candid` · `concerned, candid` · `optimistic, candid` · `sincere, reflective` · `whispered, casual` · `faint, baffled`

**Professional / interview** (host, presenter, anchor, expert commentary):
- `confident, warm` · `engaging, respectful` · `polished, clear` · `friendly, professional` · `inspiring, sincere`

**Authoritative / declarative** (expert verdict, definitive statement, formal closing):
- `measured, profound` · `grounded, resonant` · `calm, definitive` · `assured, decisive`

Vary tone across shots within the appropriate group — do NOT use `measured, profound` for a casual passerby, do NOT use `casual, candid` for a formal expert verdict.

### Accent type — depends on Content Shape (see `platform-videoexpress.md`)

Use **`natural` + Mandarin/English accent** — the `natural` prefix matches what VideoExpress's native generator emits.

| Dialogue language | Shape A (Narrative) default | Shape B (Talking-Head) default |
|--------------------|------------------------------|---------------------------------|
| 中文 | `natural Mandarin accent` (NO locale) | `natural Taiwanese Mandarin accent` OK, or plain `natural Mandarin accent` |
| 廣東話 | `natural Cantonese accent` | same |
| English | `natural American English accent` | `natural American English accent` (or `British` per target) |
| Japanese | `natural Japanese accent` | same |
| Korean | `natural Korean accent` | same |

**Why the Shape A vs B split for 中文:** dogfood 2026-05-20 found `natural Taiwanese Mandarin accent` increases subtitle hallucination noticeably in narrative/drama contexts (`Taiwanese` token entangled with caption signal), but the same locale qualifier works fine in talking-head reporter contexts (informative, engaging delivery anchors the model). When in doubt, plain `natural Mandarin accent` is the safer fallback for either shape.

Override-only: use `voice` (no accent specificity) when delivery characteristic dominates and accent doesn't matter — e.g. `trembling, emotional voice` for a whispered intimate moment where the voice quality matters more than locale.

**Do NOT repeat the Continuity Anchor inside the speech-act wrap.** The actor description should already appear earlier in the same I2V's beat description; the speech-act wrap only carries Alias + tone + accent + the quoted line.

### Full wrap pattern reminder

```
<Actor Alias> [optional brief lead-in action], and says in a <2-word tone>, <natural locale accent>: "<line>"
```

Concrete examples (from VideoExpress dogfood):

- `Actor 1 says in an energetic, natural Taiwanese Mandarin accent: "川普近期展開多國訪問，引發全球關注。"`
- `Actor 2 says in a conversational, slightly worried Taiwanese Mandarin accent: "老實說，當然會擔心啊。"`
- `Actor 1 says in a clear, concluding Taiwanese Mandarin accent: "以上是街頭隨機採訪，我們把鏡頭交還給棚內。"`
- `Actor 1 says in a whispered, casual natural American English accent: "This plot makes absolutely no sense."`

### Dialogue length (CRITICAL — model dropouts / incomplete delivery risk)

**Hard cap**: per-shot dialogue ≤ **120 characters** total.

**Soft cap (the real constraint — speech-rate density, splits by Content Shape per `platform-videoexpress.md`):**

| Dialogue language | Shape A (Narrative) sweet spot | Shape B (Talking-Head reporter) sweet spot | Both shapes hard ceiling |
|--------------------|--------------------------------|---------------------------------------------|---------------------------|
| 中文 (Mandarin / Cantonese) | **3-4 字/秒** | **5-8 字/秒** (up to 10 字/秒 has worked) | 10 字/秒 |
| English | 2-3 words/秒 | 3-4 words/秒 | 4 words/秒 |
| Japanese | 5-6 mora/秒 | 6-8 mora/秒 | 8 mora/秒 |
| Korean | 4-5 syllables/秒 | 5-7 syllables/秒 | 7 syllables/秒 |

**Why the split:** narrative/drama dialogue has natural-conversation rhythm with pauses; reporter dialogue is deliberately delivered fast and clearly. The reporter pace at 5-8 字/秒 works because (a) host speaks crisply, (b) on-camera eye contact anchors the model, (c) `informative, engaging` tone primes professional delivery. Same density in narrative drama would truncate.

Past the hard ceiling the video model **drops syllables, truncates mid-sentence, or blurs articulation** in either shape. For 中文 narrative work, the 3-4 字/秒 figure is the practical sweet spot.

**Shot duration ↔ Chinese dialogue length reference (calibrated 2026-05-20, splits by Content Shape):**

**Shape A (Narrative)** — with 0.5-1s closing micro-action buffer (required per `modes.md §1.3`):

| Shot length | Dialogue beat duration | 中文 sweet spot | 中文 hard ceiling |
|-------------|------------------------|------------------|---------------------|
| 5s | 2-3s | 8-12 字 | 15 字 |
| 6s | 3s | 12-15 字 | 18 字 |
| 8s | 3s | 15-18 字 | 20 字 |
| 9s | 4s | 16-20 字 | 22 字 |
| 10s | 5s | 20 字 | 25 字 |

**Shape B (Talking-Head Reporter)** — closing buffer optional, dialogue can fill final beat:

| Shot length | Dialogue beat duration | 中文 sweet spot | 中文 hard ceiling |
|-------------|------------------------|------------------|---------------------|
| 5s | 3-4s | 15-25 字 | 30 字 |
| 6s | 4s | 20-30 字 | 35 字 |
| 8s | 4-6s | 30-45 字 | 50 字 |
| 9s | 5-7s | 35-50 字 | 60 字 |
| 10s | 6-8s | 40-60 字 | 70 字 |

**Dogfood validation (Shape B):** VideoExpress's native generator emits 40 字 in a 4s reporter dialogue beat (10 字/秒) and the model delivers cleanly without subtitle hallucination — calibrated 2026-05-20.

If the user's idea has a long line, **split across shots** — better two 8s shots with shape-appropriate density each than one 9s shot trying to cram beyond the ceiling.

**If your draft line exceeds the soft cap**, in order of preference:

1. **Tighten the wording — drop filler 修飾語 (preferred for 中文)**. See "Chinese dialogue tightening" below.
2. Split the line across two consecutive shots (each one independent speech-act), or
3. Increase the shot duration (up to 10s hard cap).

#### Chinese dialogue tightening (CRITICAL for VideoExpress reliability)

Aggressively cut **filler** and **doubled modifiers**. Calibrated 2026-05-20 dogfood: a tighter line of 15 字 plays cleanly while the same idea at 22 字 truncates or muddles articulation.

**Drop on sight:**

- Opening filler: `你看`, `你知道嗎`, `這個`, `那個`, `其實`, `說真的`, `老實說`, `對啊`, `欸`
- Intensifiers: `真的是`, `真的好`, `真正的`, `整個`, `完全是`, `非常的`, `好棒`
- Filler connectors: `就像那種`, `就是那個`, `就像是`, `好像就`
- Doubled four-character modifiers (疊詞 / 對偶): if the line already has one descriptive phrase, drop the second one. E.g. `層層疊疊` next to `美得就像一幅畫` is redundant — keep one.

**Keep:**

- Core noun(s) — the subject of the sentence
- One descriptive modifier
- One metaphor / comparison if used
- Sentence-final particles (`啊` / `啦` / `吧` / `呢`) when natural to the tone

**Example (from 2026-05-20 dogfood):**

- Long version (22 字, unstable): `你看這滿山的楓紅，層層疊疊，美得就像一幅畫一樣` ❌
  - drops: `你看` (filler), `層層疊疊` (doubled modifier)
- Tight version (15 字, stable): `這滿山的楓紅，美得就像一幅畫一樣` ✅

Use the tight version. The user can read the long version in their head; the model needs the short one to deliver cleanly.

**Anti-pattern (will cause dropouts):**

- 6s shot + 22 字 = 3.7 字/秒 may seem within density, but the closing buffer means dialogue beat is only 3s → 7+ 字/秒 actual → truncates
- 8s shot + 30 字 ❌ (the old "sweet spot" before closing buffer was added — now too long)
- Including `你看` / `說真的` / `層層疊疊` style filler in any 中文 line

### Quote marks (CRITICAL — subtitle hallucination risk)

**ALL dialogue strings — including 中文 / Mandarin / Cantonese / Japanese / Korean dialogue — MUST be wrapped in plain ASCII straight double quotes** `"..."`. Do NOT use:

- 中文 typographic quotes: `「...」` ❌ (may be parsed as on-screen subtitle marker)
- Curly / smart quotes: `"..."` ❌ (may be parsed as typography hint)
- Single quotes: `'...'` ❌
- Backticks: ``...`` ❌

**Why:** VideoExpress and most video-gen models treat the speech-act wrap pattern + ASCII `"..."` as the canonical "dialogue for lipsync" marker. Switching to 「...」 or curly quotes risks the model rendering the line **as burned-in subtitles** rather than animating lipsync. The wrap rule and the quote type work together — both must be correct.

**Correct examples:**
- `Actor 1 says in a casual, candid neutral Mandarin accent: "說不擔心是騙人的吧。"`
- `Actor 2 replies in a confident, warm neutral American English accent: "We can fix this together."`

**Incorrect (subtitle risk):**
- `Actor 1 says in a casual, candid neutral Mandarin accent: 「說不擔心是騙人的吧。」` ❌

---

## §4 Output Format (storyboard mode)

Storyboard mode emits **one and only one format** — the paste-ready 2-section structure:

1. `# Actor Portrait Image Descriptions`
2. `# Scenes, Storyboard And Generation Prompts` (N shots, each as `## Shot N` H2 + bullets)

**No other sections exist for the Gem.** No Project Snapshot, no Creative Assumptions, no Character Bible, no Emotional Arc, no Dialogue Script table, no Continuity Lock, no Negative Prompt. Those review-structure artifacts belong in the `prompt-studio.html` Studio (which is what the Gem distribution intentionally leaves out — Gem stays light, Studio handles heavy).

If the user asks for `完整版` / `full` / `character bible` / `review structure` / `分鏡表` (in the spreadsheet/Markdown-table sense), politely point them to the HTML Studio at `prompt-studio.html` and explain the Gem is intentionally minimal-only.

`single-shot` and `avatar` modes have their own fixed schemas (see `modes.md §2.2` and `§3.2`).

---

## §5 Universal Avoidances

Every generated prompt MUST avoid these regardless of mode / platform / domain:

- Copyrighted characters, celebrity likenesses
- Brand names, logos, watermarks
- Burned-in text / captions / subtitles / lower-thirds (unless platform exportRules explicitly allow)
- Distorted hands, extra fingers
- Inconsistent character design across shots
- Flickering clothing, warped props
- Unreadable signage
- Motion blur that hides the face

These belong in the Optional Negative Prompt block (full storyboard mode) or are implicit Silent Quality Checks (other modes).

---

## §6 Shot Count (storyboard mode)

| Length mode | Shots |
|-------------|-------|
| `short` (~30-45s total) | 5-7 |
| `default` (~45-90s) | 6-9 |
| `detailed` (~90-180s) | 9-12 |

Default to 6-9 unless user specifies otherwise. Each shot ≤ 10s.
