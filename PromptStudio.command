#!/bin/bash
# PromptStudio launcher — double-click to serve the page on localhost and open it.
# A localhost origin is required for the Local Expand (ollama) bridge; plain
# file:// opening works too but hides that section (ollama CORS rejects file://).
PORT=8765
cd "$(dirname "$0")" || exit 1

if ! curl -s -o /dev/null --max-time 1 "http://localhost:${PORT}/prompt-studio.html"; then
    nohup python3 -m http.server "${PORT}" >/dev/null 2>&1 &
    for _ in $(seq 1 20); do
        curl -s -o /dev/null --max-time 1 "http://localhost:${PORT}/prompt-studio.html" && break
        sleep 0.25
    done
fi

open "http://localhost:${PORT}/prompt-studio.html"
