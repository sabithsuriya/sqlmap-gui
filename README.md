# SQLMap GUI — AI Powered

A professional Electron desktop GUI for SQLMap with AI integration powered by Claude (Anthropic).

---

## ✨ Features

- **Full SQLMap Configuration UI** — all flags, options, techniques in a visual interface
- **Live Terminal Output** — color-coded, real-time SQLMap output
- **AI Assistant** (Claude AI) — ask questions, get flag suggestions, analyze results
- **Auto Vulnerability Parsing** — detected vulns shown as cards in the Results tab
- **Payload Library** — 40+ categorized SQL injection payloads (Boolean, Union, Time, WAF bypass, OOB)
- **Scan History** — track past targets
- **Session Save/Load** — persist your configuration
- **Dark Hacker Aesthetic** — custom titlebar, terminal-style UI

---

## 🚀 Setup

### 1. Prerequisites

```bash
# Install SQLMap
pip install sqlmap
# OR
git clone https://github.com/sqlmapproject/sqlmap.git
# Add to PATH

# Install Node.js (v18+)
# https://nodejs.org
```

### 2. Install & Run

```bash
cd sqlmap-gui
npm install
npm start
```

---

## 🤖 AI Integration Setup

1. Get an Anthropic API key from https://console.anthropic.com
2. Open the app → go to **AI Assistant** tab
3. Paste your API key in the bottom-right → click **Save**

OR set it as an environment variable before starting:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

---

## 📁 Project Structure

```
sqlmap-gui/
├── src/
│   ├── main.js          # Electron main process (SQLMap execution, IPC, AI API)
│   └── preload.js       # Secure IPC bridge (contextBridge)
├── renderer/
│   └── index.html       # Full UI (HTML/CSS/JS — no framework needed)
├── assets/
│   └── icon.png         # App icon (add your own)
└── package.json
```

---

## 🎯 AI Features

| Feature | How to Access |
|---|---|
| Suggest SQLMap flags | AI tab → "Suggest flags for current target" |
| Analyze scan output | AI tab → "Analyze scan output" |
| Explain vulnerabilities | Results tab → click vuln → "AI Explain" |
| Generate WAF bypass payloads | AI tab → "WAF evasion techniques" |
| Generate pentest report | Results tab → "AI Report" |
| Ask anything | AI tab → chat input |

---

## ⚠️ Legal Disclaimer

**FOR AUTHORIZED PENETRATION TESTING ONLY.**

Unauthorized use of SQLMap against systems you do not own or have explicit written permission to test is illegal under the Computer Fraud and Abuse Act (CFAA) and equivalent laws worldwide. The developers of this software are not responsible for misuse.

---

## 🔧 Customization

- Add tamper scripts by editing the **Advanced** section in `renderer/index.html`
- Add custom payloads to the `PAYLOADS` object in the script section
- Modify `AI_SYSTEM` prompt to change AI behavior
