# PromptStudio

Local-first prompt registry & generator for AI video tools (VideoExpress / Seedance / Runway / Kling / Talkingphotos / HeyGen / TikTok / Douyin etc).

Single-file HTML, no build, no server. Open in browser → use immediately.

---

## ⚠️ localStorage 遷移（從 ~/Downloads 搬過來的人讀這段）

`prompt-studio.html` 之前在 `~/Downloads/` 累積的 localStorage 資料**不會自動跟到新位置**。瀏覽器把每個 `file://` 路徑當不同 origin。

兩種選擇：

**A. 不在意舊資料**（reload 後重新建 templates / versions）
- 直接打開 `prompt-studio.html`，會是空白 + 7 個內建 default platforms
- 不用做任何事

**B. 想留舊資料**
1. 用瀏覽器 DevTools (F12) → Application → Local Storage → 找 `file://` origin
2. 找到 `prompt_studio_v6_db` 的 value，全選複製（一大段 JSON 字串）
3. 開新位置 `PromptStudio/prompt-studio.html`
4. 同樣 DevTools → Application → Local Storage → 新 file:// origin
5. 新增 key `prompt_studio_v6_db`，貼上剛複製的 value
6. Refresh 頁面 → 舊資料還原

> 如果之前已經習慣在 Downloads/ 用，可以保留那個 file 當「歷史」，新工作從 PromptStudio/ 開始。但要記得**未來只動其中一個位置**，不然兩邊 diverge。

---

## 目錄結構

```
PromptStudio/
├── prompt-studio.html   # 主檔，瀏覽器直接打開
├── snapshot-test.js                    # 回歸測試 runner（Node）
├── __snapshots__/
│   └── prompt-studio-v6.2.json        # 12 case byte-identical baseline
├── archive/
│   ├── prompt-studio-v3.html          # 最早的 VideoExpress 專用版
│   └── prompt-studio-v6.html          # pre-refactor 版本（沒 PromptBuilder）
├── samples/
│   └── production-prompt-3d-none-bible-scene.md   # 生成過的 prompt 範例
└── README.md
```

---

## 使用

### 基本用法

```bash
open prompt-studio.html
```

工作流程：
1. 選 **Mode**（Storyboard / Single-Shot / Avatar / Short-Form）
2. 選 **Family** 過濾平台
3. 選 **Platform**（會自動套用該平台的 customPromptBlock）
4. 調整其他 builder 欄位（Duration / Aspect / 進階 10 個）
5. 「即時 Prompt」區即時更新
6. 複製 → 貼進對應 AI 工具

### 快捷鍵

| 鍵 | 作用 |
|---|---|
| `Cmd/Ctrl + Z` | Undo builder 變更 |
| `Cmd/Ctrl + Shift + Z` / `Ctrl + Y` | Redo |
| `Cmd/Ctrl + S` | Save Version（需先選 template）|

### 中 / EN 切換

進階區（Advanced）最下方「顯示設定」內的 🌐 EN / CN 按鈕。

---

## 改 prompt 規則（最常改的地方）

打開 `prompt-studio.html`，搜以下 const 物件：

```js
const TIER1 = {
  storyboard: (state, { dialogue }) => [...],   // ← 改 storyboard 的 Tier 1 規則
  "single-shot": ...,
  avatar: ...,
  "short-form": ...,
};
const TIER2 = { ... };
const TIER3 = { ... };  // 目前只 storyboard 有
const SILENT_CHECKS = { ... };
const MODE_BUILDERS = {  // 加新 mode 在這
  storyboard: buildStoryboard,
  ...
};
```

加新平台：搜 `DEFAULT_PLATFORMS = [`，加一條 object 進去（含 `customPromptBlock` 跟 `primaryMode`）。

---

## Validation（兩層保護）

PromptStudio 有兩層自動驗證 + 一層人工驗證：

| Layer | 驗證什麼 | 工具 | 成本 |
|---|---|---|---|
| **L1** | Spec text deterministic / structural stability | `snapshot-test.js`（14 cases） | 免費 / 即時 |
| **L2** | LLM follow 規則的程度（餵 spec 給 LLM expand 後 regex assertions） | `eval.js`（5 cases / 4 assertions / Gemini 2.0 Flash） | 免費（Gemini 免費 tier） |
| **L3** | 最終 video gen 輸出是否符合預期 | 手動 dogfood + reference 對照 | 視 video gen credits 而定 |

### L1 — Snapshot Test（每次改規則必跑）

```bash
node snapshot-test.js              # diff 對比 14 個 case
node snapshot-test.js --list       # 列出 cases
node snapshot-test.js --update     # bless 變動（覆寫 baseline）
```

正常流程：
1. 改規則
2. `node snapshot-test.js` 看哪些 case 變了
3. 確認變動都是 intentional → `--update`
4. 看到不該變的 → 修回去再跑

### L2 — LLM Expansion Eval（spec 改大時跑）

```bash
node eval.js                       # 5 cases 全跑，含 regex assertions
node eval.js --case <name>         # 單 case
node eval.js --dump <name>         # dump 完整 Gemini output
node eval.js --save-samples        # 把每 case 完整 output 存到 samples/eval/
node eval.js --list                # 列 cases
```

需要 `~/.paiop_secrets.json` 含 `GEMINI_API_KEY`（[免費取得](https://aistudio.google.com/apikey)）。

跑完約 45 秒，免費。assertion 失敗時用 `--dump` 看完整 output 對照 `samples/eval/`。

基線樣本在 `samples/eval/`，是真實 Gemini output（含 input state + idea + assertions + 完整 expand），可當開源時的驗證證據與 reference。

---

## Version log

| 版本 | 日期 | 大變動 |
|---|---|---|
| v3 | 2026-05-17 | VideoExpress 專用 storyboard prompt generator（單一 mode 寫死） |
| v4 | 2026-05-17 | 加 Platform Registry / 7 internal platforms / family 分類；但 prompt 內容意外大幅縮減（回歸） |
| v5 | 2026-05-17 | 復活 v3 完整 prompt + customPromptBlock 注入；Platform 編輯改頁內表單 |
| v6 | 2026-05-17 | Mode × Platform 雙軸（storyboard / single-shot / avatar / short-form）；4 個 generator 各自實作；7 platforms 重分類 + 補 TalkingPhoto |
| v6.1 | 2026-05-17 | 字體 type scale 固定 / lang i18n 切換 / legacy 偵測保守化 — 已 merge 進 v6 同檔 |
| v6.2-refactor | 2026-05-18 | **PromptBuilder + TIER1/2/3 mode-keyed + MODE_BUILDERS lookup + §1-§7 region banners + esc() XSS hygiene + Ctrl+S + Undo/Redo history + Talkingphoto → Talkingphotos + Douyin merged into TikTok + Seedance Shot Brief 移除（只剩 T2I + I2V）** |
| **0.6.0** | **2026-05-19** | **Open-source release.** Dialogue speech-act wrap pattern + tone palette；Actor Alias 雙軌制（Name 給人 review、Alias 給機器 anchor identity）；storyboard `outputMode` (full / minimal) — minimal 對齊 VideoExpress paste-ready 風格；DOMAINS / MEDIATYPES const 集中化重構（加減從 7-8 處 → 1 處）；domain 通用化 bible-* → narrative-* + 加 product-demo / educational / lifestyle-vlog / editorial-cinemagraph（8 domains）；mediaType 加 2d-animation / illustration（4 mediaTypes）；新增 Sora 2 / Veo 3.1 平台 + Runway/Kling/Seedance customPromptBlock 對齊 2026 syntax（9 platforms）；shot count 對齊 demo（5-7 / 6-9 / 9-12）；L2 eval framework（Gemini 2.0 Flash + regex assertions，5 cases / 8 assertions PASS） |

---

## 設計原則

從 v6 spec 沿用：

1. **Mode × Platform 雙軸正交**：mode 決定 prompt scaffolding 形狀；platform 注 customPromptBlock + AR/duration 限制
2. **Don't abstract until N=3**：4 個 mode hardcoded，不做 plugin system
3. **規則 once-only**：每條規則只在最高權重 Tier 出現一次
4. **byte-identical regression**：用 snapshot-test 保護 prompt 輸出穩定
5. **local-first**：所有資料 localStorage，無雲端、無 server、無 build

---

## 已知限制

- localStorage 5-10MB 上限（目前用量 < 1%，不痛）
- 無 Undo/Redo 跨 builder reload（只在當前 session）
- 無 LLM-as-judge 自動評測（人工 1-5 分）
- 無 schema validator（JSON import 不做嚴格驗證，依賴 try/catch）
- file:// 不同檔案 = 不同 origin，localStorage 不共享（搬移時要手動遷移）

未來方向看 v6 spec §3 「未來不做的事」。

---

## License

MIT — see [LICENSE](LICENSE).
