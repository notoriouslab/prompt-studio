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
//   2. For each eval case: generate spec → expand via Gemini (GEMINI_MODEL) → print output
//   3. (Future) run regex assertions to check spec rules took effect
//
// Requires:
//   ~/.paiop_secrets.json with GEMINI_API_KEY (Google AI Studio key, "AIza…"),
//   or an OpenAI-compatible fallback picked in this order when no AI Studio key is present:
//   GROQ_API_KEY (openai/gpt-oss-120b, free tier) → NVIDIA_API_KEY → OPENROUTER_API_KEY.
//   Force one with --provider gemini|groq|nvidia|openrouter; --model <id> overrides the model.
//   Transient 429/503 responses are retried 3× with backoff.
//   Node 18+ for native fetch
// ─────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const os = require("os");

const HTML_FILE = process.env.PS_HTML || path.join(__dirname, "prompt-studio.html");
const GEMINI_MODEL = "gemini-3.6-flash";

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
        mediaType: "3d", dialogueMode: "none", domain: "narrative-character", tone: "auto",
        duration: "45-75 seconds", aspectRatio: "16:9",
        shotStyle: "balanced", language: "english-structure-zh-dialogue",
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

// ─── Transient-error retry (429 rate limit / 503 high demand) ────────
const RETRY_DELAYS_MS = [8000, 20000, 45000];
async function withRetry(label, fn) {
    for (let attempt = 0; ; attempt++) {
        const res = await fn();
        if (res.ok) return res;
        const transient = res.status === 429 || res.status === 503;
        if (!transient || attempt >= RETRY_DELAYS_MS.length) return res;
        const wait = RETRY_DELAYS_MS[attempt];
        console.log(`  ⟳ ${label} ${res.status}, retry ${attempt + 1}/${RETRY_DELAYS_MS.length} in ${wait / 1000}s`);
        await new Promise((r) => setTimeout(r, wait));
    }
}

// ─── Gemini API call ─────────────────────────────────────────────────
async function callGemini(apiKey, prompt, { model = GEMINI_MODEL, temperature = 0.7, maxOutputTokens = 16384 } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
    };
    const res = await withRetry(model, () =>
        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Gemini API error: ${JSON.stringify(data).slice(0, 400)}`);
    }
    // A 200 with no text (finishReason MAX_TOKENS / SAFETY / RECITATION) used to return "" and get saved
    // as a sample with every assertion red — fail the case instead of recording an empty expansion.
    const text = (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
    if (!text) {
        const reason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "no candidates";
        throw new Error(`Gemini returned no text (finishReason: ${reason}; usage: ${JSON.stringify(data.usageMetadata || {})})`);
    }
    return text;
}

// ─── OpenAI-compatible fallbacks ─────────────────────────────────────
const OPENAI_COMPAT = {
    groq: { key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: "openai/gpt-oss-120b" },
    nvidia: { key: "NVIDIA_API_KEY", url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "nvidia/nemotron-3-super-120b-a12b" },
    openrouter: { key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: `google/${GEMINI_MODEL}` },
};
async function callOpenAICompat(cfg, apiKey, prompt, { temperature = 0.7, maxOutputTokens = 16384 } = {}) {
    const res = await withRetry(cfg.model, () =>
        fetch(cfg.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: cfg.model, temperature, max_tokens: maxOutputTokens, messages: [{ role: "user", content: prompt }] }),
        }),
    );
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(`${cfg.model} API error: ${JSON.stringify(data).slice(0, 400)}`);
    }
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) {
        throw new Error(`${cfg.model} returned no text (finish_reason: ${data.choices?.[0]?.finish_reason || "no choices"}; usage: ${JSON.stringify(data.usage || {})})`);
    }
    return text;
}

// Pick the provider: --provider <name>, else Gemini when a real AI Studio key ("AIza…")
// is present, else the first OpenAI-compatible provider whose key exists.
function pickProvider(secrets, args) {
    const i = args.indexOf("--provider");
    const forced = i >= 0 ? args[i + 1] : null;
    const mi = args.indexOf("--model");
    const modelOverride = mi >= 0 ? args[mi + 1] : null;
    const geminiOk = typeof secrets.GEMINI_API_KEY === "string" && secrets.GEMINI_API_KEY.startsWith("AIza");
    const name = forced || (geminiOk ? "gemini" : Object.keys(OPENAI_COMPAT).find((n) => secrets[OPENAI_COMPAT[n].key]) || "gemini");
    if (OPENAI_COMPAT[name]) {
        const cfg = { ...OPENAI_COMPAT[name], model: modelOverride || OPENAI_COMPAT[name].model };
        if (!secrets[cfg.key]) throw new Error(`${cfg.key} not set in ~/.paiop_secrets.json`);
        return { name, model: cfg.model, call: (prompt) => callOpenAICompat(cfg, secrets[cfg.key], prompt) };
    }
    if (name !== "gemini") throw new Error(`unknown --provider ${name} (gemini|${Object.keys(OPENAI_COMPAT).join("|")})`);
    if (!secrets.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in ~/.paiop_secrets.json");
    if (!geminiOk) console.warn("⚠ GEMINI_API_KEY does not look like an AI Studio key (expected AIza…); the call may 401 — try --provider groq");
    const model = modelOverride || GEMINI_MODEL;
    return { name, model, call: (prompt) => callGemini(secrets.GEMINI_API_KEY, prompt, { model }) };
}

// ─── Eval cases ──────────────────────────────────────────────────────
const BASE_STATE = {
    mediaType: "3d", dialogueMode: "dialogue", domain: "narrative-character", tone: "auto",
    shotStyle: "balanced",
    language: "english-structure-zh-dialogue", styleExtra: "", customRules: "",
};

// ─── Assertions (rule-based lint) ────────────────────────────────────
const ASSERTIONS = {
    dialogue_wrap: (output) => {
        // dialogue should be wrapped as: says in a [tone, ...] accent: "..."
        // tolerate curly quotes / full-width colon / "with a ... accent" phrasing (gemini-3.6-flash varies)
        const matches = output.match(/(says|replies) in (a|an) [\w\s,]+accent[:：]\s*["“「『]/g) || [];
        if (matches.length < 1) {
            return { pass: false, reason: `dialogue wrap pattern not found (expected ≥ 1, got 0)` };
        }
        return { pass: true, reason: `dialogue wrap × ${matches.length}` };
    },
    ve35_i2v_tags: (output) => {
        // Every I2V prompt must be ONE line carrying the eight VideoExpress v3.5 bracket tags in order
        // (official "Create Prompts" grammar, 2026-09-19). Each [REFERENCE USE] opens one prompt.
        const TAGS = ["[REFERENCE USE]", "[IDENTITY / CONTINUITY]", "[SCENE]", "[ACTION ", "[CAMERA]", "[LIGHT AND IMAGE]", "[PRODUCTION SOUND]", "[NEGATIVES]"];
        const prompts = output.split("[REFERENCE USE]").slice(1).map((chunk) => "[REFERENCE USE]" + chunk.split("\n")[0]);
        if (prompts.length < 1) return { pass: false, reason: "no [REFERENCE USE] tag found — I2V prompts did not adopt the v3.5 grammar" };
        const bad = prompts.filter((p) => {
            let pos = 0;
            for (const t of TAGS) { const i = p.indexOf(t, pos); if (i < 0) return true; pos = i; }
            return false;
        });
        if (bad.length) return { pass: false, reason: `${bad.length}/${prompts.length} I2V prompt(s) missing or misordering a tag: ${bad[0].slice(0, 160)}…` };
        const unfilled = prompts.filter((p) => /<[^<>\n]{1,80}>/.test(p));
        if (unfilled.length) return { pass: false, reason: `${unfilled.length}/${prompts.length} I2V prompt(s) still carry unfilled <slot> placeholders: ${unfilled[0].match(/<[^<>\n]{1,80}>/)[0]}` };
        const stray = (output.match(/Animate this image|Animate natural lipsync/g) || []).length;
        if (stray) return { pass: false, reason: `${stray} legacy boilerplate phrase(s) (Animate this image / Animate natural lipsync) still present` };
        return { pass: true, reason: `${prompts.length} I2V prompt(s), all eight tags in order` };
    },
    t2i_depth: (output) => {
        // Every T2I prompt (shot prompts and Actor portraits) follows the official v3.5 T2I shape:
        // ≥100 English words (or ≥150 CJK chars), explicit spatial placement, a "no text / watermark"
        // closer, and none of the legacy comma-list suffix ("aspect ratio, clean unmarked frame").
        const lines = output.split("\n").filter((l) => /Text-To-Image Prompt|Text-to-Image Prompt|^Actor \d+[:：]/.test(l));
        // single-shot mode puts the prompt on the line after the "### Text-to-Image Prompt" heading
        if (!lines.length || lines.every((l) => /^#+ /.test(l))) {
            const m = output.match(/### Text-to-Image Prompt\s*\n+([^\n]+)/);
            if (m) lines.splice(0, lines.length, m[1]);
        }
        const entries = lines.filter((l) => !/^#+ /.test(l)).map((l) => ({
            portrait: /^\**Actor \d+[:：]/.test(l),
            body: l.replace(/^.*?(Text-To-Image Prompt|Text-to-Image Prompt)\*{0,2}[:：]\*{0,2}\s*/i, "").replace(/^\**Actor \d+[:：]\**\s*/, ""),
        }));
        const bodies = entries.map((e) => e.body);
        if (!bodies.length) return { pass: false, reason: "no T2I prompt lines found" };
        const problems = [];
        for (const { portrait, body: b } of entries) {
            const words = (b.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
            const cjk = (b.match(/[一-鿿]/g) || []).length;
            const long = words >= 100 || cjk >= 150;
            const spatial = /\b(left|right|cent(er|re)|foreground|background|behind|beside|above|below)\b|[左右中]|前景|背景|身後|旁/.test(b);
            const closer = /no (visible |readable |on-screen )?(text|lettering)[^.]*watermark|watermark[^.]*\btext\b|無文字|無水印|不出現文字/i.test(b);
            const legacy = /aspect ratio, clean unmarked frame|畫面比例，乾淨無標記的畫面/.test(b);
            if (!long) problems.push(`short (${words}w/${cjk}c): ${b.slice(0, 80)}…`);
            else if (!spatial && !portrait) problems.push(`no spatial placement: ${b.slice(0, 80)}…`); // portraits sit on a plain backdrop by design
            else if (!closer) problems.push(`no "no text / watermark" closer: …${b.slice(-80)}`);
            else if (legacy) problems.push(`legacy comma-list suffix: …${b.slice(-80)}`);
        }
        if (problems.length) return { pass: false, reason: `${problems.length}/${bodies.length} T2I prompt(s) off-shape — ${problems[0]}` };
        return { pass: true, reason: `${bodies.length} T2I prompt(s), all ≥100 words with placement + closer` };
    },
    camera_variety: (output) => {
        // Storyboard [CAMERA] segments: no two consecutive shots share the same move, at least two distinct
        // move types, and locked-off never exceeds half the shots (official v3.5 examples move every shot).
        const cams = [...output.matchAll(/\[CAMERA\]\s*([^[]+?)\s*(?=\[LIGHT AND IMAGE\])/g)].map((m) => m[1].trim());
        if (cams.length < 2) return { pass: false, reason: `only ${cams.length} [CAMERA] segment(s) found` };
        const type = (c) => /locked|固定/i.test(c) ? "locked" : /pull|back|後退|拉開/i.test(c) ? "pull" : /drift|lateral|pan|橫移/i.test(c) ? "drift" : /push|dolly|推/i.test(c) ? "push" : /track|跟/i.test(c) ? "track" : "other";
        const types = cams.map(type);
        const dup = cams.findIndex((c, i) => i > 0 && c.replace(/\s+/g, " ") === cams[i - 1].replace(/\s+/g, " "));
        if (dup >= 0) return { pass: false, reason: `shots ${dup} and ${dup + 1} carry an identical [CAMERA] segment: ${cams[dup].slice(0, 80)}` };
        const locked = types.filter((t) => t === "locked").length;
        if (locked * 2 > types.length) return { pass: false, reason: `${locked}/${types.length} shots locked off` };
        if (new Set(types).size < 2) return { pass: false, reason: `every shot uses the same move type (${types[0]})` };
        const untargeted = cams.filter((c, i) => types[i] !== "locked" && !/toward|towards|past|from|onto|along|across|reveal|follow|retain|keep|maintain|preserv|hold|向|經過|從|露出|跟隨|保留|維持/i.test(c));
        if (untargeted.length) return { pass: false, reason: `${untargeted.length}/${cams.length} camera move(s) name no target: ${untargeted[0].slice(0, 80)}` };
        return { pass: true, reason: `${cams.length} shots · moves ${types.join(" → ")}` };
    },
    shot_size_variety: (output) => {
        // Storyboard T2I prompts (not portraits): ≥3 distinct shot sizes, never three consecutive shots at one size
        // (speaking shots may hold a close-up for two shots; three in a row is the "one framing" failure).
        const lines = output.split("\n").filter((l) => /Text-To-Image Prompt/.test(l));
        if (lines.length < 3) return { pass: false, reason: `only ${lines.length} shot T2I line(s)` };
        const size = (l) => /extreme close|極近|臉佔滿|face fills/i.test(l) ? "ecu" : /close[- ]up|chest[- ]up|from the chest|head[- ]and[- ]shoulders|shoulders up|特寫|胸部以上|肩部以上/i.test(l) ? "cu" : /waist[- ]up|from the waist|medium shot|medium framing|mid[- ]shot|knees up|腰部以上|膝蓋以上|中景|半身/i.test(l) ? "med" : /full[- ]body|full[- ]length|wide shot|wide framing|head to toe|establishing|全身|遠景|廣角|大遠景/i.test(l) ? "wide" : "unknown";
        const sizes = lines.map(size);
        const unknown = sizes.filter((x) => x === "unknown").length;
        if (unknown) return { pass: false, reason: `${unknown}/${sizes.length} shot T2I(s) state no shot size` };
        const run = sizes.findIndex((x, i) => i > 1 && x === sizes[i - 1] && x === sizes[i - 2]);
        if (run >= 0) return { pass: false, reason: `three consecutive shots hold the size "${sizes[run]}" — sizes ${sizes.join(" → ")}` };
        if (new Set(sizes).size < 3) return { pass: false, reason: `only ${new Set(sizes).size} distinct shot size(s): ${sizes.join(" → ")}` };
        return { pass: true, reason: `sizes ${sizes.join(" → ")}` };
    },
    two_shot_present: (output) => {
        // Multi-actor storyboards: at least one I2V [IDENTITY / CONTINUITY] lists two distinct actors (a two-shot),
        // and single-actor shots name a screen direction (facing left/right) so shots cut together.
        const portraits = new Set((output.match(/^\**Actor (\d+)[:：]/gm) || []).map((m) => m.match(/\d+/)[0]));
        if (portraits.size < 2) return { pass: false, reason: `only ${portraits.size} actor portrait(s) — brief expected two actors` };
        const idents = [...output.matchAll(/\[IDENTITY \/ CONTINUITY\]([^[]*)/g)].map((m) => m[1]);
        const twoShots = idents.filter((t) => new Set([...t.matchAll(/Actor (\d+)/g)].map((m) => m[1])).size >= 2);
        if (!twoShots.length) return { pass: false, reason: `${idents.length} shots, none with two actors in [IDENTITY / CONTINUITY]` };
        const t2i = output.split("\n").filter((l) => /Text-To-Image Prompt/.test(l));
        const noDir = t2i.filter((l) => !/facing (left|right)|toward(s)? frame (left|right)|off-frame (left|right)|(left|right) frame edge|面朝[左右]|朝畫面[左右]|畫框[左右]/i.test(l));
        if (noDir.length > Math.floor(t2i.length / 2)) return { pass: false, reason: `${noDir.length}/${t2i.length} shot T2I(s) state no screen direction` };
        return { pass: true, reason: `${twoShots.length}/${idents.length} two-shot(s), ${t2i.length - noDir.length}/${t2i.length} shots with screen direction` };
    },
    zh_only_prompts: (output) => {
        // zh-only: every T2I / I2V prompt body must be Traditional Chinese. Allowed ASCII: the eight
        // uppercase tags, "Actor N", aspect ratios, time ranges, lens tokens. Flag runs of ≥4 English words.
        const lines = output.split("\n").filter((l) => /Text-To-Image Prompt|Image-To-Video Prompt|^Actor \d+:/.test(l));
        if (!lines.length) return { pass: false, reason: "no prompt lines found" };
        const strip = (l) => l
            .replace(/\[(REFERENCE USE|IDENTITY \/ CONTINUITY|SCENE|ACTION[^\]]*|CAMERA|LIGHT AND IMAGE|PRODUCTION SOUND|NEGATIVES)\]/g, " ")
            .replace(/\*\*(Text-To-Image|Image-To-Video) Prompt:\*\*/g, " ")
            .replace(/Actor \d+/g, " ").replace(/\d+:\d+|\d+mm|f\/[\d.]+|\d+(\.\d+)?s\b/g, " ");
        const runs = [];
        lines.forEach((l) => { const m = strip(l).match(/(?:\b[A-Za-z][A-Za-z'’-]*\b[ ,;:\-]*){4,}/g); if (m) runs.push(...m.map((x) => x.trim())); });
        const zhChars = (lines.join("").match(/[\u4e00-\u9fff]/g) || []).length;
        if (runs.length) return { pass: false, reason: `${runs.length} English run(s) in ${lines.length} prompt line(s), e.g. "${runs[0].slice(0, 90)}"` };
        return { pass: true, reason: `${lines.length} prompt lines, ${zhChars} CJK chars, no English runs` };
    },
    tone_no_dark_drift: (output) => {
        // tone = auto on a plain slice-of-life idea: the model must not escalate into thriller / suspense / horror
        const hits = output.match(/thriller|suspense|suspenseful|horror|驚悚|懸疑|恐怖/gi) || [];
        if (hits.length) return { pass: false, reason: `dark-genre drift: ${hits.length} hit(s), e.g. "${hits[0]}"` };
        return { pass: true, reason: "no thriller / suspense / horror vocabulary" };
    },
    tone_comedy_genre: (output) => {
        const m = output.match(/^.*Genre.*$/mi);
        if (!m) return { pass: false, reason: "no Genre line found" };
        if (!/comed|喜劇/i.test(m[0])) return { pass: false, reason: `Genre line lacks comedy: "${m[0].slice(0, 100)}"` };
        return { pass: true, reason: `Genre: ${m[0].slice(0, 80)}` };
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
    photoreal_face_lock: (output) => {
        // live mediaType, shot WITH a human face: faceLock fragments should land in the T2I prompt
        const signals = [/visible pores/i, /skin smoothing|beauty filter|waxy skin/i, /sensor grain|RAW/i];
        const hit = signals.filter((re) => re.test(output));
        if (hit.length < 2) {
            return { pass: false, reason: `faceLock fragments not found (expected ≥ 2 of 3 signal groups, got ${hit.length})` };
        }
        return { pass: true, reason: `photoreal signals ${hit.length}/3` };
    },
    photoreal_no_face_leak: (output) => {
        // live mediaType, shot with NO people: generic photoreal lock present, faceLock absent.
        // Guards against the LLM inventing people to justify skin terms in empty scenes.
        if (!/sensor grain|RAW/i.test(output)) {
            return { pass: false, reason: "generic photoreal lock (sensor grain / RAW) missing" };
        }
        const leaked = [/visible pores/i, /skin smoothing/i, /beauty filter/i, /waxy skin/i].filter((re) => re.test(output));
        if (leaked.length > 0) {
            return { pass: false, reason: `faceLock leaked into no-people shot (${leaked.length} fragment group(s))` };
        }
        return { pass: true, reason: "generic lock present, no faceLock leak" };
    },
    closeup_toolkit: (output) => {
        // live mediaType, extreme close-up brief: toolkit should yield real gear / light source / crop framing, and no bare quality words
        const signals = [/\b\d{2,3}mm\b|f\/\d(\.\d)?|Canon|Sony|prime lens/i, /softbox|single (large )?light|key light/i, /fills the frame|cropped|extreme (facial )?close-up/i];
        const hit = signals.filter((re) => re.test(output));
        if (/\b8k\b|ultra realistic/i.test(output)) {
            return { pass: false, reason: "quality-word anti-pattern (8k / ultra realistic) present" };
        }
        if (hit.length < 2) {
            return { pass: false, reason: `close-up toolkit signals weak (expected ≥ 2 of 3 groups, got ${hit.length})` };
        }
        return { pass: true, reason: `toolkit signals ${hit.length}/3, no quality words` };
    },
    zh_dialogue: (output) => {
        // english-structure-zh-dialogue mode: every dialogue wrap's quoted line must be
        // Traditional Chinese (contains CJK, no common Simplified-only chars); headings stay
        // English; and no bare English dialogue may appear OUTSIDE the wrap either.
        // Spec 的 ✅/❌ 對照範例若被回聲進輸出，不算對白——先剔除再驗。
        const body = output
            .split("\n")
            .filter((l) => !/Anti-pattern|❌|Correct ✅/.test(l))
            .join("\n");
        const wraps = body.match(/(says|replies) in [^:：\n]{0,120}accent[:：]\s*["“「『][^"”」』\n]{1,200}/g) || [];
        if (wraps.length < 1) {
            return { pass: false, reason: "no dialogue wrap found to language-check" };
        }
        const nonZh = wraps.filter((w) => !/[一-鿿]/.test(w.split(/[:：]/).slice(1).join("")));
        if (nonZh.length > 0) {
            return { pass: false, reason: `${nonZh.length}/${wraps.length} dialogue line(s) not Chinese` };
        }
        // Bare English dialogue that skipped the wrap: `Actor N: "..."` lines or a
        // table cell holding nothing but an English quote (# Dialogue Script Line column).
        const bare = [
            ...(body.match(/(?:Actor \d+|[A-Z][a-z]+)\s*[:：]\s*["“][A-Za-z][^"”\n]{5,}["”]/g) || []),
            ...(body.match(/\|\s*["“][A-Za-z][^"”|\n]{5,}["”]\s*\|/g) || []),
        ].filter((s) => !/[一-鿿]/.test(s));
        if (bare.length > 0) {
            return { pass: false, reason: `${bare.length} bare English dialogue line(s) outside the wrap, e.g. ${bare[0].slice(0, 60)}` };
        }
        // Simplified-only characters that never appear in Traditional text
        const simplified = body.match(/[们说对问这来时会学过还进发东车华门业乐读书饭见长]/g) || [];
        if (simplified.length > 0) {
            return { pass: false, reason: `Simplified characters found: ${[...new Set(simplified)].join("")}` };
        }
        const nonEnHeadings = (body.match(/^# [^\n]+/gm) || []).filter((h) => /[一-鿿]/.test(h));
        if (nonEnHeadings.length > 0) {
            return { pass: false, reason: `non-English section heading(s): ${nonEnHeadings.join(", ")}` };
        }
        return { pass: true, reason: `zh dialogue × ${wraps.length}, no bare English lines, English headings, no Simplified chars` };
    },
    full_section_count: (output) => {
        const h1s = (output.match(/^# [^\n]+/gm) || []).length;
        if (h1s < 6) {
            return { pass: false, reason: `expected ≥ 6 # sections in full mode, got ${h1s}` };
        }
        return { pass: true, reason: `${h1s} # sections` };
    },
};

const CASES = [
    {
        name: "videoexpress_two_actor_interaction",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "narrative-character", dialogueMode: "none", outputMode: "minimal", duration: "15-30 seconds", aspectRatio: "16:9", mediaType: "paper-cut" },
        idea: "紙雕停格風格：雨夜巷口，一個 8 歲男孩和一隻流浪的橘色紙貓爭一片掉落的紙板當雨遮，最後男孩把紙板讓給貓；兩個角色要有互動與對峙，預期 4-5 個 shot。",
        assertions: ["actor_alias", "minimal_section_count", "ve35_i2v_tags", "t2i_depth", "camera_variety", "shot_size_variety", "two_shot_present"],
    },
    {
        name: "videoexpress_live_storyboard_minimal",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "narrative-character", outputMode: "minimal", duration: "30-45 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "深夜台北老公寓廚房，60 歲母親等晚歸的女兒（28 歲上班族）回家；女兒進門，母親把一碗熱湯推過桌面，兩人各說一句話；真人實拍風格，預期 4-5 個 shot。",
        assertions: ["dialogue_wrap", "actor_alias", "minimal_section_count", "ve35_i2v_tags", "photoreal_face_lock", "t2i_depth", "camera_variety", "shot_size_variety"],
    },
    {
        name: "videoexpress_real_interview_dialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "real-interview", duration: "45-75 seconds", aspectRatio: "16:9" },
        idea: "孔毅博士 × AI 對人類衝擊的 KOL 訪談，雙人對談（一位 50 多歲博士、一位 30 歲主持人），現代錄音室場景，3D 動畫風格，預期 5-7 個 shot。",
        assertions: ["dialogue_wrap", "actor_alias", "full_section_count", "zh_dialogue", "ve35_i2v_tags"],
    },
    {
        name: "videoexpress_minimal_dialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "real-interview", outputMode: "minimal", duration: "45-75 seconds", aspectRatio: "16:9" },
        idea: "孔毅博士 × AI 對人類衝擊的 KOL 訪談，雙人對談，現代錄音室場景，3D 動畫風格，預期 5-7 個 shot。",
        assertions: ["dialogue_wrap", "actor_alias", "minimal_section_purge", "minimal_section_count", "zh_dialogue", "ve35_i2v_tags"],
    },
    {
        name: "sora2_single_shot_dialogue",
        state: { mode: "single-shot", platformId: "plat_videoexpress", domain: "narrative-character", duration: "10-20 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "深夜便利店場景：一個 30 歲女性顧客買咖啡，店員微笑說『歡迎光臨』，10 秒 cinematic 真人風格。",
        assertions: ["dialogue_wrap", "photoreal_face_lock", "zh_dialogue", "ve35_i2v_tags"],
    },
    {
        name: "veo3_single_shot_narrative",
        state: { mode: "single-shot", platformId: "plat_videoexpress", domain: "narrative-scene", dialogueMode: "none", duration: "5-8 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "夕陽下的台灣稻田，金黃色光線，鏡頭緩慢推進，遠方中央山脈剪影，6 秒史詩氛圍。",
        assertions: ["photoreal_no_face_leak", "ve35_i2v_tags"],
    },
    {
        name: "live_extreme_closeup_portrait",
        state: { mode: "single-shot", platformId: "plat_videoexpress", domain: "narrative-character", dialogueMode: "none", duration: "5-8 seconds", aspectRatio: "16:9", mediaType: "live" },
        idea: "一位 60 歲台灣漁夫的極近特寫肖像，臉部曬痕與皺紋，凝視鏡頭後緩緩眨眼，攝影棚黑背景，6 秒。",
        assertions: ["photoreal_face_lock", "closeup_toolkit"],
    },
    {
        name: "tone_auto_slice_of_life_full",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "narrative-character", outputMode: "full", mediaType: "live", tone: "auto", dialogueMode: "dialogue", duration: "30-45 seconds", aspectRatio: "16:9" },
        idea: "台北巷口早餐店老闆，每天默默替一位固定來的上班族多加一顆蛋。某天那位客人沒出現，隔天帶著小孩一起來，說要謝謝老闆。",
        assertions: ["tone_no_dark_drift", "ve35_i2v_tags", "full_section_count"],
    },
    {
        name: "tone_comedy_full",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "narrative-character", outputMode: "full", mediaType: "live", tone: "comedy", dialogueMode: "dialogue", duration: "30-45 seconds", aspectRatio: "16:9" },
        idea: "上班族第一次在辦公室用手沖壺泡咖啡，每個步驟都做錯，旁邊同事一路憋笑，最後兩人一起喝下難喝的成品。",
        assertions: ["tone_comedy_genre", "ve35_i2v_tags", "full_section_count"],
    },
    {
        name: "videoexpress_minimal_zh_only",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "real-interview", outputMode: "minimal", mediaType: "live", language: "zh-only", duration: "30-45 seconds", aspectRatio: "16:9" },
        idea: "台北咖啡店老闆娘接受街訪，聊為什麼堅持手沖；一位 45 歲女性、一位 30 歲男主持人，午後窗光，預期 4-5 個 shot。",
        assertions: ["actor_alias", "minimal_section_count", "ve35_i2v_tags", "zh_only_prompts", "t2i_depth", "camera_variety", "shot_size_variety"],
    },
    {
        name: "videoexpress_claymation_minimal_nodialogue",
        state: { mode: "storyboard", platformId: "plat_videoexpress", domain: "narrative-character", outputMode: "minimal", mediaType: "claymation", dialogueMode: "none", duration: "30-45 seconds", aspectRatio: "16:9" },
        idea: "一隻戴黃銅圓框眼鏡的鼴鼠園丁，在迷你溫室裡照顧鬱金香，擦拭牆上的得獎緞帶；黏土停格動畫風格，無對白，預期 4-5 個 shot。",
        assertions: ["actor_alias", "minimal_section_purge", "minimal_section_count", "ve35_i2v_tags", "t2i_depth", "camera_variety", "shot_size_variety"],
    },
    {
        name: "cinemagraph_illustration_kyoto",
        state: { mode: "single-shot", platformId: "plat_videoexpress", domain: "editorial-cinemagraph", mediaType: "illustration", dialogueMode: "none", duration: "5-10 seconds", aspectRatio: "16:9", styleExtra: "Swiss Modernist line art, monochrome silkscreen" },
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
    let provider;
    try {
        provider = pickProvider(secrets, args);
    } catch (e) {
        console.error(`✗ ${e.message}`);
        process.exit(1);
    }
    console.log(`provider: ${provider.name} · model: ${provider.model}`);

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

        console.log(`\n... calling ${provider.model} via ${provider.name} ...`);
        const t0 = Date.now();
        let expanded;
        try {
            expanded = await provider.call(userPrompt);
        } catch (e) {
            console.error(`✗ ${e.message}`);
            process.exitCode = 1;
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
            if (failed > 0) {
                process.exitCode = 1;
                console.log("  (run with --dump <case> to inspect full output)");
            }
        }

        // Save sample to samples/eval/{name}.md if requested
        if (saveSamples) {
            const md = [
                `# ${c.name}`,
                ``,
                `> Auto-generated by \`eval.js --save-samples\` — DO NOT hand-edit; rerun to refresh.`,
                ``,
                `**Generated**: ${new Date().toISOString()}`,
                `**Model**: ${provider.model} (${provider.name})`,
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
