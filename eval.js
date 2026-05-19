#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// eval.js — L2 validation: LLM expansion + rule-based lint (POC)
// ─────────────────────────────────────────────────────────────────────
// Usage:
//   node eval.js                    # run all eval cases
//   node eval.js --case <name>      # run single case
//   node eval.js --list             # list cases
//   node eval.js --dump <name>      # dump full Gemini expanded output (no assertions)
//   node eval.js --save-samples     # write each case's full output to samples/eval/{name}.md
//
// What it does (POC stage):
//   1. Loads PromptStudio's generatePrompt() from the inline <script>
//   2. For each eval case: generate spec → expand via Gemini 2.0 Flash → print output
//   3. (Future) run regex assertions to check spec rules took effect
//
// Requires:
//   ~/.paiop_secrets.json with GEMINI_API_KEY
//   Node 18+ for native fetch
// ─────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const os = require("os");

const HTML_FILE = path.join(__dirname, "prompt-studio.html");

// ─── Secrets ─────────────────────────────────────────────────────────
function loadSecrets() {
    const p = path.join(os.homedir(), ".paiop_secrets.json");
    if (!fs.existsSync(p)) {
        console.error(`✗ Secrets file not found: ${p}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// ─── Load generator (reuses snapshot-test.js stub approach) ──────────
function loadGenerator() {
    const html = fs.readFileSync(HTML_FILE, "utf-8");
    const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

    const DEFAULTS = {
        mediaType: "3d", dialogueMode: "none", domain: "narrative-character",
        priorityMode: "balanced", lengthMode: "standard", checkMode: "standard",
        subtitleMode: "soft", duration: "45-75 seconds", aspectRatio: "16:9",
        shotStyle: "balanced", language: "english-structure-zh-dialogue",
        activePlatform: "", pf_family: "cinematic", pf_primaryMode: "storyboard",
    };

    const stubs = `
const _DEF = ${JSON.stringify(DEFAULTS)};
function _stubEl(id){return{value:_DEF[id]!==undefined?_DEF[id]:"",addEventListener:()=>{},classList:{toggle:()=>{},add:()=>{},remove:()=>{},contains:()=>false},style:{},dataset:{},innerHTML:"",textContent:"",className:"",disabled:false,placeholder:"",dispatchEvent:()=>{},querySelectorAll:()=>[],querySelector:()=>null,scrollIntoView:()=>{},focus:()=>{},files:[],appendChild:()=>{}};}
function _mockEl(){return{dataset:{},value:"",textContent:"",innerHTML:"",appendChild:()=>{},classList:{add:()=>{},remove:()=>{},toggle:()=>{}}};}
const document={getElementById:_stubEl,createElement:_mockEl,addEventListener:()=>{},querySelectorAll:()=>[],querySelector:()=>null,documentElement:{dataset:{},lang:"",setAttribute:()=>{},getAttribute:()=>"light"}};
const localStorage={_store:{},getItem(k){return this._store[k]||null;},setItem(k,v){this._store[k]=v;}};
const window={};const navigator={clipboard:{writeText:()=>{}}};const alert=()=>{};const confirm=()=>true;const prompt=()=>"";const setTimeout=f=>{};
const FileReader=function(){this.readAsText=()=>{};};const Blob=function(){};const URL={createObjectURL:()=>"",revokeObjectURL:()=>{}};
`;
    const factory = new Function(stubs + src + "return { generatePrompt, DEFAULT_PLATFORMS, db };");
    const api = factory();
    api.db.platforms = api.DEFAULT_PLATFORMS;
    return api;
}

// ─── Gemini API call ─────────────────────────────────────────────────
async function callGemini(apiKey, prompt, { model = "gemini-2.0-flash", temperature = 0.7, maxOutputTokens = 8192 } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
    };
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Gemini API error: ${JSON.stringify(data).slice(0, 400)}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Eval cases ──────────────────────────────────────────────────────
const BASE_STATE = {
    mediaType: "3d", dialogueMode: "dialogue", domain: "narrative-character",
    priorityMode: "balanced", lengthMode: "standard", checkMode: "standard",
    subtitleMode: "soft", shotStyle: "balanced",
    language: "english-structure-zh-dialogue", styleExtra: "", customRules: "",
};

// ─── Assertions (rule-based lint) ────────────────────────────────────
const ASSERTIONS = {
    dialogue_wrap: (output) => {
        // dialogue should be wrapped as: says in a [tone, ...] accent: "..."
        const matches = output.match(/(says|replies) in (a|an) [\w\s,]+ accent: ["「『]/g) || [];
        if (matches.length < 1) {
            return { pass: false, reason: `dialogue wrap pattern not found (expected ≥ 1, got 0)` };
        }
        return { pass: true, reason: `dialogue wrap × ${matches.length}` };
    },
    actor_alias: (output) => {
        const matches = output.match(/\bActor [12]\b/g) || [];
        if (matches.length < 2) {
            return { pass: false, reason: `Actor Alias not found enough (expected ≥ 2, got ${matches.length})` };
        }
        return { pass: true, reason: `Actor Alias × ${matches.length}` };
    },
    minimal_section_purge: (output) => {
        const forbidden = [
            "# Project Snapshot",
            "# Creative Assumptions",
            "# Emotional Arc",
            "# Continuity Lock Prompt",
            "# Optional Negative Prompt",
            "# Character Bible",
            "# Dialogue Script",
        ];
        const found = forbidden.filter((h) => output.includes(h));
        if (found.length > 0) {
            return { pass: false, reason: `forbidden sections in minimal mode: ${found.join(", ")}` };
        }
        return { pass: true, reason: "no forbidden sections" };
    },
    minimal_section_count: (output) => {
        const h1s = (output.match(/^# [^\n]+/gm) || []).length;
        if (h1s !== 2) {
            return { pass: false, reason: `expected exactly 2 # sections in minimal, got ${h1s}` };
        }
        return { pass: true, reason: "2 # sections" };
    },
    full_section_count: (output) => {
        const h1s = (output.match(/^# [^\n]+/gm) || []).length;
        if (h1s < 7) {
            return { pass: false, reason: `expected ≥ 7 # sections in full mode, got ${h1s}` };
        }
        return { pass: true, reason: `${h1s} # sections` };
    },
};

const CASES = [
    {
        name: "videoexpress_real_interview_dialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "real-interview", duration: "45-75 seconds", aspectRatio: "16:9" },
        idea: "孔毅博士 × AI 對人類衝擊的 KOL 訪談，雙人對談（一位 50 多歲博士、一位 30 歲主持人），現代錄音室場景，3D 動畫風格，預期 5-7 個 shot。",
        assertions: ["dialogue_wrap", "actor_alias", "full_section_count"],
    },
    {
        name: "videoexpress_minimal_dialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "real-interview", outputMode: "minimal", duration: "45-75 seconds", aspectRatio: "16:9" },
        idea: "孔毅博士 × AI 對人類衝擊的 KOL 訪談，雙人對談，現代錄音室場景，3D 動畫風格，預期 5-7 個 shot。",
        assertions: ["dialogue_wrap", "actor_alias", "minimal_section_purge", "minimal_section_count"],
    },
    {
        name: "sora2_single_shot_dialogue",
        state: { mode: "single-shot", platformId: "plat_sora2", domain: "narrative-character", duration: "10-20 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "深夜便利店場景：一個 30 歲女性顧客買咖啡，店員微笑說『歡迎光臨』，10 秒 cinematic 真人風格。",
        assertions: ["dialogue_wrap"],
    },
    {
        name: "veo3_single_shot_narrative",
        state: { mode: "single-shot", platformId: "plat_veo3", domain: "narrative-scene", dialogueMode: "none", duration: "5-8 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "夕陽下的台灣稻田，金黃色光線，鏡頭緩慢推進，遠方中央山脈剪影，6 秒史詩氛圍。",
        assertions: [],
    },
    {
        name: "cinemagraph_illustration_kyoto",
        state: { mode: "single-shot", platformId: "plat_sora2", domain: "editorial-cinemagraph", mediaType: "illustration", dialogueMode: "none", duration: "5-10 seconds", aspectRatio: "16:9", styleExtra: "Swiss Modernist line art, monochrome silkscreen" },
        idea: "京都鴨川河畔，文青風單色線條插畫海報，行人緩步走過，河流微波，鏡頭微移 parallax，8 秒 living poster。",
        assertions: [],
    },
];

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--list")) {
        console.log(`${CASES.length} case(s):`);
        CASES.forEach((c) => console.log(`  ${c.name}`));
        return;
    }

    const caseFlag = args.indexOf("--case");
    const dumpFlag = args.indexOf("--dump");
    const targetCase = caseFlag >= 0 ? args[caseFlag + 1] : (dumpFlag >= 0 ? args[dumpFlag + 1] : null);
    const dumpMode = dumpFlag >= 0;
    const saveSamples = args.includes("--save-samples");
    const samplesDir = path.join(__dirname, "samples", "eval");
    if (saveSamples) fs.mkdirSync(samplesDir, { recursive: true });

    const secrets = loadSecrets();
    const apiKey = secrets.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("✗ GEMINI_API_KEY not set in ~/.paiop_secrets.json");
        process.exit(1);
    }

    const api = loadGenerator();
    const cases = targetCase ? CASES.filter((c) => c.name === targetCase) : CASES;
    if (!cases.length) {
        console.error(`✗ No case matches: ${targetCase}`);
        process.exit(1);
    }

    for (const c of cases) {
        console.log(`\n═══ ${c.name} ═══`);
        const state = { ...BASE_STATE, ...c.state };
        const spec = api.generatePrompt(state);
        console.log(`spec length: ${spec.length} chars`);
        console.log(`idea: ${c.idea.slice(0, 80)}...`);

        const userPrompt = `${spec}\n\n---\n\nIDEA: ${c.idea}\n\nExpand this idea into the production-ready output following the spec above. Begin output immediately with the first heading — no preamble.`;

        console.log("\n... calling Gemini 2.0 Flash ...");
        const t0 = Date.now();
        let expanded;
        try {
            expanded = await callGemini(apiKey, userPrompt);
        } catch (e) {
            console.error(`✗ ${e.message}`);
            continue;
        }
        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`✓ Gemini responded in ${dt}s, output ${expanded.length} chars\n`);

        if (dumpMode) {
            console.log("─── EXPANDED OUTPUT ───");
            console.log(expanded);
            console.log("─── END ───");
            continue;
        }

        // Run assertions
        let results = [];
        if (!c.assertions || c.assertions.length === 0) {
            console.log("  (no assertions — output for human review only)");
            if (!saveSamples) {
                console.log("─── First 800 chars ───");
                console.log(expanded.slice(0, 800) + (expanded.length > 800 ? "\n..." : ""));
            }
        } else {
            results = c.assertions.map((aname) => {
                const fn = ASSERTIONS[aname];
                if (!fn) return { name: aname, pass: false, reason: `assertion '${aname}' not defined` };
                const r = fn(expanded);
                return { name: aname, ...r };
            });
            const passed = results.filter((r) => r.pass).length;
            const failed = results.filter((r) => !r.pass).length;
            results.forEach((r) => {
                console.log(`  ${r.pass ? "✓" : "✗"} ${r.name}: ${r.reason}`);
            });
            console.log(`  → ${passed}/${results.length} assertions passed`);
            if (failed > 0) console.log("  (run with --dump <case> to inspect full output)");
        }

        // Save sample to samples/eval/{name}.md if requested
        if (saveSamples) {
            const md = [
                `# ${c.name}`,
                ``,
                `> Auto-generated by \`eval.js --save-samples\` — DO NOT hand-edit; rerun to refresh.`,
                ``,
                `**Generated**: ${new Date().toISOString()}`,
                `**Model**: gemini-2.0-flash`,
                `**Spec length**: ${spec.length} chars`,
                `**Output length**: ${expanded.length} chars`,
                `**Latency**: ${dt}s`,
                ``,
                `## Input state`,
                "```json",
                JSON.stringify(state, null, 2),
                "```",
                ``,
                `## Test idea`,
                ``,
                c.idea,
                ``,
                `## Assertion results`,
                results.length === 0
                    ? "_(no assertions — sample is for human review reference only)_"
                    : results.map((r) => `- ${r.pass ? "✓" : "✗"} **${r.name}**: ${r.reason}`).join("\n"),
                ``,
                `## Gemini expanded output`,
                ``,
                expanded,
                ``,
            ].join("\n");
            fs.writeFileSync(path.join(samplesDir, `${c.name}.md`), md);
            console.log(`  → saved samples/eval/${c.name}.md`);
        }
    }
}

main().catch((e) => {
    console.error("✗ fatal:", e);
    process.exit(1);
});
