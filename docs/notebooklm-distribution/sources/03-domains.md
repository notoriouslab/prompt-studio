# Domains

9 domain options. Each has: `assumptions`, `subjectRule`, `shotBias`, `dialogueBias`. You inject the matching section into Tier 2 of the generated prompt.

`defaultDialogueMode` indicates whether dialogue is the natural state for the domain — but the user's idea always overrides (explicit dialogue in idea = `dialogue: true` regardless of domain default).

---

## narrative-character — 敘事｜人物

- **Default dialogue mode**: dialogue
- **Assumptions**: character-driven narrative storytelling with emotional focus on a recurring central figure
- **Subject rule**: Prioritize emotional sincerity, character continuity, clothing consistency, and tonal consistency appropriate to the chosen genre (historical, contemporary, mythic, dramatic, etc.). Treat the central figure as the dramatic anchor; render with cinematic gravitas.
- **Shot bias**: Favor close-up, medium close-up, chest-up, or waist-up framing to preserve facial clarity and emotional storytelling.
- **Dialogue bias**: Dialogue, if used, should be short, emotionally direct, naturally paced, and suitable for performance.

---

## narrative-scene — 敘事｜場景

- **Default dialogue mode**: none
- **Assumptions**: scene-driven narrative storytelling focused on atmosphere, scale, spectacle, and environmental drama
- **Subject rule**: Focus on visual wonder, environment motion, and clean staging rather than heavy dialogue. Lean on atmospheric detail, spatial composition, and cinematic lighting to carry the story.
- **Shot bias**: Use medium shots and medium close shots by default. Wider shots allowed for spectacle but central subject must remain legible.
- **Dialogue bias**: Prefer no dialogue or extremely minimal spoken lines.

---

## real-interview — 真實｜訪談

- **Default dialogue mode**: dialogue
- **Assumptions**: real-world speaking scenario centered on a speaker, host, guest, or interview subject
- **Subject rule**: Prioritize realism, credible body language, stable camera framing, natural performance. Keep environments professional.
- **Shot bias**: Speaking shots: face large in frame, front-facing or 3/4 view, mouth visibility preserved.
- **Dialogue bias**: Dialogue: natural, spoken, concise, easy to lipsync.
- **Framing lock (talking-head specific)**: When `domain = real-interview`, **lock a single framing string across all shots in the storyboard**: default `cinematic medium shot framed from head to waist or belt line`. Do NOT vary framing per shot (this is the opposite of narrative-character / 3D drama domains where in-family variation is encouraged). Reason: VideoExpress's native interview-mode generator emits a consistent talking-head framing throughout, and talking-head viewers expect stable composition. Also consider including a `two-shot` configuration shot once or twice when both interview participants share the frame.
- **T2I boilerplate (talking-head specific)**: add `body language readable` after `clear expressive face, mouth visible`. Add `hands visible when natural` or `hands visible holding [object]` when relevant.

---

## real-report — 真實｜報導

- **Default dialogue mode**: none
- **Assumptions**: real-world event coverage, documentary-style reenactment, or news-like reconstruction
- **Subject rule**: Prioritize documentary clarity, environmental credibility, scene readability.
- **Shot bias**: Stable medium or medium-close framing for key actions. Wide framing sparingly.
- **Dialogue bias**: Prefer no dialogue or only rare, short spoken lines. Voiceover added in post.

---

## product-demo — 商業｜產品演示

- **Default dialogue mode**: none
- **Assumptions**: e-commerce product demonstration, feature showcase, unboxing, or 360-degree presentation
- **Subject rule**: Treat the product as the visual hero. Maintain identity, color, material, and proportion across all shots — no shape distortion, no missing labels. Use studio-grade or controlled-environment lighting; backgrounds plain or contextual but never visually competing.
- **Shot bias**: Medium close-up to medium framing for hero shots; selective close-up for material/detail; controlled camera moves (orbit, slow dolly, top-down) over handheld motion.
- **Dialogue bias**: Prefer no dialogue inside the shot. Voiceover narration or text overlays are produced separately in post — the generated frames should support, not include, spoken content.
- **Platform override — VideoExpress**: pure-product shots (no human in frame) render unreliably on VideoExpress. When `platform = VideoExpress` AND `domain = product-demo`, prefer **Mixed framing** — keep a barista's / operator's / model's hands or torso in every shot interacting with the product. See `04-platform-videoexpress.md` Strengths section.

---

## educational — 教育｜知識內容

- **Default dialogue mode**: dialogue
- **Assumptions**: knowledge explanation, tutorial walk-through, concept visualization, or presenter-led lesson
- **Subject rule**: Foreground a credible presenter or clear visual subject. Compose with intentional headroom or side space for chart, diagram, or text overlay placement. Lighting should be clean, even, and uncluttered.
- **Shot bias**: Medium framing for presenter; chest-up or 3/4 view when lipsync matters; allow graphic-overlay-friendly composition (rule of thirds, clear negative space).
- **Dialogue bias**: Structured narration with clear pacing; conversational but pedagogical tone. Short sentences aid retention and lipsync alike.

---

## motion-explainer — 動態圖形｜解說

⚠️ **Not yet dogfooded on VideoExpress.** VideoExpress's known weak spot is pure-object shots with no human in frame, which is exactly what this domain produces. Tell the user this once before generating, and suggest a short test clip before committing to a full sequence.

- **Default dialogue mode**: none
- **Assumptions**: motion-graphics explainer built from animated shapes, icons, diagrams, and kinetic typography, where every movement exists to explain one idea
- **Subject rule**: One idea per scene. Build meaning from flat/vector shapes, icons, charts, and visual metaphors instead of live actors. Movement must explain, never decorate: elements enter, transform, and connect in the exact order the idea unfolds. Keep one consistent palette (2-4 colors) and one type system across all scenes — **palette and type ARE the continuity anchor** (there is no character bible).
- **Shot bias**: Composition-driven framing: centered or grid-aligned layouts, generous negative space, clear visual hierarchy. Transitions carry meaning (morph, wipe, build-on); the canvas moves, not the camera — no dramatic camera moves.
- **Dialogue bias**: Prefer narration-free visual sequences or short voiceover-style lines. Kinetic typography counts as intentional design text: allowed only when subtitle suppression is soft; under strict subtitle suppression, explain with pure shapes and icons.
- **Tension with the no-text default**: kinetic typography is native to this domain but collides with the standing subtitle-suppression rule (`01-core.md §10`). Default to explaining with shapes, icons and arrows only, and say so once when this domain is chosen; use text in frame only if the user explicitly asks for it.
- **Continuity note**: because there is no Actor Alias to anchor identity, restate the palette (as explicit color words or hex-like descriptions) and the type treatment in EVERY scene's T2I prompt. That repetition does the job the Character Bible does elsewhere.

---

## lifestyle-vlog — 生活｜記錄

- **Default dialogue mode**: none
- **Assumptions**: personal vlog covering travel, food, pet, fitness, or daily life with authentic, documentary feel
- **Subject rule**: Embrace documentary-style realism. Slight handheld feel is acceptable; natural light preferred over heavy studio setups. Subject framing favors authenticity over polished perfection.
- **Shot bias**: Medium handheld-feel framing; mobile-friendly compositions (works in both 16:9 and 9:16). Capture environmental texture and ambient detail alongside subject.
- **Dialogue bias**: Prefer ambient voiceover or no dialogue. If spoken, keep it casual, short, and personal — like talking to a friend off-camera.

---

## editorial-cinemagraph — 編輯｜動態海報

- **Default dialogue mode**: none
- **Default mediaType**: `illustration`
- **Assumptions**: editorial cinemagraph / living poster — a static poster-style composition animated with subtle ambient motion (figures walking, vehicles drifting, gentle camera parallax) while preserving the still-image aesthetic
- **Subject rule**: Treat the frame as a static illustration first, then layer minimal motion. T2I prompts emphasize illustration / line art / editorial poster aesthetics (Swiss Modernist, monochrome silkscreen, minimalist vector, clean negative space, intentional typography placement). I2V prompts add ONLY subtle ambient animation — background figures walking, vehicles drifting through frame, gentle camera pan or parallax depth — and NEVER break the poster feel with dramatic camera moves, close-up action, or busy foreground motion.
- **Shot bias**: Wide or medium poster composition with intentional foreground / midground / background depth (supports parallax). Hold the full frame as a unified poster; avoid close-up cropping that breaks the editorial layout.
- **Dialogue bias**: No dialogue. Cinemagraphs rely on ambient atmosphere; voiceover added in post if needed.

---

## Tier 2 composition (referenced by 00-operating-manual.md)

When emitting Tier 2 in the generated prompt, you combine:

- `subjectRule` (always)
- `shotBias` (storyboard + single-shot; omit for avatar)
- `dialogueBias` (always for storyboard + avatar; omit for single-shot)
- Language rule (use the language from the user's idea; default 繁體中文 for dialogue if user is in Chinese context)
