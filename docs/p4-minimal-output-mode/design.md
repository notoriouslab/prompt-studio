# P4 — Minimal Output Mode (Storyboard)

Status: design (2026-05-19)
Owner: 趙雲（子龍）/ 梅大
Spectra phase: propose（CLI 未裝，手動 markdown 落底）

## Common Ground（全 ESTABLISHED）

| Group | 結論 |
|---|---|
| A. 範圍 | 只 storyboard mode |
| B. 砍 sections | 砍：Project Snapshot / Creative Assumptions / Emotional Arc / Dialogue Script / Continuity Lock / Optional Negative Prompt。保留：Character Bible → 改名 `# Actor Portrait Image Descriptions`（bullets 風格、保留 Actor Alias + Continuity Anchor）/ Storyboard And Generation Prompts → 表格改 `## Shot N` H2 + bullets |
| C. UI / state | state key `outputMode`，值 `full`(default)\|`minimal`。Advanced 區 dropdown，緊跟 `lengthMode`/`shotStyle`。i18n `adv.outputMode` / `opt.outputMode.full` / `opt.outputMode.minimal` |
| D. 互動 | `outputMode` 跟 `lengthMode` / `dialogueMode` / `subtitleMode` / `shotStyle` 全部正交。minimal + dialogue → wrap pattern 仍生效，Dialogue Script section 不獨立輸出（dialogue 嵌進 I2V） |
| E. snapshot | 保留 12 case baseline 不動；加 2 新 case：`storyboard_videoexpress_minimal_dialogue` + `storyboard_noplatform_minimal_nodialogue` |
| F. 架構 | `buildStoryboard` + `storyboardSectionSchemas` 內 branch on `outputMode`。不分離 build function。TIER1 / TIER2 / TIER3 不變 |

## Output Format（minimal mode 規格）

```
# {media.title} — Storyboard Production
{intro paragraph}

## Platform Context (when platformId set)
## VideoExpress-Specific Rules (when applicable)

## Tier 1 — Hard Constraints
## Tier 2 — Domain & Language
## Tier 3 — Style (when styleExtra)

## Output Format
Answer in Markdown. Emit ONLY these two sections, in order:
1. `# Actor Portrait Image Descriptions`
2. `# Scenes, Storyboard And Generation Prompts` ({shotCount} shots)

### `# Actor Portrait Image Descriptions`
Per actor, one paragraph:
`Actor N: {one-line visual portrait description following the same T2I prompt pattern}.`
Include Actor Alias prefix. NO Name field, NO Personality / Want / Voice / Lipsync columns.

### `# Scenes, Storyboard And Generation Prompts` ({shotCount} shots)
Per shot, use `## Shot N` H2 + bullets:
- `**Time:** 00:00-00:06`
- `**Duration:** 6s`
- `**Text-To-Image Prompt:** {full T2I prompt using [Actor Alias], [continuity anchor] reference}`
- `**Image-To-Video Prompt:** {full I2V prompt with [time-segment] brackets, dialogue wrap pattern embedded inside}`

## Silent Quality Checks (minimal-mode adapted)
- ✓ Two sections present, exact spelling
- ✓ Tier 1 framing / timestamp / duration / subtitle rules satisfied
- ✓ T2I / I2V prompts reference Actor Alias + continuity anchor
- ✓ No conversational intro or meta-commentary
```

## 改動清單（atomic tasks）

| T# | 改動 | 位置 |
|---|---|---|
| T1 | HTML form 加 outputMode select（full/minimal） | `<select id="dialogueMode">` 附近 |
| T2 | i18n 加 outputMode 中英 label | line 1748 / 1996 範圍 |
| T3 | state 收集加 outputMode | line 2844 範圍 `state = { ... }` |
| T4 | `buildStoryboard` sectionList branch on outputMode | line 3176-3178 |
| T5 | `storyboardSectionSchemas` 加 minimal branch | line 3196-3234 |
| T6 | `SILENT_CHECKS.storyboard` 加 outputMode 參數 + minimal branch | line 3119-3128 + caller line 3191 |
| T7 | snapshot-test.js 加 2 cases | `CASES` array |
| T8 | 跑 snapshot：12 PASS + 2 NEW → bless baseline | terminal |

## G1 Self-Review (5 項)

1. **完整性**：所有 ESTABLISHED group 都對應到 T1-T8 ✓
2. **No Placeholders**：每個 task 都有明確 file/line + 改動內容 ✓
3. **2-3 Approaches**：F group 已列 3 方案（branch / 分離 function / plugin system），選 branch ✓
4. **Rationalization Prevention**：F 選 branch 是因為跟 dialogue/length branching 同模式（DRY），不是「應該可以了」✓
5. **Coverage Mapping (G2)**：T1↔C / T2↔C / T3↔C / T4↔B / T5↔B / T6↔B+E / T7↔E / T8↔E ✓

## 風險與緩解

| 風險 | 緩解 |
|---|---|
| state 改動打到 saveTemplate / loadTemplate | 確認 builder state 收集邏輯是 generic（讀 els 物件），新欄位自動納入 |
| 既有 12 case baseline 被意外打到（outputMode 預設應為 full） | 在 buildStoryboard 內加 `state.outputMode \|\| "full"` 預設，BASE_STATE 不加 key |
| minimal mode 跟 dialogue=true 衝突（Dialogue Script section 砍但 wrap pattern 仍要生效） | T5 內顯式處理：minimal 砍 Dialogue Script 但 I2V wrap pattern 來自 TIER1，不受影響 |
| Sub-Agent Review（G1）未跑 | 本次主公在 loop 內每步 confirm，等同 review；scope 也在 prompt spec 改動範圍內。如主公要求嚴格 G1 可補跑 |

## Out-of-scope（不在這次做）

- P3 表格 vs H2 bullets 全面切換（主公已決定看 P4 使用數據再判定）
- single-shot / avatar / short-form 的 minimal mode（A group 已 ESTABLISHED 只 storyboard）
- output_mode 跨 mode shared state（暫只 storyboard 讀，其他 mode 忽略此 key）
