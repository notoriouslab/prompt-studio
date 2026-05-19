# Refactor — DOMAINS Source-of-Truth Centralization

Status: design (2026-05-19)
Owner: 趙雲 / 梅大
Trigger: Phase 1（bible-* → narrative-*）暴露 domain magic string 散落 6+ 處，runtime 直接 crash。主公裁示 B 方案：bless Phase 1 → 停下做小重構。

## 痛點證據（從本日踩雷收集）

| 雷 | 位置 | 性質 |
|---|---|---|
| Crash on startup | `snapshot-test.js` DEFAULTS_FOR_STUB hardcoded `domain: "bible-character"` | Stub default 跟 maps.domain key 沒對齊 → undefined.subjectRule |
| seedDefaultTemplate hardcode | HTML line 4696 `t.domain === "bible-character"` | dialogueMode 推斷邏輯耦合特定 domain key |
| createTemplate prompt() hint | HTML line 4040 `"bible-character/bible-scene/real-interview/real-report"` | enum 列表 hardcode，新增 domain 要記得更新 |
| i18n 雙份 | zh-TW + en 兩個 inline object，opt.domain.* 各維護一份 | 加 domain 要兩處 |
| HTML form options | static markup with hardcoded values | 加 domain 要碰 HTML |
| DEFAULT_TEMPLATES domain ref | template entries 各自 hardcode domain string | 改名要 grep 找全 |

每次加減 domain → **7-8 處同步點**。

## 目標結構

```js
// ── Source of truth ──────────────────────────────────────────────────
const DOMAINS = {
    "narrative-character": {
        label_zh: "敘事｜人物",
        label_en: "Narrative | Character",
        defaultDialogueMode: "dialogue",      // 給 seedDefaultTemplate 用
        assumptions: "...",
        subjectRule: "...",
        shotBias: "...",
        dialogueBias: "...",
    },
    "narrative-scene": { ... },
    "real-interview": { ... },
    "real-report": { ... },
};

// ── Derived (build-time / init-time) ────────────────────────────────
// 1. maps.domain (runtime rule lookup) ← 從 DOMAINS 衍生
// 2. i18n.zh-TW["opt.domain.*"] + i18n.en["opt.domain.*"] ← 從 DOMAINS 衍生
// 3. HTML form <select id="domain"> options ← JS render from DOMAINS
// 4. createTemplate prompt() hint ← Object.keys(DOMAINS).join("/")
// 5. seedDefaultTemplate dialogueMode ← DOMAINS[t.domain]?.defaultDialogueMode
```

加減 domain：**1 處同步** (DOMAINS 物件)。

## Out of scope（這次不動）

- **PLATFORMS 重構**：platforms 已比較集中在 `db.platforms` array，且 customPromptBlock 已是 self-contained 字串。先看 Phase 3-4 是否真的痛再決定
- **MODES 重構**：已集中在 MODES / MODE_BUILDERS / TIER1/2/3 keys
- **i18n 整體 co-locate**：每個 entry 跟 label 寫在一起。這是大重構，這次只動 domain 相關 entries
- **單檔架構不變**：DOMAINS 物件就放在原本 maps.domain 上方，仍 inline 在 HTML 內

## 改動清單

| T# | 動作 | 位置 |
|---|---|---|
| R1 | 新增 `const DOMAINS = {...}` 集中物件 | maps 物件之前（≈ line 2645） |
| R2 | maps.domain 從 DOMAINS 衍生 | maps 物件內 |
| R3 | i18n 兩處 inline 移除 `opt.domain.*` hardcode，改在 i18n 物件建立後 merge from DOMAINS | i18n const + zh-TW / en 兩處 |
| R4 | HTML form `<select id="domain">` 移除 hardcoded options，改 JS render | HTML line 1015 + JS init |
| R5 | createTemplate prompt() hint 動態化 | line 4040 |
| R6 | seedDefaultTemplate dialogueMode 推斷改用 DOMAINS field | line 4696 |

## Snapshot 保護策略

- **預期 14/14 PASS 0 變動**（output 邏輯完全一致，只改 source 組織）
- 跑 `node snapshot-test.js` 驗證，任何變動 = bug

## Manual 驗證點（主公在 browser 確認）

1. Advanced 區「題材領域」dropdown 仍顯示 4 個選項（敘事｜人物 / 敘事｜場景 / 真實｜訪談 / 真實｜報導）
2. 切換語言 (zh / en) dropdown label 仍能切
3. 切換 domain，下方即時 Prompt 區的 Tier 2 區塊內容隨之變動
4. 新建 Template 時 prompt() 跳窗仍可輸入 domain

## Self-Review

1. **完整性**：6 處硬依賴全納入 R1-R6 ✓
2. **No Placeholders**：每個 task 都對應 file/line ✓
3. **2-3 Approaches**：已對比 A（撐完再做）/ B（現在重構）/ C（砍功能再做），主公選 B ✓
4. **Rationalization Prevention**：snapshot 0 變動是 hard gate，不通過就 bug ✓
5. **YAGNI**：只動 DOMAINS，PLATFORMS / MODES / i18n co-locate 都留下次 ✓
