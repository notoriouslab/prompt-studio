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

The wrap matches what VideoExpress's own generator emits, and it reliably produces speech with mouth sync — nine clips written this way delivered audible, well-synced dialogue.

⚠️ **Correction (2026-08-17)**: the original justification for this rule — that bare quoted text becomes on-screen subtitles — did **not** reproduce under testing. See `§10`. Keep the wrap because it matches the platform's native style and delivers clean lipsync, not because it prevents burned-in text; nothing in the prompt was shown to do that.

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

### Accent type — depends on Content Shape (see `04-platform-videoexpress.md`)

Use **`natural` + Mandarin/English accent** — the `natural` prefix matches what VideoExpress's native generator emits.

| Dialogue language | Shape A (Narrative) default | Shape B (Talking-Head) default |
|--------------------|------------------------------|---------------------------------|
| 中文 | `natural Mandarin accent` (NO locale) | `natural Taiwanese Mandarin accent` OK, or plain `natural Mandarin accent` |
| 廣東話 | `natural Cantonese accent` | same |
| English | `natural American English accent` | `natural American English accent` (or `British` per target) |
| Japanese | `natural Japanese accent` | same |
| Korean | `natural Korean accent` | same |

**Status of the Shape A vs B split for 中文 (2026-08-17):** this came from a 2026-05-20 note claiming the `Taiwanese` qualifier raises subtitle hallucination in narrative content. The 2026-08 campaign could not reproduce any subtitle effect from prompt tokens at all (`§10`), so treat the split as an unverified stylistic preference rather than a subtitle defence. Either accent string is safe to use; plain `natural Mandarin accent` remains the default simply because it is the shorter, more neutral token.

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

**Soft cap (the real constraint — speech-rate density, splits by Content Shape per `04-platform-videoexpress.md`):**

| Dialogue language | Shape A (Narrative) sweet spot | Shape B (Talking-Head reporter) sweet spot | Both shapes hard ceiling |
|--------------------|--------------------------------|---------------------------------------------|---------------------------|
| 中文 (Mandarin / Cantonese) | **3-4 字/秒** | **5-8 字/秒** (up to 10 字/秒 has worked) | 10 字/秒 |
| English | 2-3 words/秒 | 3-4 words/秒 | 4 words/秒 |
| Japanese | 5-6 mora/秒 | 6-8 mora/秒 | 8 mora/秒 |
| Korean | 4-5 syllables/秒 | 5-7 syllables/秒 | 7 syllables/秒 |

**Why the split:** narrative/drama dialogue has natural-conversation rhythm with pauses; reporter dialogue is deliberately delivered fast and clearly. The reporter pace at 5-8 字/秒 works because (a) host speaks crisply, (b) on-camera eye contact anchors the model, (c) `informative, engaging` tone primes professional delivery. Same density in narrative drama would truncate.

Past the hard ceiling the video model **drops syllables, truncates mid-sentence, or blurs articulation** in either shape. For 中文 narrative work, the 3-4 字/秒 figure is the practical sweet spot.

**Shot duration ↔ Chinese dialogue length reference (calibrated 2026-05-20, splits by Content Shape):**

**Shape A (Narrative)** — with 0.5-1s closing micro-action buffer (required per `02-modes.md §1.2a`):

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

## §4 Output Modes (storyboard mode only)

Storyboard mode has **three output modes**. Default is `minimal`. The other two are emitted only when the user asks for them by name.

| Output mode | Trigger | Sections emitted |
|-------------|---------|------------------|
| **minimal** (DEFAULT) | nothing said, or 「精簡」/「直接貼」 | 2 sections: `# Actor Portrait Image Descriptions` + `# Scenes, Storyboard And Generation Prompts` |
| **full** | 「完整版」/「full」/「分鏡表」/「character bible」/「review 結構」 | 8 sections: Project Snapshot · Creative Assumptions · Character Bible · Emotional Arc · Storyboard And Generation Prompts · Dialogue Script (dialogue only) · Continuity Lock Prompt · Optional Negative Prompt |
| **runsheet** | 「執行工單」/「run sheet」/「要給 agent 跑」/「我要照著一幕一幕貼」 | 4-5 sections: Character Bible · Voice Direction (dialogue only) · Scene Run Sheet · VideoExpress Settings Checklist · How To Run |

Full schemas for all three live in `02-modes.md §1.2`. Pick one and emit only its sections — never blend two output modes in one answer.

**Which to recommend when the user has no preference:**

- Producing clips one by one, copy-pasting into VideoExpress by hand or with a browser agent → **runsheet** (it carries the platform settings checklist).
- Just wants prompts to paste shot by shot → **minimal**.
- Wants to review / edit the plan with another person before generating → **full**.

The other four modes have one fixed schema each: `single-shot` = `02-modes.md §2`, `avatar` = `§3`, `first-last` = `§5`, `short-form` = `§6`. Output modes do not apply to them.

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

**These are things to avoid producing, never words to write into a prompt.** On VideoExpress they live only in your own silent checks — the platform has no negative-prompt field, and putting `no text` / `no subtitles` / `no watermark` into a prompt body raises the risk of exactly those artifacts (`§10 Prompt-side hygiene`). The Optional Negative Prompt block in full output mode is a review artifact the user may reuse on other tools; it is never pasted into a VideoExpress field.

---

## §6 Duration is the single time authority

**The user-selected total duration decides everything about time.** Shot count, per-shot seconds, dialogue length, and beat count are all derived from it — never the other way round. A storyboard whose shots sum to 40 seconds when the user asked for 90 seconds is a failure, no matter how good the individual shots are.

Ask for the duration during clarify if the user didn't state one. Then derive the shot count:

| Total duration | Tight plan | Default | Detailed plan |
|----------------|-----------|---------|---------------|
| 5-10 seconds | 1-2 | 1-2 | 2 |
| 10-15 seconds | 2 | 2-3 | 3 |
| 15-30 seconds | 3-4 | 3-5 | 4-5 |
| 30-45 seconds | 4-5 | 5-7 | 6-8 |
| 45-75 seconds | 6-7 | 6-9 | 8-10 |
| 60-90 seconds | 8-9 | 8-12 | 10-13 |
| 60-180 seconds | 8-10 | 9-14 | 12-18 |

Use the **Default** column unless the user asks for fewer/denser shots (Tight) or a more granular breakdown (Detailed). The table assumes ~7 seconds per generated clip, which is what VideoExpress actually produces in practice (real clips land at 4.5-8s even when 8s was requested, because lipsync audio length overrides the slider).

**Mode fit by duration** (warn the user when the combination is off):

- ≤ 15 seconds → `single-shot` or `first-last` fits better than `storyboard`.
- `first-last` → 5-15 seconds; it is one transition, not a sequence.
- `single-shot` → 5-15 seconds.
- `short-form` → 15-45 seconds; longer belongs in `storyboard`.

Every individual clip stays ≤ 10 seconds regardless of total duration — that is a platform hard cap, not a style preference.

---

## §7 Per-shot density budget

Long-form output fails most often not because a shot is wrong but because each shot was asked to carry too much. Budget every shot:

- **ONE primary action beat per shot.** If describing what happens takes more than one sentence, split it into two shots. A generated clip can only sell one clear beat.
- **Spoken lines are sized to the shot's seconds** — roughly **2 spoken words per second** (a 6-second shot carries ~12 English words). For 中文 use the 字/秒 tables in §3, which are tighter still. Hard cap remains ≤ 120 characters per shot.
- **A shot that speaks does little else.** No simultaneous complex action while a line is being delivered — the model splits its attention and both degrade.
- **One simple motion per `[time-segment]` bracket.** Crowded segments produce mushy, rushed clips. Three clean beats beat two overstuffed ones.

Anti-pattern: a 6-shot / 30-second storyboard where every shot has an entrance, a prop interaction, a line of dialogue, and an exit. That is four beats per shot in a five-second clip; the render will be a blur.

---

## §8 Scale Lock (props, equipment, set pieces)

Objects drift in size the same way characters drift in identity. The model resolves an object name to the most photogenic example in its training data, which is usually the biggest one. A `glass cold brew tower` becomes the metre-tall Kyoto-style display rig standing in a specialty café lobby; placed next to an actor it renders like an upright aquarium and the whole frame's proportions collapse.

Apply Scale Lock to **any object whose real-world size range is wide, or whose name carries a "big" connotation** — tower, machine, rig, system, installation, statue, screen, plant, animal, vehicle.

Three moves, used together:

1. **Quantify the dimension.** Put an explicit number in the T2I: `a 50-centimeter-tall glass cold brew dripper`. A number is a hard ceiling the model respects; an adjective is not.
2. **Downgrade the modifier.** Strip size-inflating words and pick the specific product noun over the category noun that carries the connotation. `large glass cold brew tower` → `sleek tabletop glass cold brew dripper`. `professional coffee machine` → `compact single-group espresso machine`.
3. **Anchor it to the environment and to the body.** State the surface it sits on (`on the wooden counter`, `tabletop`), and have the actor's hands touch or operate it in the same shot. A hand is a size reference the model already knows; contact between hand and object fixes the ratio far better than any adjective.

**Carry the lock forward.** Scale drifts across shots exactly like identity does, so repeat the size token (`the 50-centimeter tabletop dripper`) in every shot the object appears in, and keep the hand-contact anchor in the I2V beats wherever the action allows.

❌ Anti-pattern — the object owns the frame:

`Cinematic live-action film still of Actor 1, the 30-year-old barista in a denim apron, standing beside a large glass cold brew tower in a specialty coffee shop, ...`

✅ Correct — scale locked three ways:

`Cinematic live-action film still of Actor 1, the 30-year-old barista in a denim apron, standing at a wooden counter with a sleek 50-centimeter-tall tabletop glass cold brew dripper in front of him, his right hand resting on its base as he adjusts the drip valve, ...`

---

## §9 Continuity ledger — what varies, what is frozen

Before writing shot 1, fix the facts of the world. Everything in the frozen column stays identical across every shot unless the user asked for the change or the plan declares an arc up front; everything in the varying column SHOULD change shot to shot, because repetition there reads as a placeholder.

| Frozen across shots (facts) | Free to vary across shots (description and craft) |
|------------------------------|---------------------------------------------------|
| Location identity, and which room / corner is which | Which corner or angle of that location a shot uses |
| Time of day | The wording of the lighting and atmosphere description |
| Weather, season | Framing within the allowed family |
| Wardrobe, hairstyle, accessories | Which one or two continuity-anchor traits get cited |
| Props present, and their scale (§8) | The action and the emotional beat |
| Character physical state (clean / dirty / injured), unless events changed it | Shot duration and beat structure |

**The most-misread rule in this whole knowledge base**: "vary the lighting descriptor between shots" means vary the **wording**, never the **fact**.

✅ Same room, same hour, different sentences — this is the intent:

- Shot 2: `warm afternoon light falling across the wooden counter`
- Shot 4: `soft daylight from the side window, gentle highlights on the glass`

❌ Same project drifting through time — this is the failure:

- Shot 2: `bright afternoon sunlight through the window`
- Shot 4: `warm evening lamplight, city lights outside`

### Multiple locations are welcome; unmotivated jumps are not

Several settings make a video richer, and adjacent spaces are the easy win — kitchen → dining table → living room, or counter → seating area → shopfront. Two conditions:

1. **Plausibly one continuous reality**: the same building or block, the same time of day, the same weather.
2. **Motivated by the action**: the actor carries the cup, walks through the doorway, sits down. A cut to a new room with no reason to be there reads as a different video.

### Time-of-day changes are a storyboard-level decision

Morning → dusk → night is a legitimate and powerful arc, but it is decided **during clarify, before shot 1**, never improvised per shot. When the user wants one:

- Name the arc up front (`前 3 shot 午後 → shot 4-5 黃昏 → shot 6 夜間`) and confirm it.
- Write each shot's time of day explicitly in its prompt — `晨間柔光` / `正午直射陽光` / `黃昏暖橘光` / `傍晚 blue hour` / `夜間月光` — not "lighting matches the previous shot".
- Keep it monotonic. Time does not run backwards inside one sequence.
- Remember the cost: a time jump also changes wardrobe plausibility, ambient sound, and who is around. Only spend it when the story gains something.

Absent such an arc, every shot in the storyboard happens within the same hour.

---

## §10 Burned-in text — the standing default and how to avoid it

**The user's standing preference is: no burned-in text in the video, ever.** Treat this as the default state of every project, not an option to be offered. Never ask 「要不要字幕？」 — assume no, and relax it only if the user explicitly asks for on-screen text.

The failure mode is garbled Chinese glyphs across the bottom ~12% of the frame. The characters are malformed, which tells you what is happening: the video model is *drawing* text, not adding a caption track. There is no platform setting that turns it on or off (`04-platform-videoexpress.md § Generator cards`).

### What decides it: the background of the first frame

Measured across ~70 controlled runs (full log in `docs/notebooklm-distribution/EXPERIMENTS.md`). **Wording does not matter; the hero image does.** On a fixed image, three very different lines produced 40% / 33% / 50% — indistinguishable. On a fixed line, changing the image moved the rate from 88% to 0%.

| Background of the hero image | Runs | Rate | Confidence |
|------------------------------|------|------|------------|
| **Plain studio wall** — hands, props and the product may all be in frame | 13 | **0%** | high (p ≈ 0.002 against staged locations) |
| Outdoor location, shallow depth of field, no surface across the lower frame (walk-and-talk on a sidewalk) | 5 | 20% | low — n=5, interval spans roughly 1-70% |
| Interior with a counter or table running through the lower frame | 35 | 37% | high |
| Retail interior: counter, product presentation, bright commercial lighting | ~8 | 88% | medium-high |

**Props are not the cause.** A held microphone, a held mug and a held glass of iced coffee all appear in clean runs. The isolating test — plain wall *with* the product held in both hands — came back 0 of 5. Which trait of a staged location carries the effect is not isolated.

### How to work

1. **Compose the problem out of the hero image.** For talking-head, product and promo material: chest-up or shoulders-up · plain uncluttered background · even soft lighting · at most one background object. That measured 0 of 13 with the highest-risk line. The actor **may hold the product**, so a product introduction does not have to be split into B-roll — which matters, because pure-object shots are a VideoExpress weak spot.
2. **What must go is the staged location** — retail counters, kitchen counters, café interiors, any real environment with a surface across the lower frame. Outdoor shallow-depth-of-field backgrounds sit in between and are usable when the look is worth a ~1-in-5 re-roll.
3. **Compose for the crop as a fallback.** Keep the bottom 15% free of anything essential and a failed clip is recoverable: at FullHD, trim the bottom 130 px → 1920×950, trim 231 px total from the sides → 1689×950, upscale back to 1920×1080. Cost is ~12% of frame and slight softening. Prefer chest-up over the literal `framed from head to waist` on this material, since head-to-waist puts hands and props in exactly the band that may have to go.
4. **If a frame keeps producing text, replace the image — never rewrite the sentence.** Rewriting measured as wasted effort. Re-rolling and re-generating the first frame both change the outcome.
5. **Budget for yield, and say so.** On staged material roughly one clip in three needs a re-roll. Tell the user up front instead of iterating on wording.

### Prompt-side hygiene (keep, but do not claim it prevents text)

None of these measured as a cause. Keep them because they are free and match the platform's native style — not as a defence.

- Wrap every spoken line as a speech act (`§3`) and use ASCII straight double quotes. This reliably produces speech with good mouth sync; nine clips confirmed.
- Do not format dialogue as a labelled field (`Dialogue: "..."`, `字幕：...`) inside a prompt body.
- **Never write the words subtitle, caption, lower third, text overlay, title card or 字幕 into a prompt, not even to forbid them.** Negation is weak and the token itself is the concept — this is why 「不要字幕」 has never worked. Write cleanliness positively instead: `clean unmarked frame`, `plain unbranded surfaces`, `uncluttered composition`. On VideoExpress the ban is absolute, since there is no negative-prompt field; the Optional Negative Prompt block in full output mode is a review artifact and is never pasted into a VideoExpress field.
- Keep text-bearing objects out of frame — signage, screens, packaging, whiteboards, name badges — or specify them blank, switched off, or softly out of focus. Never write what a sign says.
- `motion-explainer` is in tension with all of this: kinetic typography is text by definition. Under the standing default, explain with shapes, icons and arrows, and say so once when that domain is chosen.

### Hypotheses that were tested and killed

Quote style · prompt body language · punctuation · beat structure · dialogue register · the Lipsync pipeline · props and hands in frame · the 2026-05-20 claim that bare quoted text becomes subtitles. Each was refuted with runs; two of them had already been written into these rules before the matched test caught the confound. Do not rebuild a rule on any of them without new data — the evidence is in `EXPERIMENTS.md`.
