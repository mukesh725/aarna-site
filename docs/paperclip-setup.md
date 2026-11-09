# Paperclip AI Integration for Aarna Site

This document outlines the setup, architecture, and instructions for managing AI agent workflows on the **Aarna Pharmaceuticals** website repository using [Paperclip](https://github.com/paperclipai/paperclip).

---

## 📌 Overview

**Paperclip** is an open-source autonomous agent control plane and workforce management platform. Instead of running loose agent sessions in terminal tabs, Paperclip provides:
- **Web Dashboard**: Runs at `http://localhost:3100` (Linear/Jira-style task board).
- **Agent Roster**: Connect Claude Code, OpenAI Codex, OpenCode, Cursor, Gemini CLI, or custom shell/API bots.
- **Org Chart & Governance**: Assign roles (e.g. Lead Developer, QA Auditor, Copywriter), approval gates, and hard token budget caps.
- **Workspace Link**: Targets the local `Aarna Site` repository to execute tasks, submit diffs, and preserve full activity history.

---

## 📂 Repository Location

The Paperclip repository has been installed adjacent to the website to keep the production site clean and prevent git/Vercel deployment interference:

- **Aarna Site Repository**: `/Users/mukesh/Desktop/AARNA SITE`
- **Paperclip Engine Directory**: `/Users/mukesh/Desktop/paperclip`

---

## ⚙️ Prerequisites

Paperclip requires **Node.js 24.11.0 or newer** (and `pnpm 9.15+` for source runs):

1. **Install / Upgrade to Node 24** using `nvm`:
   ```bash
   nvm install 24
   nvm use 24
   ```
   *(Or via Homebrew: `brew install node@24`)*

2. **Verify Versions**:
   ```bash
   node -v   # Must output >= v24.11.0
   ```

---

## 🚀 Starting Paperclip

### Method A: Quickstart via NPX (Recommended)
Once running Node 24+, initialize Paperclip's control plane:
```bash
npx paperclipai@latest onboard --yes
```
This spins up the web interface at `http://localhost:3100` with an embedded PostgreSQL database stored under `~/.paperclip`.

To restart the server in the future:
```bash
npx paperclipai run
```

---

### Method B: Run from Local Source (`/Users/mukesh/Desktop/paperclip`)
If you want to run directly from the cloned repository:
```bash
cd /Users/mukesh/Desktop/paperclip
nvm use 24
npm install -g pnpm@9.15.4
pnpm install
pnpm dev
```

---

## 🏢 Connecting Aarna Site to Paperclip

1. Open your browser and go to:
   ```text
   http://localhost:3100
   ```
2. **Create Company**: Name it **Aarna Pharmaceuticals**.
3. **Set Company Goal**: E.g., *"Maintain and enhance the Aarna Pharmaceuticals web platform, product catalog, and responsive healthcare UI."*
4. **Link Workspace**:
   - Under Project / Workspace settings, set the root directory path to:
     ```text
     /Users/mukesh/Desktop/AARNA SITE
     ```
5. **Configure Agent(s)**:
   - Select your agent adapter (Claude Code, Codex, Cursor, Gemini CLI, etc.).
   - Set budget limits and assign initial tasks (e.g., verifying accessibility compliance against `AGENTS.md`, running automated dataset checks, or implementing new pages).

