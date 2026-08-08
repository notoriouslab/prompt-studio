<div align="center">

# PromptStudio

[![License](https://img.shields.io/github/license/notoriouslab/prompt-studio?style=flat-square)](LICENSE)
[![Single-file HTML](https://img.shields.io/badge/Single--file-HTML-orange?style=flat-square)]()
[![No build](https://img.shields.io/badge/No-Build-7C3AED?style=flat-square)]()
[![Local-first](https://img.shields.io/badge/Local--first-localStorage-blue?style=flat-square)]()
[![Last Commit](https://img.shields.io/github/last-commit/notoriouslab/prompt-studio?style=flat-square)](https://github.com/notoriouslab/prompt-studio)

**把一個 idea 變成可直接貼進 VideoExpress.ai 的 production-ready prompt。**

專為 **VideoExpress.ai** 打造並實測校準 · 單檔 HTML · 本地優先 · 無安裝 · 無帳號

<sub>另附 8 個平台（Sora 2 / Veo 3.1 / Runway / Kling / Seedance / Talkingphotos / HeyGen / TikTok）的未實測參考 registry，預設收起。</sub>

[English](./README.md)

![PromptStudio](./docs/intro.jpg)

</div>

---

## 為什麼要 PromptStudio？

寫 AI 影片 prompt 常踩這些坑：角色跨 shot identity 容易漂掉；中文 dialogue 容易被誤判成畫面字幕亂跑；官方的一鍵式 workflow 又沒有留下導演空間。

PromptStudio 把實際跑片校準過的 VideoExpress best practice 內化成 **Mode × Platform × Domain × MediaType** 的正交組合。選定組合、填 idea，產出對應的 system prompt，餵給你慣用的 LLM（Claude / GPT / Gemini）展開成完整的 storyboard 或 single-shot 腳本，直接 paste 進 VideoExpress。

> **誠實聲明**：本工具的每條 pattern 都在 VideoExpress.ai 上用真實生成 credits dogfood 過。registry 裡另外 8 個平台只做過 2026 官方文件對齊、從未實際跑片，預設收起並標示「未實測」。

### 三個差異化

| 特性 | 怎麼運作 |
|---|---|
| **實測校準 syntax** | VideoExpress 的 `customPromptBlock` 來自真實生成紀錄（timing 語法、lipsync 台詞路由、每 shot 重述 actor 描述），不只是文件抄寫。另有 8 平台未實測參考 registry，藏在 toggle 後面。 |
| **跨 shot 角色身份穩定** | 內建 **Actor Alias 雙軌制**（`Actor 1, the 50-year-old host in a dark blue suit`），把角色 anchor 在視覺特徵而非名字，大幅降低跨 shot 漂移。Dialogue 統一包成 speech act（`says in a confident, clear Mandarin accent: "..."`），中文台詞 route 到 TTS 而非變成畫面字幕。 |
| **兩層自動回歸測試** | L1 snapshot test（14 cases）保 spec 文字 byte-stability。L2 LLM eval（5 cases、regex assertions、免費 Gemini tier）驗證規則真的被 LLM follow。可重現的 baseline 在 [`samples/eval/`](./samples/eval/)。 |

---

## Quick Start

1. Clone 或直接下載 [`prompt-studio.html`](https://raw.githubusercontent.com/notoriouslab/prompt-studio/main/prompt-studio.html)
2. 任何瀏覽器打開 — 不需安裝、不需 server、不需帳號
3. 選 **Mode** / **Platform** / **Domain** / **MediaType**，填入 idea
4. 複製產出的 prompt → 餵給 LLM → 把 LLM 輸出貼進對應 video gen 工具

```bash
git clone https://github.com/notoriouslab/prompt-studio.git
open prompt-studio/prompt-studio.html
```

---

## 支援的平台

### 已實測（預設顯示）

| 平台 | Family | 主要 Mode | 重點 |
|---|---|---|---|
| **VideoExpress.ai** | video | storyboard | 完整影片企劃（6-9 shots）、lipsync、consistent character，每條規則都經真實跑片驗證 |

### 未實測參考 registry（預設收起）

在平台選單旁勾選「顯示未實測平台」即可展開。這些平台的 `customPromptBlock` 只做過 2026 官方 prompt guide 對齊、從未在真實生成上驗證過，當起點用、不當承諾用。

| 平台 | Family | 主要 Mode |
|---|---|---|
| Sora 2 | cinematic | single-shot / storyboard |
| Veo 3.1 | cinematic | single-shot |
| Runway Gen-4.5 | cinematic | single-shot |
| Kling 3.0 | cinematic | single-shot |
| Seedance 2.0 | cinematic | single-shot |
| Talkingphotos | avatar | avatar |
| HeyGen | avatar | avatar |
| TikTok / Douyin | short-form | short-form |

## 支援的內容類型

**5 個 modes × 9 個 domains × 4 個 mediaTypes**：

| Domain | 適用場景 |
|---|---|
| `narrative-character` / `narrative-scene` | 戲劇、史詩、虛構故事 |
| `real-interview` / `real-report` | KOL 訪談、新聞紀錄 |
| `product-demo` | 電商產品演示、unboxing |
| `educational` | 教學、知識內容 |
| `motion-explainer` | 動態圖形解說（形狀、圖標、動態字體） |
| `lifestyle-vlog` | 旅遊、美食、寵物 |
| `editorial-cinemagraph` | 動態海報、living poster |

MediaType：**3D 動畫** / **真人影片** / **2D 動畫** / **插畫｜海報**

Mode：**Storyboard**（full / minimal / VE 執行工單）/ **Single-Shot** / **First-Last**（首尾幀轉場，對應 VE First Frame Last Frame Beta）/ **Avatar** / **Short-Form**

---

## 功能

### 即時 prompt 預覽
「即時 Prompt」區會隨任何欄位變更即時更新。

### Output mode（輸出格式）
Storyboard mode 有三種輸出風格：**Full**（8 個 sections，含 Character Bible / Emotional Arc / Continuity Lock 等，適合 production review）、**Minimal**（2 個 sections，paste-ready，對齊 VideoExpress 精簡格式）、**VE 執行工單**（凍結 character bible、逐幕三欄位 prompt 含 Actor Script 100 字元上限、真實跑片校準的設定 checklist）。工單可交給瀏覽器 agent（Claude in Chrome / Claude Code / ChatGPT agent mode）搭配[官方 VideoExpress agent workflow](https://github.com/strontiumplatform/VideoExpress.ai-Full-Length-Consistent-Character-Realistic-Talking-Avatar-Video-Workflow) 自動操作 app.videoexpress.ai（用你導演過的劇本取代它自動代寫的那段）；沒有 agent 的使用者把同一份工單當人工逐幕貼上的 checklist 用。

### Template + 版本管理
儲存 / 載入 builder presets，每個 template 可追蹤多版本。

### 鍵盤快捷鍵
| 鍵 | 動作 |
|---|---|
| `Cmd/Ctrl + Z` | Undo builder 變更 |
| `Cmd/Ctrl + Shift + Z` / `Ctrl + Y` | Redo |
| `Cmd/Ctrl + S` | Save Version（需先選 template） |

### 中英 UI 切換
🌐 EN / 中（Advanced 區底部）。

### 自訂規則
加入 per-session 規則，layer 在 Tier 3 style hints 之上。

### 本地優先
所有 state 存 `localStorage`。無雲端、無帳號、無 server。

---

## Validation（驗證）

兩層自動驗證 + 一層人工驗證：

| Layer | 驗證 | 工具 | 成本 |
|---|---|---|---|
| **L1** | Spec 文字 byte-stability | `snapshot-test.js`（14 cases） | 免費 / 即時 |
| **L2** | LLM follow 規則的程度 | `eval.js`（Gemini 2.0 Flash + regex assertions） | 免費（Gemini 免費 tier） |
| **L3** | 真實 video gen 輸出是否符合預期 | 人工 dogfood + reference | 視 video gen credits |

[`samples/eval/`](./samples/eval/) 內含 L2 的真實 Gemini baseline output — 是「spec 規則餵給真實 LLM 後真的有效」的具體證據。

```bash
node snapshot-test.js              # L1（不需 API key）
node eval.js                       # L2（需 GEMINI_API_KEY）
```

`GEMINI_API_KEY` 可從 [Google AI Studio](https://aistudio.google.com/apikey) 免費取得。`eval.js` 預設從 `~/.paiop_secrets.json` 讀取。

---

## Privacy（隱私）

| 項目 | 存哪裡 |
|---|---|
| Builder state、templates、versions | 瀏覽器 `localStorage` only |
| 產出的 prompt | 僅在記憶體中 |
| LLM expansion | 你選用的 LLM；PromptStudio 自己不呼叫任何 LLM |
| Validation eval | 選用功能，跑在你自己機器上，用你自己的 `GEMINI_API_KEY` |

無 analytics、無 telemetry、無雲端同步、無帳號。

---

## 設計原則

- **Mode × Platform 雙軸正交** — mode 決定 scaffolding 形狀，platform 注入 syntax
- **規則 once-only** — 每條規則只在最高權重 Tier 出現一次
- **Local-first** — 只用 `localStorage`，零雲端
- **Single-file** — 一個 HTML，不打包不分檔

---

## Contributing

修改 spec 規則前請保持兩層驗證綠燈：

```bash
node snapshot-test.js && node eval.js
```

新增 platform / domain / mediaType：編輯 `prompt-studio.html` 內對應的 const（`db.platforms` / `DOMAINS` / `MEDIATYPES`）。它們是 single source of truth — 動一處會自動 propagate 到 HTML form、i18n、規則 lookup 跟 prompt() hint。

---

## License

[MIT](./LICENSE) © 2026 notoriouslab
