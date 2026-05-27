# Platform: VideoExpress

## Platform Context (inject into generated prompt)

```
## Platform Context
- Platform: VideoExpress.ai (video family, primary mode: storyboard)
- Output Goal: storyboard
- Prompt Bias: storyboard structure, T2I + I2V pipeline, lipsync-ready, character continuity
- Aspect Ratio: 16:9 / 9:16
- Total Video Duration: 30-180s (the full video, summed across spots)
- Per-Spot Duration: ≤ 10s — a "spot" in VideoExpress lingo = one I2V clip = one shot in the storyboard. HARD CAP.
- Export Rules: no watermark; no subtitles unless requested
- Notes: 本工具最初設計對象。做完整影片企劃，可生 8-12 shots，每個 spot 上限 10 秒。
```

## Mode Selection

VideoExpress supports two modes via the Gem:

| User intent | Pick mode |
|-------------|-----------|
| 完整影片企劃 / 多鏡頭 / "幫我做整個 storyboard" / 預設 30s+ | `storyboard` |
| 一個鏡頭 / 短的 / "我只要一個 shot" / "5-10 秒" | `single-shot` |

Default to `storyboard` if user doesn't specify and duration suggests > 15s.

## Platform-Specific Rules (inject verbatim into generated prompt)

```
## VideoExpress-Specific Rules
- Each Image-To-Video prompt must be ready for direct paste into VideoExpress.ai advanced mode.
- For speaking shots, repeat the speaker's brief visual description (age, attire, role) every time before the quoted line — visual anchors stabilize character identity across shots better than names alone.
- Keep quoted dialogue under 120 characters per video prompt — split longer lines across shots.
- Animate natural lipsync exactly to the quoted words: mouth shapes, jaw, cheek, blinking, breathing, eye focus.
```

## Clarify priority (when user picks VideoExpress)

After confirming VideoExpress, the Gem should clarify (skip any field user already gave):

1. **Mode**: storyboard or single-shot?
2. **Duration** + **aspect ratio** (storyboard: 30-180s; single-shot: 5-15s recommended)
3. **Domain** — default `narrative-character` if user defers
4. **MediaType** — default `live` if user defers
5. **Dialogue** — auto-detect from idea: if the user wrote literal spoken lines (with quotes or 「」), set dialogue=true; else dialogue=false

## Output format (storyboard) — minimal, the only option

Storyboard mode emits exactly 2 sections:

1. `# Actor Portrait Image Descriptions` — one paragraph per recurring actor (per `modes.md §1.2 Actor Portrait section` and `core.md §1` Actor Alias rules)
2. `# Scenes, Storyboard And Generation Prompts` — `## Shot N` H2 per shot, with bulleted `**Time:**` / `**Duration:**` / `**Text-To-Image Prompt:**` / `**Image-To-Video Prompt:**` fields

**There is no "full mode" in the Gem.** Project Snapshot / Creative Assumptions / Character Bible / Emotional Arc / Dialogue Script / Continuity Lock / Negative Prompt all live in the HTML Studio (`prompt-studio.html`), not the Gem. If the user asks for those review structures, redirect them to Studio.

Rationale: the Gem's role is fast paste-ready prompt generation in chat. Review scaffolding adds noise and breaks the copy-paste-to-VideoExpress workflow. Two clean sections, no exceptions.

## Actor capacity per spot

VideoExpress lipsync and identity animate per-spot. Adhere to these caps:

| Cap | Limit | Notes |
|-----|-------|-------|
| Soft cap (recommended) | **2 actors per spot** | Standard reliable case. Lipsync, eye direction, and identity all stable. |
| Hard cap | **4 actors per spot** | Possible per community benchmark, but identity stability and lipsync sync drop sharply. Use only when shot composition demands it. |
| Beyond 4 | — | Not supported. Split the beat across multiple shots, each with ≤ 4 actors. |

When the user's idea implies more than 2 on-screen actors in one shot, the Gem should:

1. Propose splitting that beat across shots (preferred for dialogue-heavy beats).
2. Or note explicitly that 3-4 actors in one spot risks identity drift / lipsync degradation, and confirm the user accepts the trade-off.

## Cross-spot continuity (actor styling reuse)

VideoExpress treats each spot as an independent I2V job, but **actor styling persists across spots** if the user reuses the same actor portrait or the same Continuity Anchor text in T2I prompts. Generated prompts MUST:

- Define each actor's Continuity Anchor **once** (in Character Bible for `full` mode, or in Actor Portrait Image Descriptions for `minimal` mode).
- Reuse the **exact same string verbatim** in every subsequent shot's T2I + I2V prompt that features the actor.
- Never paraphrase the anchor between shots (changing `30-year-old Asian male in dark blue suit` to `Asian man in blue suit` = identity drift; VideoExpress will re-roll the appearance).
- Actor numbering (`Actor 1`, `Actor 2`, ...) is appearance order across the WHOLE storyboard, not per-shot.

## Content shape detection (CRITICAL — picks the right calibration profile)

VideoExpress's own native generator uses **two distinct Gems** depending on content type — confirmed by user dogfood 2026-05-20. Our Gem must detect which shape applies and switch calibration accordingly. This is the single most important routing decision after platform selection.

### Shape A — Narrative / Drama / Story (slower, expressive, conversational)

- **Idea signals**: 角色之間有 dialogue / 戲劇情節 / 親子互動 / 朋友對話 / 故事 / 繪本 / 童話 / 戀愛 / 衝突 / 和解 / 教育型情境劇
- **PromptStudio domain mapping**: `narrative-character`, `narrative-scene`, `editorial-cinemagraph`, `lifestyle-vlog`, `product-demo` (when story-driven)
- **Dogfood examples**: 父親鐘錶店 (3D) · jack & mary 電影院 (3D) · 咖啡店爭吵 (3D)
- **Calibration profile:**
  - **Closing micro-action buffer**: REQUIRED. Dialogue in second-to-last beat (3s) + closing micro-action in last beat (1s). Without buffer the model auto-fills sigh / breath.
  - **Dialogue density (中文)**: 3-4 字/秒 sweet spot, 5 字/秒 hard ceiling. Tighten filler aggressively.
  - **Accent**: `natural Mandarin accent` (NO locale qualifier — `Taiwanese` increases subtitle hallucination in this shape)
  - **Tone palette**: intimate / tense-conflict / casual-candid groups (`soft, nostalgic` · `tense, upset` · `trembling, emotional` · `gentle, remorseful`)
  - **Framing**: family-內可變 (close-up maximum / chest-up maximum / waist-up maximum)
  - **Quote marks**: ASCII `"..."` strict (subtitle risk highest in this shape)

### Shape B — Talking-Head / Reporter / Interview (faster, professional, on-camera)

- **Idea signals**: 主持人 / 新聞 / 街訪 / 報導 / 訪談 / 專家對談 / podcast / 教學 / 介紹 (旅遊景點介紹 / 產品介紹 by presenter)
- **PromptStudio domain mapping**: `real-interview`, `real-report`, `educational`
- **Dogfood examples**: 街訪川普 · AI 基督教專家對談 · 京都嵐山旅遊介紹 · 平安時代歷史介紹
- **Calibration profile:**
  - **Closing micro-action buffer**: OPTIONAL. Reporters holding professional eye contact on camera after dialogue is the model's default behavior; explicit closing micro-action helps but isn't required. Dialogue in final beat is acceptable.
  - **Dialogue density (中文)**: 5-8 字/秒 acceptable (reporter pace), up to 10 字/秒 has worked in dogfood. Less aggressive filler-cutting needed.
  - **Accent**: `natural Taiwanese Mandarin accent` (or `natural Mandarin accent`) — both work; Taiwanese locale qualifier is OK in this shape, has been observed in successful talking-head outputs.
  - **Tone palette**: professional / interview / authoritative groups (`informative, engaging` · `confident, warm` · `polished, clear` · `measured, profound` · `grounded, resonant`). `informative, engaging` is VideoExpress's go-to reporter tone.
  - **Framing**: LOCKED to literal `cinematic medium shot framed from head to waist` (or `framed from head to waist or belt line`) across all shots. Variation breaks the reporter format.
  - **Quote marks**: ASCII `"..."` strict.

### How to detect (apply during INSTRUCTION.md Step 1 clarify)

1. User mentions 主持人 / 報導 / 訪談 / 街訪 / 教學介紹 / podcast / 專家對談 → **Shape B**
2. User describes characters in a story / dialogue scene / emotional arc / drama → **Shape A**
3. Ambiguous → Ask: "這支影片比較像戲劇敘事 (story-driven) 還是主持人對談/報導 (presenter-driven)？"

The shape decision happens **once per storyboard** — all shots inherit the same shape's calibration profile. Do not mix profiles within one storyboard.

---

## VideoExpress preferred prompt patterns (from native-prompt dogfood)

VideoExpress has clear strengths and weak spots. Aligning generated prompts with its sweet spot dramatically reduces "the platform didn't render what I asked for" frustration. Source: 3 native-prompt examples from VideoExpress's own Gem-based generator (2026-05-19 cold brew live-action + 2026-05-20 two 3D shorts: 父親鐘錶店 + jack/mary 電影院).

### Strengths — bias generation toward these

- **Actor-in-frame shots.** A human (full character, hands+torso, or face) appearing in every shot anchors identity reliably. Pure-object shots are weak (see below).
- **Framing depends on content type:**
    - **Talking-head / interview / street vox-pop** (domain = `real-interview` OR any content where a host + microphone + interview subject is the core shape): **LOCK the literal string `cinematic medium shot framed from head to waist` (or `framed from head to waist or belt line`) across all shots.** Do NOT substitute `chest-up maximum` / `close-up maximum` / `waist-up maximum` even if they seem equivalent — the literal phrase is what VideoExpress's native generator emits and is what aligns the model's framing prior. Variation breaks the interview format.
    - **Narrative drama** (domain = `narrative-character` / `narrative-scene` / `lifestyle-vlog` etc., NO microphone, story-driven): Framing CAN vary across shots within the family `close-up maximum` / `medium close-up` / `chest-up maximum` / `waist-up maximum`. The 3D drama examples (父親鐘錶店 / jack & mary / 咖啡店爭吵) all use within-family variation.
    - **Extended framing family** (Narrative drama only, validated 2026-05-24 dogfood at 65-85 quality scores): `worm's-eye view` · `god's-eye top-down` · `aerial drone perspective` · `over-the-shoulder` · `first-person POV` · `orbital camera` · `handheld tracking` · `full-body wide framing`. These ARE viable on VideoExpress but require the **Director Gaze framework** treatment — see § Director Gaze framework section below. Bare keyword usage without spatial parameters and subject-camera gaze rules under-renders to 50-60 quality.
    - For default framings (Talking-Head OR Narrative drama without Director Gaze treatment), never use `macro`, `wide`, `dolly zoom` as bare keywords — they under-render.
- **Vary environment / lighting descriptors across shots even when in the same location.** A 6-shot interview that uses the literal phrase `modern television studio` 6 times is a code-smell — the Gem is repeating a placeholder. VideoExpress's native generator describes the same studio differently each shot: `dimly lit high-tech television studio with warm accent lighting`, `high-tech television studio with soft blue and orange ambient lights`, `studio background with soft out-of-focus light leaks`. Each shot gets a slightly different lighting/atmosphere descriptor.
- **Stable camera or minimal move.** "Stable [framing] shot shows..." is the dominant pattern. `subtle camera push-in` is OK; aggressive `dolly zoom back`, `macro push-in`, `tracking orbit right` introduce motion artifacts.
- **Concrete actor actions on concrete objects** — `pouring water from a black gooseneck kettle`, `gently wiping dust off a small wooden frame`, `pushing past the theater armrest`. Specific verb + specific object beats abstract effects.
- **Per-shot short-form Continuity Anchor with partial paraphrase.** Each T2I and each I2V re-reference the actor with `<Actor Alias>, <2-3 trait phrase>` — keep Actor Alias identical, vary which 1-2 traits get cited. Example: Shot 1 says `Actor 1, the elderly watchmaker with wire-rimmed glasses`; Shot 2 same actor says `Actor 1, the elderly watchmaker with a canvas apron`. Don't insist on verbatim repetition of the full Character Bible paragraph.
- **T2I stability boilerplate.** Every T2I includes the literal phrase `stable composition, clear expressive face`. For dialogue shots, also add `mouth visible` immediately after.
- **Variable shot duration matched to content.** 5-6s for pure-action shots; 8s for single-dialogue-line shots; 9s for multi-beat-dialogue-+-interaction shots. 10s is the platform hard cap per spot.
- **Dynamic I2V time-split.** Beat count scales with shot length: 5s = 2 beats, 6s = 2-3 beats, 8s = 3-4 beats, 9s = 3 beats. Each beat = 1.5-4s. **Dialogue occupies the final beat** as a self-contained speech-act wrap; preceding beats lead in with action.
- **Speech-act wrap with 2-word tone combo + neutral accent.** Per `core.md §3`: `Actor 1 says in a whispered neutral American accent: "..."` or `Actor 1 ..., and says in a trembling, emotional voice: "..."`.

### Weak spots — avoid these in generated prompts

- **Pure product / pure object shots with no human.** VideoExpress is tuned for character-driven scenes; pure-product shots (a tower dripping, a glass with condensation, beans cascading) tend to produce mismatched object geometry — e.g. machine and cup mashed together.
- **Bare aggressive camera-move keywords without Director Gaze treatment.** Writing `dolly zoom back` / `tracking orbit` / `worm's-eye view` as a bare framing word without spatial parameters under-renders to 50-60 quality. WITH the Director Gaze framework (three-question test + numerical spatial parameters + subject-camera gaze rule), all of these camera moves are viable at 85+ quality. See § Director Gaze framework below.
- **Abstract fluid dynamics descriptions** (`micro-bubbles forming`, `liquid swirls violently`, `swirling amber patterns`, `micro-droplets trace down`). The model under-renders these because they have no visible actor verb to anchor on.
- **Cross-shot framing chaos within a single storyboard.** Mixing default close-up→waist-up family with Director-Gaze-treated extended framings in the same storyboard breaks continuity. Pick one register per storyboard and stay consistent.
- **Full Continuity Anchor paragraph repeated verbatim inside every shot.** Redundant; use short-form re-references instead (per `core.md §2`).

### When the user's idea sounds product-heavy

If the idea is purely product-focused (e.g. "make a 30s cold brew commercial"), the Gem should propose a **storyboard that places a barista's hands or torso in every shot** — even when the shot's narrative purpose is "show the product extracting" — rather than emitting pure-product shots. Mention this trade-off briefly during clarify so the user understands why.

## Director Gaze framework (for non-default / extended framings)

Validated 2026-05-24 dogfood across 4 iteration rounds on 5 originally-banned framings (worm's-eye / orbital / god's-eye / handheld / first-person POV). All 5 reached 65-85 quality scores once written with this framework — bare keyword usage stayed at 50-60. Use this section ONLY for `narrative-character` / `narrative-scene` / `lifestyle-vlog` Shape A content; Talking-Head Shape B stays locked to its literal framing string.

### Step 1 — Answer three director questions BEFORE writing the prompt

Before composing T2I or I2V for any extended framing, internally answer:

1. **Camera 是誰的眼睛？** — Whose POV is the lens? Choices: invisible observer · the protagonist (POV) · a small creature on the ground · a high-altitude drone · an over-the-shoulder of another character · a tracking handheld operator. State this as `photographed from <X> perspective` or `the camera POV is that of <X>`.
2. **Camera 跟 actor 的空間關係？** — Numerical spatial parameters. Distance in cm / meters, height (ground level / chest height / 20 meters overhead), angle in degrees, radius for orbital. NEVER leave this implicit — write it as `lens positioned at <distance> from <subject> at <height>, angle <degrees>°` or `at a fixed <N>-meter radius and <height> level`.
3. **Actor 有沒有 acknowledge camera？** — Three options: `makes direct eye contact with the camera lens` · `gazes past the camera, unaware` · `briefly acknowledges then returns gaze elsewhere`. The 蟲視角 v3 dogfood failed at 65 because actor wasn't told to look at camera; v4 fixed it to direct eye contact and scored 65 again with the right gaze relationship.

### Step 2 — Five-step writing process

When composing each shot's T2I + I2V with an extended framing:

1. **POV identity** — open T2I with `photographed from <Director-answer-1> perspective` so the model knows whose eye this is
2. **Numerical spatial parameters** — write Director-answer-2 explicitly in the camera clause
3. **Subject-camera gaze** — write Director-answer-3 in the actor's action clause
4. **Lock actor pose explicitly** — for non-default angles (top-down / worm's-eye), state pose verbs in absolute form: `lies flat on his back motionless in supine position` / `eyes closed peacefully` / `body completely motionless`. Repeat the pose in every I2V beat to prevent drift.
5. **Time-bound continuous motion** — for orbital / push-in / pull-out, break the I2V into sequential beats with explicit angle/distance progress (`first 120-degree arc` / `next 120-degree arc` / `final 120-degree arc`) and the closing beat must specify `completes a complete full <N>-degree revolution by the <T>-second mark`.

### Common pitfalls

Three failure modes from 2026-05-24 v3 dogfood. Avoid all three when writing extended-framing prompts.

#### Pitfall 1 — Anti-scaffold pollution

NEVER describe POV with metaphor scaffolding that introduces a visual entity not meant to appear on screen.

**Wrong (v3 Test 1 caused VE to literally render a bug on screen):**

`Stable extreme worm's-eye view shot ... Actor 1 maintains direct eye contact with the camera, then slowly crouches lower as if observing a small creature at his feet, leaning closer to inspect the unseen creature (the camera).`

**Right (v4 Test 1 — pure abstract spatial description, no metaphor entity, body stays still):**

`Stable extreme worm's-eye view shot from a ground-level lens position 30 centimeters in front of Actor 1's shoes shows him towering above the camera, his face small at the top of the frame, looking directly down into the lens with mild curiosity, sustained eye contact throughout, his body remaining completely stationary. ... Actor 1's expression slowly shifts from mild curiosity to a faint warm smile, while his head position, body, arms, and feet all remain completely stationary.`

Rule: describe `the camera` directly, never `as if observing X` / `as if inspecting Y`. If the action verb requires an entity to interact with, it WILL appear on screen.

#### Pitfall 2 — Action verb attribution

VE attributes ambiguous action verbs (`looking down` / `facing up` / `bending forward`) to the nearest human subject, which can flip actor pose.

**Wrong (v3 Test 5 caused actor to flip from supine to standing-looking-up):**

`perfect vertical top-down god's-eye view looking straight down at Actor 1, a 30-year-old Asian male in a dark blue suit, lying on his back ...`

The phrase `looking straight down` got attributed to Actor 1, flipping pose interpretation.

**Right (v4 Test 5 — actor pose verb-clause pushed to the front, explicit motionless tokens):**

`perfect vertical top-down god's-eye view, Actor 1 (a 30-year-old Asian male in a dark blue suit, short black hair, square jaw) lies flat on his back motionless in a supine position on a large circular paved plaza, his eyes closed peacefully, arms spread wide along two opposite radii ...`

Rule: in every I2V beat, repeat `Actor 1 remains lying flat on his back throughout` / `body and arms unchanged from the supine position`. Locking pose in every beat is cheap insurance.

#### Pitfall 3 — Time-bound camera motion

Continuous camera moves (orbital / push-in / pull-out) default to slow pacing. A 10-second orbital `Smooth continuous 360-degree orbit` often only completes 200-270°.

**Wrong (v3 Test 2 — slow pacing, didn't complete 360°):**

`[0-10 seconds]: Smooth continuous orbital camera moves clockwise around Actor 1 ...`

**Right (v4 Test 2 — explicit angular progress per beat + closing completion clause):**

`[0-3 seconds]: ... completing the first 120-degree arc from his front to his right rear angle ... [3-7 seconds]: ... completing the next 120-degree arc from his right rear past his direct back to his left rear angle ... [7-10 seconds]: ... finishing a complete full 360-degree revolution by the 10-second mark ...`

Rule: continuous moves get 3+ beats with numerical angular/distance progress per beat, and the closing beat states absolute completion (`completes a complete full <N>-degree revolution by the <T>-second mark`).

#### Pitfall 4 — Object interaction over-specification

Writing concrete object-interaction triggers (`Actor 1's foot strikes the stone` / `his hand catches the vine` / `his shoulder hits the door`) gets VE to render the accident as a **deliberate action** — actor stops on the stone, stands on it, jumps off; actor reaches for the vine intentionally; actor pushes the door open with intent. VE cannot distinguish "accident" from "intention" when an object trigger is named.

**Wrong (2026-05-25 v6.7 Shot 3 — VE rendered Actor 1 standing on the stone and jumping down deliberately):**

`Actor 1's lead foot strikes the gnarled gray stone protruding from the path, his upper body lurches forward sharply with arms flailing, expression shifting from determination to alarmed surprise, his momentum carrying him off-balance.`

**Right (主公手動改良 — outcome-only, no object trigger named, abstract physics cause):**

`Actor 1 奔跑時，上半身猛然向前傾倒，雙臂向前揮舞試圖緩衝跌落，表情從堅定瞬間轉變為驚慌失措的訝異，橫向衝刺的動能使他完全失去平衡。`

Rule: for accidental physical events (trips, slips, drops, collisions, lost grips), write **outcome-only**: describe the body state (`upper body lurches forward`), the resulting motion (`arms flailing to break the fall`), and an abstract physical cause (`the momentum of his sprint carries him off-balance`). NEVER name the specific object the body interacted with — VE will turn the accident into a deliberate goal-oriented action. Also applies to: hiding behind cover (don't write `rolls toward the boulder for cover` → write `the rolling momentum naturally decelerates as he passes behind the rock`).

**Important sub-rule — accidental vs deliberate object interaction:**

Pitfall #4 applies to **accidental** interactions only. **Deliberate** object interactions (picking up a prop, pushing a button, opening a door, drawing a weapon) MUST be specific and named — VE renders these correctly because the goal-oriented framing matches the action verb.

✅ Deliberate prop usage (具體 name object + 動作 OK, validated 2026-05-25 Shot 5):

`Actor 1 右手帶著刻意的緊迫感向下伸向工作短褲的側面口袋，從中取出一個小巧精緻的緊急呼叫器，雙手將其捧至胸前。他的拇指找到呼叫器上的啟動按鈕，以單次決定性的動作用力按下，裝置上一盞小指示燈隨之亮起。`

VE renders the emergency caller, the button press, and the indicator light correctly — because reaching into a pocket and pressing a button are clearly deliberate actions.

Quick rule of thumb: ask "is this happening **to** the actor (accident) or **by** the actor (intent)?" Accidents go outcome-only. Intents go specific. Examples:
- Tripping = accident → outcome-only
- Pulling a knife = intent → specific OK
- Getting hit by debris = accident → outcome-only
- Catching a falling object = intent → specific OK (`he reaches out and catches`)
- Slipping in mud = accident → outcome-only

#### Pitfall 5 — Audio scaffold pollution

Same problem as Pitfall 1 (anti-scaffold pollution) but in the audio dimension. Writing off-screen creature audio cues (`distant T-rex roars from both ahead and behind` / `heavy off-screen breathing approaches`) signals strongly enough that VE generates a **new visible creature** in the frame to visualize that audio, even when T2I explicitly says `NO creature visible in this shot`.

**Wrong (2026-05-25 v6.6 Shot 2 — VE generated a new T-rex from off-frame to roar at the group, halting the chase mid-shot):**

`No background music. Ambient natural sound only: thunderous off-screen T-rex footfalls and deep guttural roars coming from behind the frame, panicked breathing and frantic footsteps from the explorers.`

**Right (2026-05-25 v6.7 Shot 3 — predator threat conveyed only through Actor 1's behavior, no off-screen audio):**

`No background music. Ambient natural sound only: heavy panicked breathing from Actor 1 dominating the foreground audio, jungle ambience of insects buzzing and leaves rustling, no predator audio in this shot — the dual threat is conveyed through Actor 1's behavior alone.` Plus a declarative line in T2I: `The creature threats are NOT visible in this shot — the predator presence is implied entirely through Actor 1's terrified scanning behavior, NOT through any visible creature in the frame.`

Rule: when a threat or character must remain off-screen, convey their presence **only through the visible actor's behavior** (scanning, flinching, panicked expression, taking cover). Do NOT use audio cues to suggest off-frame entities — VE will visualize them anyway. Audio stays restricted to the visible actor's foley (breathing, footsteps) + ambient environment (wind, insects, leaves).

### Validated example prompts (2026-05-24 dogfood v4)

Reference these for phrasing when generating extended-framing prompts:

#### Worm's-eye view — quality 65/100, validated

T2I (essential anchor): `Cinematic live-action film still photographed from an extreme worm's-eye view, the camera positioned directly on the ground approximately 30 centimeters in front of Actor 1's shoes, lens tilted upward at a steep angle of roughly 70 degrees, Actor 1 stands directly above the camera and looks straight down into the lens with mild curiosity, making direct eye contact with the camera, his trouser legs and shoes dominate the foreground while his face appears small at the top of the frame, dramatic vertical foreshortening, stable composition, ... clean unmarked frame.`

I2V pattern: Two beats — both stable, sustained eye contact, only expression changes (no body motion).

#### Orbital camera — quality 85/100, validated

T2I (essential anchor): `Cinematic live-action film still of Actor 1, full-body wide framing, standing alone and motionless in the exact center of an empty rooftop helipad with the full Taipei city skyline spread behind him, his entire body visible from head to feet, the camera framed from his front at chest-height level approximately 4 meters away, ... clean unmarked frame.`

I2V pattern: Three beats × 120° each — `first 120-degree arc from his front to his right rear` / `next 120-degree arc from his right rear past his direct back to his left rear` / `final 120-degree arc returning past his left side to his original front angle, the camera finishing a complete full 360-degree revolution by the 10-second mark`.

#### God's-eye top-down — quality 85/100, validated

T2I (essential anchor): `Cinematic live-action film still photographed from a high aerial drone perspective at approximately 20 meters overhead, perfect vertical top-down god's-eye view, Actor 1 lies flat on his back motionless in a supine position on a large circular paved plaza, his eyes closed peacefully, arms spread wide along two opposite radii of the surrounding pattern, ... intricate concentric circular patterns of hexagonal granite paving stones, each stone approximately 30 centimeters wide, alternating concentric rings of light gray and dark gray creating clear visible ring bands radiating outward from him at the center, ... clean unmarked frame.`

I2V pattern: Two beats — both repeat `lying flat on his back throughout` / `body and arms unchanged from the supine position` to prevent pose drift.

#### Low-angle hero/action shot — 低角度英雄動作仰拍, validated 2026-05-27

For break-out / leap / rescue / roll action where the subject should read as powerful and dynamic. NOT the same as worm's-eye (extreme 30cm ground contact + static eye contact); this is mid-to-wide framing + full real-time action.

T2I (essential anchor): `電影感寫實劇照，戶外中遠景低角度仰拍。<魁梧主體> 用 <寬闊厚實的後背/肩膀> 作為護盾 <主動作，e.g. 猛力撞碎二樓玻璃窗>，同時將 <被保護者> 緊緊護在胸前。無數玻璃碎片在火光中向外四濺。... 強烈戲劇性火光照明、高對比、強烈動態速度感。畫面乾淨無浮水印，16:9。` + Declaration 1 anti-slow-mo line + Declaration 2 ambient-sound line.

I2V pattern: Two beats with a physics arc — `[0-3s]` explosive action (撞碎/躍出/墜落, glass shards + smoke ejecting outward, body airborne) → `[3-8s]` impact-absorb-recover landing (`雙腳穩穩重重降落...膝蓋深蹲微曲以吸收動能，地面炸開一圈灰塵。他迅速站直身體...大步走出塵土`). The landing beat needs the impact→absorb→recover physics layering, not a flat "lands and stands".

#### In-vehicle POV — 載具內往外看（窗框/擋風玻璃當前景框）, validated 2026-05-27

For cockpit / cabin / car interior looking outward or downward. Vehicle structure (window frame, dashboard, windshield) becomes the foreground framing element; the frame does the visual work, so keep camera motion minimal.

T2I (essential anchor), two variants:
- Side / character variant (#5): `穩定的中景側面鏡頭，攝影機置於 [載具] 外側略偏後方，與 Actor 1 平視，捕捉他的側臉與向外凝視的姿態以及窗外景物。`
- Cockpit / search variant (#8): `從 [載具] 駕駛艙內部透過前方擋風玻璃向下俯瞰 [地景]。儀表板與駕駛艙框架在前景下方清晰可見，提供明確的駕駛艙視角框架。`

I2V pattern: stable mount + slow controlled move. Emotional beat (#5): `穩定中景側面 → 緩緩推近至臉部中景特寫 → 拉遠`, layering emotional residue per § Realism layer. Search beat (#8): `駕駛艙視角隨飛行軌跡略微橫移，樹冠缺口短暫揭露遙遠下方地面`.

#### God's-eye vertical fall — 垂直墜落動態變體, speed-segment validated 2026-05-27 (前段 unsolved — see backlog)

The static god's-eye above is supine/motionless. For a DYNAMIC vertical fall, the validated fall-speed trick (#3 後段): make the actor pass fast-moving vertical reference objects (`高速落下時，接連經過一排排的公寓窗戶`) plus severe downward motion blur — the passing rows give the parallax that reads as falling.

⚠️ Unsolved (backlog): pure top-down with no scale reference in the first 1-2s renders as horizontal "flying flat", not falling (#3 前段). The fall only reads once reference objects start passing. See § Open calibration backlog #1.

## Required prompt-level declarations (anti-default directives)

VE has built-in defaults that fight against several common intents. These four declarations MUST be included in every action/chase prompt to override the defaults. Validated 2026-05-25 v6 dogfood.

### Declaration 1 — Anti slow-motion

VE defaults action scenes to cinematic slow-mo aesthetic. Without this declaration, chases render at 0.6-0.8x natural speed with elegant slow-mo pacing.

Required wording (use verbatim):

> Critically: this is NOT slow-motion footage, NOT cinematic slow-mo treatment — all motion plays at full natural real-time velocity.

Plus drop these slow-mo-triggering tokens from action prompts: `Stable [framing] tracking shot` (replace with `Fast dynamic` / `Dynamic`), `cinematic motion blur` (replace with `severe ground-rushing motion blur` or `sharp motion blur`), `slowly` / `gradually` / `gently` / `subtle` adverbs. Reinforce with velocity vocabulary repeated 3+ times: `absolute maximum running speed` / `full chase velocity` / `real-time chase pace` / `at brisk pace`.

### Declaration 2 — Anti background music

VE defaults action scenes to background music underscore. Without explicit override, every chase/drama scene gets soundtrack.

Required wording (use verbatim):

> No background music. Ambient natural sound only:

Then enumerate ONLY foley sounds tied to visible elements (Actor's breathing, footsteps, ferns rustling, body rolling on dirt) and ambient environment (insects, leaves, wind). DO NOT enumerate off-frame creature sounds — see Pitfall 5 (audio scaffold pollution).

**Supplement — audio crescendo across beats:**

For multi-beat shots where the audio narrative develops (new sound emerging → building → dominating), describe audio progression **per-beat** parallel to visual beats, not as one static description in the T2I header.

❌ Static audio (single description applies to all beats, audio renders flat):

`Ambient natural sound only: jungle insects, distant helicopter approaching, leaves rustling.`

✅ Audio crescendo (validated 2026-05-25 Shot 6, helicopter approaches gradually):

- `[0-2s] 潮濕的熱帶雨林環境聲——蟲鳴、滴水聲與厚重葉片沙沙聲——填滿音效` (環境聲 dominant)
- `[2-4s] 直升機旋翼遠處隱約的規律轟鳴聲開始在潮濕的雨林環境音中浮現` (helicopter emerges)
- `[4-6s] ...旋翼聲音逐漸增大` (helicopter grows)
- `[6-8s] 旋翼聲此刻清晰主導音效` (helicopter dominates)

Rule: when an audio element evolves across the shot (emerges / intensifies / recedes), write the audio per-beat in the I2V body. Static T2I-only audio descriptions cause VE to flatten the audio bed across all beats.

### Declaration 3 — Closing beat: camera halts, actors continue

For shots ending mid-chase or mid-action (where the narrative continues into the next shot), the closing 1-second beat must **stabilize the camera while keeping actors moving at full pace**. Without this explicit decoupling, "stabilizing" signal leaks backward and slows the whole shot.

Required wording for closing beat (template):

> [N-1 to N seconds]: The camera halts its forward advance and holds position with NO further camera motion and NO bobbing, but [the actors] continue their full-speed [action] at their exact unchanged maximum pace [continuing toward / running into] [destination], the frame stabilizing while the [actors and other moving elements] continue moving forward at full velocity.

For shots where action concludes within the frame (actor settles into hiding, action sequence ends), use a different closing — both camera and actor naturally settle: `Actor 1 comes to rest ... body otherwise motionless as he settles into hiding`. The two endings have different semantics — use the right one for the shot's narrative role.

### Declaration 4 — Reference frame instruction (multi-shot continuity)

When generating shot N ≥ 2 in a storyboard sequence, the user can supply the last frame of shot N-1 as a reference image. The prompt MUST explicitly tell VE how to use it — otherwise VE may treat the reference as extension (continuing the previous staging verbatim, locking new camera setups out).

Required opening template:

> Using the provided reference frame from the previous shot for visual continuity of [the characters / creature / environment]: maintain the exact visual identity of [Actor 1's clothing, hair, face / Creature 1's appearance / the environment]. However, change the camera setup [or scene composition] entirely: this shot uses [new perspective description].

The two clauses (maintain identity vs change setup) MUST appear explicitly. Without the `However, change` clause, VE treats reference as an extension lock.

## Cinematography patterns by scene type

VE's training data is dominated by specific cinematography conventions per scene type. Writing a prompt that fights the dominant pattern (e.g. forward tracking from behind during a chase) causes VE to fallback to the convention anyway. Match the convention from the start.

| Scene type | Dominant cinematography | Camera setup | Validated dogfood |
|------------|-------------------------|--------------|-------------------|
| **Chase / pursuit / fleeing** | **Reverse dolly** — camera in front of running actors, retreats backward at matched speed | `camera positioned in front of the group at chest height ~6 meters ahead of [lead actor], dollying backward at matched chase velocity to maintain distance, lens facing the runners directly` | Shot 1 v6.3 (2026-05-25), validated at "given pass" quality. Forward tracking from behind (v6.2) failed — VE flipped actors to face camera anyway. |
| **Aerial god-view chase** | Drone tracking 10-15m above at 45-60° downward, both predator and prey in frame | `aerial drone perspective approximately 12 meters above the jungle floor and angled downward at roughly 55 degrees` | Jurassic Park-style; matches dinosaur movie training data dominant pattern |
| **High-angle group tracking** (no creature visible) | Elevated forward tracking 4m, 35° downward, only prey in frame | `from a high elevated angle ... 4 meters above ground floor and angled downward at roughly 35 degrees` + `NO creature visible in the frame` | Shot 2 v6.6 (2026-05-25); creature must NOT be visible due to composition complexity limit |
| **Side action / lateral sprint** | Side-tracking, camera lateral with actor's sideways motion | `medium tracking shot from a three-quarter side angle, camera positioned at chest height ~3 meters to [actor]'s right side, lens tracking laterally at matched speed` | Shot 3 v6.7 (2026-05-25) |
| **Approach / entrance** | Forward dolly — actor moves into scene with back to camera | `camera positioned ahead, actor walks into frame moving away from camera` | Inverse of chase |
| **Predator first-person POV** | Forward dolly with bobbing, snout in foreground — but VE handles this poorly (see Known limitations) | Avoid for now; substitute with **aerial god-view** or **high-angle no-creature** | Shot 2 v6.3 / v6.4-A / v6.5-A / v6.5-B all failed |
| **Closing wide shot / receding danger** | Static wide long shot, actors recede into distance | `wide static shot at chest height ~6 meters, lens looking down the path toward the receding action` | Shot 6 v6 design |
| **Hero action / break-out / leap** (破窗、躍出、救援、翻滾) | **Low-angle mid-to-wide upward shot** — camera low, tilted up, subject towers with dynamic force | `戶外中遠景低角度仰拍` or `low-angle ground-level lateral tracking` — camera at ground level looking up or tracking laterally, subject fills frame with motion | #1/#7/#11 (2026-05-27). Distinct from worm's-eye (extreme 30cm static eye-contact) — this is mid/wide framing + dynamic action |
| **Entering danger / charging in** (衝入火場、進攻) | **Over-the-shoulder low-angle tracking** — camera tight directly behind subject's back, low angle, strong forward momentum | `動態低角度越肩跟拍鏡頭，鏡頭緊跟在 [Actor] 正後方` + `極具速度感與動態前進感` | #15 (2026-05-27). Naming `越肩跟拍` / `over-the-shoulder tracking` parses far better than vague 「背對鏡頭」 — see naming Rule below |
| **In-vehicle POV** (座艙/駕駛艙往外看) | **Vehicle structure as foreground frame** — window frame / dashboard / windshield framing the outward view | side variant: `攝影機置於 [載具] 外側略偏後方，與 [Actor] 平視，捕捉側臉與向外凝視姿態`; cockpit variant: `透過前方擋風玻璃向下俯瞰，儀表板與駕駛艙框架在前景下方清晰可見` | #5/#8 (2026-05-27) |
| **Descending push-in** (高空下降逼近) | **High-angle descend + push-in compound** — lower the height while moving closer, framing narrows group→single subject | `elevated high-angle tracking from ~4m at 35° downward, then descending push-in lowering to ~2m while moving closer to [Actor] from behind, framing narrowing from group-wide to focus on [Actor]'s back` | #13 運鏡可學 (2026-05-27). Caveat: #13 overall failed because the predator was wrongly staged in front — the camera move is sound, the staging must still obey § T2I composition rules |

**Rule**: pick the cinematography from this table BEFORE writing the Director Gaze answers. The wrong pattern (e.g. forward tracking for chase) makes Director Gaze adjustments fight VE's prior — they will be overridden.

**Rule — name the move professionally**: VE parses **named professional camera-move vocabulary** (`over-the-shoulder tracking` / `reverse dolly` / `low-angle hero shot` / `descending push-in` / `side-tracking`) far more reliably than informal spatial descriptions like 「背對鏡頭」/「從後面拍」. Dogfood 2026-05-27 ground truth: the same intent named as a move lands; phrased loosely, VE falls back to its own convention. Pair the named move with a reference image for best adherence.

## T2I composition complexity guidance

VE T2I struggles with **compound layered subjects in a single frame** — e.g. `predator snout in soft-focus foreground + 4 small actors in middle ground + jungle depth in background`. Validated 2026-05-25 Shot 2 v6.3-v6.5: all attempts to put recognizable creature parts in foreground with prey in background failed (rendered as chase scene from front, ignored POV setup).

Rules for T2I composition:

1. **Single primary subject** per T2I — either the actors OR the creature, not both as co-equal foreground subjects.
2. **Background subject is fine** — main subject foreground + secondary subject in middle/far ground (e.g. Actor 1 chest-up foreground + chase happening through gap in background) works.
3. **NO floating shadow / silhouette overlays** — VE renders them as 2D sticker pasted on the frame, not as cast shadow physics. If you need to imply an off-frame predator, use **audio + camera bobbing as if mounted on a creature** instead of visual shadow tricks.
4. **NO foreground partial-body cues** — `snout entering frame bottom`, `claw tip visible in foreground` etc. VE renders the partial body as a complete creature in the wrong position. If predator POV is needed, use abstract spatial description only (`from the elevated perspective of a large predator at 4m height`) without rendering the predator's body parts.
5. **When in doubt, simplify** — pick the one composition layer that matters most for the shot and drop the rest. Compound staging in a single T2I is the most common reason for failure.
6. **Use specific reference-tagged settings over generic ones** — generic descriptions (`tropical jungle`, `city street`, `office`) leave VE to fall back to base interpretation. Reference-tagged settings that invoke a recognizable film / cultural / aesthetic register give VE a much stronger prior (it has trained on the reference material).

   ❌ Generic (default tropical jungle, base interpretation):
   
   `茂密的熱帶叢林，厚實綠色蕨類植物、糾結的樹根、長滿苔蘚的巨石、斑駁陽光穿透樹冠。`
   
   ✅ Specific film-reference setting (Jurassic Park 美學, validated 2026-05-25 Shot 6):
   
   `侏羅紀規模的巨型史前樹蕨與巨大蘇鐵植物高聳頭頂，龐大藤蔓垂掛於巨型樹幹之間，寬葉熱帶植被密集多層次地叢生，地面覆蓋著巨型蕨類植物、厚實苔蘚根系，以及熱帶潮濕積水。`
   
   Other valid reference frames the user / Gem can lean into:
   
   - Cyberpunk / Blade Runner: `霓虹浸潤的雨水反光街道，下水道蓋冒出蒸氣，巨型企業招牌以日文片假名高聳於頭頂，地面層的人力車於柔焦背景中穿梭`
   - Western frontier: `風塵僕僕、陽光曝曬的拓荒小鎮主街道，飽經風霜的木製酒館門面，滾動的風滾草，乾燥的紅土，金色時刻的剪影`
   - 1940s noir: `夜間雨水反光的鵝卵石巷弄，單一一盞鈉燈投下強烈陰影，淡薄的霧氣於紅磚牆間飄移`
   - 港式武俠 / Wong Kar-wai: `1960 年代香港九龍小巷，霓虹招牌泛著紅綠黃色光暈，潮濕的水泥地反映燈光，遠處有人騎自行車穿越鏡頭`
   
   Rule: when the setting is iconic enough to be recognized via reference, lean into the iconic descriptors. Generic settings cost narrative impact AND visual specificity for no benefit.

## Multi-shot narrative continuity

Reference frame instruction (Declaration 4) handles character identity continuity (clothing, hair, face). But for storyboards with cumulative narrative events — physical injuries, prop accumulation, time progression, emotional state buildup — ALSO write **explicit narrative continuity** so the storyboard reads as one continuous reality, not isolated shots.

### Physical continuity — wounds, props, dirt accumulation

For storyboards where actors physically suffer or change state, carry the consequences forward in **every subsequent shot's** identity descriptor.

✅ Validated example (2026-05-25 jungle chase Shot 3 → 5 → 7):

- **Shot 3** (Actor 1 trips and falls): clean clothing, no wounds yet
- **Shot 5** (Actor 1 hides behind boulder, inspects himself): `全身大量沾附泥土、碾碎的葉片，以及因跌倒留下的新鮮擦傷 ... 右手掌心有一道清晰可見的新鮮擦傷，帶有血跡；右膝褲管撕裂，露出底下的擦傷傷口`
- **Shot 7** (Actor 1 rescued in helicopter, hours later): `身上有基本急救包紮——右手掌與右膝纏著白色繃帶，衣物仍沾滿泥污與乾血跡` ← bandaged at the EXACT SAME locations from Shot 5 wounds

Rule: when generating shot N, the actor identity descriptor MUST include consequences from all prior shots — dirt, wounds, torn clothing, fatigue, prop additions / losses. Reference frame instruction's `maintain visual identity` alone does NOT carry these state changes — they must be explicitly enumerated in each subsequent shot's prompt.

### Time-of-day progression as narrative cue

Long-form storyboards (5+ shots) gain emotional weight from explicit time-of-day arc. The narrative builds when lighting and atmosphere shift between shots.

✅ Validated example (2026-05-25 jungle chase, 7-shot arc):

- Shots 1-5 (chase + hiding): `斑駁的晨間陽光從上方樹冠穿透`
- Shot 6 (rescue helicopter arrives): `黃昏時分，景色已經趨於昏暗`
- Shot 7 (cliffhanger ending): `夜間場景，光線昏暗 ... 月光與直升機微弱的艙內燈光`

Rule: pick the time-of-day arc up-front during clarify step (`30 秒 chase → 黃昏 rescue → 夜間 ending`). Each shot's prompt explicitly states its time-of-day, not just "lighting matches previous" — be specific: `晨間柔光` / `正午直射陽光` / `黃昏暖橘光` / `傍晚 blue hour` / `夜間月光` / `深夜全黑`.

### Compound emotional states beat single emotion cues

Single emotion tags (`panicked` / `terrified` / `relieved`) cause VE to render flat one-note expressions. **Compound emotional states** describing 2-4 layered feelings + 2-3 micro-physical tells produce micro-expressions with depth.

❌ Single emotion (flat one-note expression):

`Actor 1 looks relieved as the helicopter approaches.`

✅ Compound ensemble (validated 2026-05-25 Shot 7):

`眼神中充滿死裡逃生的僥倖、未散的驚魂、極度的疲憊，以及一絲茫然的沉默。嘴唇微閉，眉頭輕鎖，眼眶略顯濕潤。`

Rule: for emotional close-ups (chest-up or closer framing), layer 3-4 emotional states + 2-3 micro-physical tells (lip position, brow tension, eye moisture, jaw set, breath pattern). The combination renders into nuanced expression VE can interpret. Reserve for shots where emotion IS the subject — not for action shots.

## Realism layer — making actors live (Shape A only)

> "AI 會畫人，但不會讓人活著。" 真實感的問題不是解析度，而是「情境中的存在感（Presence in Context）」。假 AI：「她正在給你看她長什麼樣」。真人物：「她正在經歷某件事情，而你剛好看到」。

This section applies to **Shape A Narrative drama only**. Shape B Talking-Head reporter content is intentionally 「對鏡頭存在」 — these rules would damage interview / podcast / report scenes.

### Sub-layer 1 — Five-layer presence checklist

Every shot featuring a person should hit at least 3 of these 5 layers explicitly. Missing all 5 is the #1 cause of "AI 假感" (即使解析度很高).

| Layer | What it covers | Common AI failure mode |
|-------|----------------|------------------------|
| **生理層** (Physiological) | 呼吸、重心、疲勞、汗水、體溫感 | 太完美無瑕疵 |
| **行為層** (Behavioral) | 主行為 + 次級動作鏈 | 動作太單一、太 finished |
| **情緒層** (Emotional) | 情緒殘留（過去事件的延遲影響）| 情緒太直接、瞬間切換 |
| **環境層** (Environmental) | 被世界影響（風、光、聲、溫度）| 人物像獨立圖層 |
| **時間層** (Temporal) | 有前後事件、累積狀態 | 太瞬間、無歷史 |

Quick self-check before finalizing a shot: count which layers are touched in the prompt. < 3 layers = thin, refactor before generating.

### Sub-layer 2 — 行為三層架構 (主行為 + 次級動作 + 環境反饋)

For any non-pure-action shot (drama, dialogue, contemplative, transition), write **three layers of behavior simultaneously** — not just the main action.

❌ Single-layer (flat, 「會動的海報」):

`Actor 1 站在便利店等待微波食品，看著鏡頭。`

✅ Three-layer (validated 真實感 framework):

- **主行為 (Main Action)**: `Actor 1 站在便利店收銀台旁，視線投向加熱中的微波爐`
- **次級動作 (Secondary Motion)**: `右手無意識地轉動著手機，左手輕咬吸管，眼神短暫飄向窗外的車流後又拉回`
- **環境反饋 (Environmental Feedback)**: `冷氣出風口的微風輕拂她耳後的髮絲，便利店冷白燈光在她臉頰投下平面光影，冰櫃壓縮機的低頻震動隱約傳來`

Rule: every shot featuring a person doing something should write all three layers in the prompt body. Without secondary motion + environmental feedback, the actor renders like a static figure pasted onto a background.

### Sub-layer 3 — 情緒殘留 (emotional residue from prior events)

Distinct from Compound emotional ensemble (multiple emotions *now*) — 情緒殘留 is **the lingering imprint of a past event on the actor's present body language**. This carries narrative weight across time.

| Past event | 殘留 expression on current shot |
|------------|---------------------------------|
| 剛吵完架 | 呼吸略急促，肩膀緊繃，視線避開對話對象 |
| 剛哭過 | 眼神空洞略紅，鼻翼微紅，嘴唇略乾 |
| 熬夜加班 | 肩頸明顯疲勞，眨眼速度緩慢，動作半拍延遲 |
| 收到壞消息 | 短暫停頓的動作，視線無焦點地凝視一處 |
| 剛從劇烈運動恢復 | 胸口仍微微起伏，汗水未乾，臉頰殘紅 |
| 剛經歷恐懼威脅 | 手指仍微微顫抖，呼吸不規則，雙眼焦距難以聚焦 |

✅ Validated example (2026-05-25 jungle chase Shot 7, 主角剛從跌倒 + 躲藏狀態緩過來):

`Actor 1 坐於救援直升機後座 ... 眼神中充滿死裡逃生的僥倖、未散的驚魂、極度的疲憊，以及一絲茫然的沉默 ... 肩膀略微縮緊` ← 「未散的驚魂」「茫然沉默」是來自 Shot 1-5 chase 事件的 emotional residue.

Rule: when shot N is preceded by intense events in earlier shots, write the **residue** of those events as physical / facial tells, not just the present emotion. 高真實感 ≠ 強表情，而是「情緒延遲」.

### Sub-layer 4 — Multi-actor 錯時反應 (asynchronous timing)

Real people don't synchronize. AI defaults to synchronized actions (all running at the same pace, all turning at the same instant, all reacting at the same beat). Break the sync deliberately.

❌ Synchronized (low realism — feels staged):

`Actor 1, Actor 2, Actor 3 同步轉頭看向警車，三人同時面露驚訝。`

✅ Asynchronous (validated 電影導演版 pattern):

- **主角色 (event initiator)**: `Actor 1 先聽到警笛聲，立刻轉頭看向街角，表情警覺`
- **第二角色 (0.3-1 秒延遲反應)**: `Actor 2 在 Actor 1 轉頭後約 0.5 秒才反應過來，視線從手機抬起，先尋找聲音來源再轉向 Actor 1 的視線方向`
- **第三角色 (與事件無直接關聯)**: `Actor 3 仍低頭整理包包，無意識地哼著歌，完全沒注意到警笛聲，直到 Actor 1 拍了她肩膀才抬頭`

Rule: in any multi-actor shot, give each actor their own micro-timeline. 0.3-1 秒延遲 between reactions + at least one actor unrelated to the main event creates 「空間中的生命感」. 同步動作 = 海報感.

**Retroactive note**: this applies to **Shape A chase scenes too** — 4 個逃跑的人不應該完全同步 sprint，可以加 `Actor 4 步伐略短半拍 trailing slightly` / `Actor 3 比其他人更頻繁地回頭確認後方` 讓 chase 看起來有個體差異。

### Sub-layer 5 — 動作未完成 + 注意力分散 + 真實世界噪音

Three sub-techniques that prevent VE's "perfect finished state" default rendering.

**(a) 動作未完成 (in-between motion)** — AI 預設 finished state，反其道而行寫「過程中」.

✅ Examples:
- `正要開口的瞬間，嘴唇微張但聲音還沒發出`
- `剛轉頭一半，視線還沒對焦到目標物`
- `手伸到一半，動作懸停在空中`
- `剛眨眼的瞬間，睫毛仍未完全上揚`

**(b) 注意力分散 (distraction)** — 真人不會全神貫注於鏡頭主行為.

✅ Examples:
- `Actor 1 邊講話邊被遠處某個聲響吸引，視線短暫飄向那個方向後拉回`
- `回訊息中途被另一個通知打斷，手指停頓 1 秒才繼續打字`
- `正在切水果但腦中明顯在想別的事，動作機械化`

**(c) 真實世界噪音 (uncomfortable micro-details)** — 完美的肖像感正是 AI 感的來源.

✅ Examples:
- `衣領一側微微歪斜，沒有特別整理過`
- `額前一綹頭髮卡在耳後，但其餘頭髮仍自然散著`
- `手腕上有剛剛靠在桌邊壓出的淡淡紅印`
- `袖口有一點點未注意到的污漬`
- `右邊嘴角略乾，似乎剛喝過熱飲沒擦`

Rule: add 1-2 micro-noise details per character-focused shot. Too many becomes distracting; zero looks AI.

### Sub-layer 6 — Motion Cascade (動作級聯)

Real body motion never happens in one isolated action — every primary motion triggers a cascade of secondary motions through the body's kinetic chain.

❌ Single-action motion (動作像 paste-in 效果):

`Actor 1 抬起右手指向遠方。`

✅ Motion cascade (validated 物理真實感):

`Actor 1 抬起右手指向遠方 — 視線先轉向那個方向，肩膀帶動上半身輕微跟進，重心微微前傾轉移到右腳，襯衫下擺因身體前傾而向後拉了一下，髮尾延遲約半拍才隨頭部動作晃動。`

Cascade order template:

1. **意圖** (intent — 視線先動)
2. **主動作** (main action — 手 / 頭 / 身體部位移動)
3. **連動** (chain — 肩膀 / 軀幹 / 重心隨動)
4. **延遲反應** (lag — 衣物 / 髮絲 / 配件半拍後跟上)

Rule: for any shot featuring a clear physical action (reaching, turning, standing up, throwing, taking off jacket), write 3-4 of the cascade levels. The **lag elements** (衣物 / 髮絲 / 配件) are especially powerful — they're what makes the body feel physically present in real gravity rather than digitally pasted.

### Core thesis — 假 AI vs 真實人物 對照表

| 假 AI | 真實人物 |
|-------|----------|
| 「她正在給你看她長什麼樣」 | 「她正在經歷某件事情，而你剛好看到」|
| 對鏡頭存在、擺拍、靜止 | distracted, unaware of camera, caught in-between motion |
| 完美對稱、完美姿勢 | natural imbalance, imperfect posture |
| 完成狀態 (finished state) | mid-process, in-between, mid-motion |
| 獨立圖層、與背景脫節 | 被環境影響、被光影包覆、衣物隨風 |
| 強表情、強情緒 | 情緒殘留、情緒延遲、情緒層次 |
| 同步動作（multi-actor）| 錯時反應、個體節奏 |
| 單一動作（chain-free）| Motion cascade、kinetic chain、延遲反應 |
| 完美光潔的角色 | 真實世界噪音（衣領歪、頭髮卡耳後、壓痕）|

For Shape A narrative drama, internalize this distinction. The left column = AI 感的本質. The right column = 電影感.

## Closing devices (special beats)

Beyond Declaration 3's standard closing beat (`camera halts, actors continue`), specific narrative beats need their own closing devices.

### Hard cut to black (jump scare / cliffhanger ending)

For final-shot cliffhanger reveals, the closing beat MUST explicitly end with `畫面硬切黑幕` (hard cut to black). VE without this directive will trail off with a soft fade or hold on the last frame, losing the impact.

✅ Validated example (2026-05-25 Shot 7 final beat — helicopter departs, T-rex bursts out as jump scare):

`[9-10s] 就在直升機飛離的最後一刻，下方漆黑的叢林邊緣突然猛烈搖動——一隻大恐龍從黑暗的雨林中爆發性地衝出，龐大的身影撞破樹冠，仰頭對著正在遠去的直升機以及鏡頭張開血盆大口，發出震撼山谷的巨吼，黑暗中那雙掠食性的眼睛與洞開的巨口佔據畫面中央，旋翼聲與咆哮聲在夜空中激烈交疊——畫面硬切黑幕。`

Rule: `——畫面硬切黑幕` (or English `— hard cut to black`) as the final phrase signals "end the shot abruptly here." Without this, VE may extend into a soft fade that bleeds away the cliffhanger.

### Camera as in-frame narrative element (fourth-wall engagement)

VE accepts the camera being included as a story element — an on-screen subject can be directed to acknowledge or be addressed by the camera. This works for jump scares, twist reveals, or breaking-fourth-wall moments.

✅ Validated (Shot 7 above): `仰頭對著正在遠去的直升機以及鏡頭張開血盆大口` ← the creature roars at both the departing helicopter AND the camera (= audience), creating direct fourth-wall jump scare.

Rule: for jump scares / twist reveals / dramatic fourth-wall moments, naming `鏡頭` (or `the camera` / `the audience`) as part of the subject's action target works and intensifies impact. Use sparingly — only at major narrative beats. Overuse breaks the cinematic frame.

## Validated chase-sequence example (2026-05-25 v6 dogfood)

Six-shot dinosaur jungle chase reaching acceptable quality through v6.3-v6.7 iterations. The Plot Twist version (Shot 2 emerged with a second T-rex that wasn't intended — accepted as story-driven outcome) became the canonical flow:

| Shot | Setup | Quality | Key lesson |
|------|-------|---------|------------|
| 1 — 4 explorers fleeing T-rex (reverse dolly, 8s) | Front-view reverse dolly, 4 Asian actors face camera, T-rex behind in frame | given pass | Chase = reverse dolly, NOT forward tracking from behind |
| 2 — Group + new T-rex emerges (high-angle, 8s) | High-angle group tracking, no creature in T2I → second T-rex emerged at runtime from audio cue | Plot twist accepted | Audio scaffold pollution (Pitfall 5) — but story-positive outcome |
| 3 — Actor 1 scans → lateral sprint → trips (8s) | Side angle tracking, scan-decide-sprint-fall sequence | acceptable after outcome-only fix | Object interaction over-specification (Pitfall 4) — drop the named stone, write outcome-only |
| 4 — Momentum-rolled to behind boulder (8s) | Low-angle ground tracking, pure physics outcome | acceptable | Outcome-only + reference frame for character continuity |
| 5 — Hiding behind boulder watching chase recede | (not tested) | TBD | Multi-layer depth (foreground actor + background chase through gap) — see T2I composition rule #2 |
| 6 — Distant chase recedes into jungle | (not tested) | TBD | Wide static, actors as small recurring elements |

## Known limitations (accepted trade-offs)

These VE behaviors emerged across 2026-05-24 v1-v4 dogfood. The Gem should NOT try to fix them via prompt tricks — accept them or warn the user; they're model-level constraints, not prompt-level.

1. **Background detail under-renders in distance shots** — paving patterns, crowd faces, distant signage all soften. Mitigation: in T2I, write background materials as concrete tokens (`hexagonal granite paving stones, 30cm wide, alternating light and dark gray rings`) so the model at least knows the target — but final render will still be softer than the prompt suggests. If detail is critical, propose a closer-framing inserted shot instead.
2. **Action pacing skews slow/elegant** — VE interprets adverbs (`slowly` / `smoothly` / `gently`) literally and compounds them, so actions render at 0.6-0.8x natural speed. Mitigation: drop adverbs entirely when default pace is wanted; use `swiftly` / `at brisk pace` / `quickly` when faster motion is needed. Avoid stacking `slowly`+`smoothly`+`gently` in the same beat.
3. **Crowd/extras lack visual diversity** — background pedestrians render with repetitive faces; vehicles repeat make/model/color. Mitigation: explicit diversity tokens (`pedestrians of varied ages, genders, and clothing styles` / `a mix of office workers, students, and elderly people` / `different car models and colors`) help marginally but do not eliminate the bias. If diversity is critical, propose a tighter framing that excludes the crowd.

## Open calibration backlog (待下一輪 dogfood 驗證 — 假設未驗證，先不寫進 generation rules)

2026-05-27 dogfood shots that worked only partially. The hypotheses below are NOT yet validated — do not apply them as hard generation rules until a dogfood round confirms. Listed so the next session knows where to push.

1. **Vertical fall front segment reads as "flying flat" (#3 前段)** — top-down with no early scale reference renders as horizontal flight; the fall only reads once passing reference objects appear. Hypothesis: seed a scale-expansion reference (ground elements rapidly enlarging) + severe downward motion blur from second 0, binding "falling" to on-frame scale change. See § Validated examples › God's-eye vertical fall.
2. **Sustained horizontal running won't speed up (#4 前段, #12)** — VE auto-slows sustained running (an instance of Known limitation #2). #4 後段 (the fall) rendered fast because falling is VE-native. Hypothesis: apply the full Declaration 1 kit to the running beats too (`Fast dynamic` + velocity vocab ×3 + drop `slowly`/`gradually`) AND shorten the running beat so VE has no room for slow-mo.
3. **Push-obstacle-away only ~75/100 (#2)** — beats overlapped (`[0.5-1.5]` vs `[1.4-3]`) and two power moves (catch → shove) were crammed into one beat. Hypothesis: non-overlapping beats + give the shove its own beat with adequate time.
4. **Direction wrong in lateral sprint (#12)** — tracking worked but direction did not. Likely a reference-image / left-right phrasing issue; needs the actual reference frame to diagnose.

## Recommended defaults

- Aspect ratio: 16:9 unless user mentions 直式 / 9:16 / TikTok-style
- Shot count: 5-8 shots, total ≈ 30-60s. Each shot 5-9s by content (10s hard cap).
- MediaType: `live` for narrative / interview / vlog / education / product-demo (humans-in-frame); `3d` for 3D-styled animation; `illustration` for editorial-cinemagraph
- visualLock variant per shot: classify the shot's main subject (see `modes.md §4.3`) — pure product shots should use the product-subject variant, but **prefer Mixed (actor + product) over pure product whenever possible** per the Strengths section above
- Output mode: `minimal` (per above)
- Framing: pick per shot from `close-up maximum` / `medium close-up` / `chest-up maximum` / `waist-up maximum`. Variation OK within this family; never go outside it.
