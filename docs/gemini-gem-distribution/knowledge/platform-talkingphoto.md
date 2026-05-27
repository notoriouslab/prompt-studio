# Platform: TalkingPhoto

## Platform Context (inject into generated prompt)

```
## Platform Context
- Platform: Talkingphotos (avatar family, primary mode: avatar)
- Output Goal: lipsync
- Prompt Bias: lipsync, single character, script clarity, two-mode (singing / speaking)
- Aspect Ratio: 16:9 / 9:16 / 1:1
- Duration Range: 10-180s
- Export Rules: no watermark
- Notes: VideoExpress 同公司產品。流程：先用 prompt 畫主角 → 切歌唱模式（用戶自己丟音樂）或講話模式（輸入文字 → 對嘴聲音，支援多國語言）。
```

## Mode Pin

TalkingPhoto **always uses avatar mode**. Do not offer storyboard or single-shot for this platform.

## Platform-Specific Rules (inject verbatim into generated prompt)

```
## Talkingphotos-Specific Rules

Talkingphotos has TWO modes; both start with the same first step: **generate a still image of the main subject**. Your prompt should produce the subject image prompt PLUS the relevant Mode A or Mode B block based on context.

### Step 1 (always): Main Subject Image Prompt
- Single character only, no multi-character scenes.
- Framing: chest-up or 3/4 view; mouth and breathing area clearly visible.
- Background: plain or static — no scene motion, no scene cuts.
- The image must be ready as a Talkingphotos source frame.

### Mode A — Singing
- After the user generates the subject image, they supply a music track separately (outside this tool's scope).
- Keep facial expression neutral-open in the source image (mouth not exaggerated).
- Do NOT write a script for Mode A; the music is the audio source.

### Mode B — Speaking (lipsync)
- After the subject image, output a **Speaking Script** block: the spoken text Talkingphotos will read aloud with lipsync.
- Specify the language code (e.g. zh-TW, en-US, ja-JP, ko-KR) for voice selection.
- Keep dialogue natural, conversational, paced for spoken delivery; avoid abbreviations and complex punctuation that confuse TTS.
- Length target: fit the chosen duration; ~150 chars per 30s of speech in Chinese, ~80 words per 30s in English.
```

## Clarify priority (when user picks TalkingPhoto)

After confirming TalkingPhoto + avatar mode, the Gem should clarify:

1. **Singing or Speaking?** (Mode A vs Mode B)
2. If Speaking: **Language code** (zh-TW / en-US / ja-JP / ko-KR / ...) — use the language of the user's IDEA if obvious.
3. **Domain** — default `narrative-character` if user defers.
4. **MediaType** — default `live` if user defers.

## Output deviation from `modes.md §3`

When platform = TalkingPhoto, the generated prompt's Character Sheet + Voice & Performance + Script + Background structure (from `modes.md §3.2`) is supplemented at the top with the TalkingPhoto Mode A/B block from above. The downstream LLM uses both: Character Sheet to seed the source-image generation, Mode A/B block to choose between music-driven or text-driven lipsync.
