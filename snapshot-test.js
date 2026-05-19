#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// prompt-studio-snapshot-test.js
// ─────────────────────────────────────────────────────────────────────
// Usage:
//   node prompt-studio-snapshot-test.js           # diff vs snapshot
//   node prompt-studio-snapshot-test.js --update  # overwrite snapshot
//   node prompt-studio-snapshot-test.js --list    # list cases
//
// What it does:
//   - Loads the inline <script> from prompt-studio.html
//   - Stubs out DOM/localStorage so generatePrompt() runs in Node
//   - Generates prompt output for 12 (or N) representative state cases
//   - First run: writes __snapshots__/v6.2.json (creates baseline)
//   - Later runs: diff against snapshot. Any byte change is a regression.
//
// When to bless an output change:
//   - You intentionally changed Tier rules, customPromptBlock, or any prompt
//     template content. Then re-run with --update to refresh the snapshot.
// ─────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

const HTML_FILE = path.join(__dirname, "prompt-studio.html");
const SNAP_DIR = path.join(__dirname, "__snapshots__");
const SNAP_FILE = path.join(SNAP_DIR, "prompt-studio.json");

// ─── 12 representative cases (mode × variation) ─────────────────────
const BASE_STATE = {
    mediaType: "3d",
    dialogueMode: "dialogue",
    domain: "narrative-character",
    priorityMode: "balanced",
    lengthMode: "standard",
    checkMode: "standard",
    subtitleMode: "soft",
    shotStyle: "balanced",
    language: "english-structure-zh-dialogue",
    styleExtra: "sacred reverence",
    customRules: "",
};

const CASES = [
    // storyboard variations
    {
        name: "storyboard_videoexpress_dialogue_balanced",
        state: { mode: "storyboard", platformId: "plat_videoexpress", duration: "45-75 seconds", aspectRatio: "16:9" },
    },
    {
        name: "storyboard_videoexpress_nodialogue_strict_tight_detailed",
        state: { mode: "storyboard", platformId: "plat_videoexpress", duration: "45-75 seconds", aspectRatio: "16:9", dialogueMode: "none", shotStyle: "tight", subtitleMode: "strict", lengthMode: "detailed" },
    },
    {
        name: "storyboard_noplatform_short_1to1",
        state: { mode: "storyboard", platformId: "", duration: "30-45 seconds", aspectRatio: "1:1", lengthMode: "short" },
    },
    {
        name: "storyboard_videoexpress_minimal_dialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", duration: "45-75 seconds", aspectRatio: "16:9", outputMode: "minimal" },
    },
    {
        name: "storyboard_noplatform_minimal_nodialogue",
        state: { mode: "storyboard", platformId: "", duration: "30-45 seconds", aspectRatio: "1:1", outputMode: "minimal", dialogueMode: "none" },
    },
    // single-shot variations
    {
        name: "singleshot_seedance_balanced_16_9",
        state: { mode: "single-shot", platformId: "plat_seedance", duration: "5-10 seconds", aspectRatio: "16:9" },
    },
    {
        name: "singleshot_runway_tight_9_16_nodialogue",
        state: { mode: "single-shot", platformId: "plat_runway", duration: "10-15 seconds", aspectRatio: "9:16", dialogueMode: "none", shotStyle: "tight" },
    },
    {
        name: "singleshot_noplatform_strict_1to1",
        state: { mode: "single-shot", platformId: "", duration: "5-10 seconds", aspectRatio: "1:1", subtitleMode: "strict" },
    },
    // avatar variations
    {
        name: "avatar_talkingphotos_long",
        state: { mode: "avatar", platformId: "plat_talkingphoto", duration: "60-180 seconds", aspectRatio: "9:16" },
    },
    {
        name: "avatar_heygen_dialogue_strict",
        state: { mode: "avatar", platformId: "plat_heygen", duration: "60-90 seconds", aspectRatio: "16:9", dialogueMode: "dialogue", subtitleMode: "strict" },
    },
    {
        name: "avatar_noplatform_mid",
        state: { mode: "avatar", platformId: "", duration: "30-45 seconds", aspectRatio: "9:16" },
    },
    // short-form variations
    {
        name: "shortform_tiktok_basic",
        state: { mode: "short-form", platformId: "plat_tiktok", duration: "15-30 seconds", aspectRatio: "9:16" },
    },
    {
        name: "shortform_tiktok_dialogue_strict_styled",
        state: { mode: "short-form", platformId: "plat_tiktok", duration: "15-30 seconds", aspectRatio: "9:16", dialogueMode: "dialogue", subtitleMode: "strict", styleExtra: "epic divine" },
    },
    {
        name: "shortform_noplatform",
        state: { mode: "short-form", platformId: "", duration: "15-30 seconds", aspectRatio: "9:16" },
    },
];

// ─── Load generatePrompt from the HTML <script> ──────────────────────
function loadGenerator(htmlFile) {
    const html = fs.readFileSync(htmlFile, "utf-8");
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) throw new Error("no <script> tag found in " + htmlFile);
    const src = m[1];

    const DEFAULTS_FOR_STUB = {
        mediaType: "3d", dialogueMode: "none", domain: "narrative-character",
        priorityMode: "balanced", lengthMode: "standard", checkMode: "standard",
        subtitleMode: "soft", duration: "45-75 seconds", aspectRatio: "16:9",
        shotStyle: "balanced", language: "english-structure-zh-dialogue",
        activePlatform: "", pf_family: "cinematic", pf_primaryMode: "storyboard",
    };

    const stubs = `
const _DEFAULTS = ${JSON.stringify(DEFAULTS_FOR_STUB)};
function _stubEl(id) {
  return {
    value: _DEFAULTS[id] !== undefined ? _DEFAULTS[id] : "",
    addEventListener: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
    style: {}, dataset: {}, innerHTML: "", textContent: "", className: "", disabled: false, placeholder: "",
    dispatchEvent: () => {}, querySelectorAll: () => [], querySelector: () => null,
    scrollIntoView: () => {}, focus: () => {}, files: [], appendChild: () => {},
  };
}
function _mockEl() {
  return { dataset: {}, value: "", textContent: "", innerHTML: "", appendChild: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } };
}
const document = {
  getElementById: _stubEl, addEventListener: () => {},
  createElement: _mockEl,
  querySelectorAll: () => [], querySelector: () => null,
  documentElement: { dataset: {}, lang: "", setAttribute: () => {}, getAttribute: () => "light" },
};
const localStorage = { _store: {}, getItem(k) { return this._store[k] || null; }, setItem(k, v) { this._store[k] = v; } };
const window = {};
const navigator = { clipboard: { writeText: () => {} } };
const alert = () => {}; const confirm = () => true; const prompt = () => ""; const setTimeout = (f) => {};
const FileReader = function () { this.readAsText = () => {}; };
const Blob = function () {}; const URL = { createObjectURL: () => "", revokeObjectURL: () => {} };
`;

    const factory = new Function(
        stubs + src + `return { generatePrompt, DEFAULT_PLATFORMS, db };`
    );
    const api = factory();
    api.db.platforms = api.DEFAULT_PLATFORMS;
    return api;
}

// ─── Run cases → { name → { state, output } } ────────────────────────
function runCases(api) {
    const result = {};
    for (const c of CASES) {
        const state = { ...BASE_STATE, ...c.state };
        const output = api.generatePrompt(state);
        result[c.name] = { state, output };
    }
    return result;
}

// ─── Diff helpers ────────────────────────────────────────────────────
function firstDiff(a, b) {
    const lines_a = a.split("\n");
    const lines_b = b.split("\n");
    const n = Math.min(lines_a.length, lines_b.length);
    for (let i = 0; i < n; i++) {
        if (lines_a[i] !== lines_b[i]) {
            return { line: i + 1, a: lines_a[i], b: lines_b[i] };
        }
    }
    if (lines_a.length !== lines_b.length) {
        return {
            line: n + 1,
            a: lines_a[n] || "<EOF>",
            b: lines_b[n] || "<EOF>",
        };
    }
    return null;
}

// ─── CLI ─────────────────────────────────────────────────────────────
function main() {
    const args = new Set(process.argv.slice(2));

    if (args.has("--list")) {
        console.log(`${CASES.length} cases:`);
        for (const c of CASES) console.log("  " + c.name);
        return;
    }

    if (!fs.existsSync(HTML_FILE)) {
        console.error("✗ HTML file not found:", HTML_FILE);
        process.exit(1);
    }

    console.log("Loading", path.basename(HTML_FILE), "…");
    const api = loadGenerator(HTML_FILE);
    const current = runCases(api);

    if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });

    if (args.has("--update") || !fs.existsSync(SNAP_FILE)) {
        const reason = args.has("--update")
            ? "(--update flag)"
            : "(no existing snapshot)";
        const snapshot = {
            meta: {
                tool: "prompt-studio",
                schemaVersion: "0.6.0",
                generatedAt: new Date().toISOString(),
                caseCount: CASES.length,
            },
            cases: current,
        };
        fs.writeFileSync(SNAP_FILE, JSON.stringify(snapshot, null, 2));
        console.log(`✓ Snapshot written ${reason}: ${SNAP_FILE}`);
        console.log(`  ${CASES.length} cases captured.`);
        return;
    }

    // Compare mode
    const snapshot = JSON.parse(fs.readFileSync(SNAP_FILE, "utf-8"));
    const expected = snapshot.cases;

    let pass = 0, fail = 0, missing = 0, extra = 0;
    const failures = [];

    for (const c of CASES) {
        const cur = current[c.name];
        const exp = expected[c.name];
        if (!exp) {
            console.log(`+ ${c.name.padEnd(48)} NEW case (not in snapshot)`);
            missing++;
            continue;
        }
        if (cur.output === exp.output) {
            console.log(`✓ ${c.name.padEnd(48)} (${cur.output.length} chars)`);
            pass++;
        } else {
            console.log(`✗ ${c.name.padEnd(48)} CHANGED (snap ${exp.output.length} chars → now ${cur.output.length} chars)`);
            fail++;
            failures.push({ c, exp, cur });
        }
    }
    for (const name of Object.keys(expected)) {
        if (!current[name]) {
            console.log(`- ${name.padEnd(48)} REMOVED case (in snapshot, not in runner)`);
            extra++;
        }
    }

    if (failures.length) {
        console.log("\n─── First diverging line per failed case ───");
        for (const f of failures.slice(0, 3)) {
            const d = firstDiff(f.exp.output, f.cur.output);
            if (d) {
                console.log(`\n  ${f.c.name}  (line ${d.line})`);
                console.log("    snapshot: " + JSON.stringify(d.a.slice(0, 140)));
                console.log("    current : " + JSON.stringify(d.b.slice(0, 140)));
            }
        }
        if (failures.length > 3) {
            console.log(`\n  …and ${failures.length - 3} more failures (run again to inspect)`);
        }
    }

    console.log(`\n═══ ${pass} pass · ${fail} fail · ${missing} new · ${extra} removed ═══`);
    if (fail > 0) {
        console.log("To bless these changes, re-run with --update");
        process.exit(1);
    }
}

main();
