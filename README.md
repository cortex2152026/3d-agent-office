# 2D Agent Operations Dashboard (Vite)

A desktop-first **2D operations cockpit** with a realistic ruinscape/pixel-office aesthetic, built on vanilla Vite + local mock data.

## Feature Overview

### Art Direction Upgrade (Ruinscape Scene)
- Layered center scene rebuilt as a **2D office/ruinscape composition** using pure CSS + inline SVG:
  - floor grid
  - broken wall slabs + columns
  - glowing terminals
  - cable runs + debris polygons
- Subtle ambient motion (non-distracting):
  - scanline drift
  - dust motes
  - terminal flicker
  - conditional alert pulse near error zones

### UX/Data Depth
- New **top command bar** with global KPIs:
  - uptime
  - active jobs
  - average latency
  - incident count
- New **incident/event timeline panel** with timestamps and event tags
- Per-agent **latency mini trend sparkline** in details panel
- Keyboard shortcuts modal + quick access button

### Interaction Quality
- Smooth visual transitions for selected stations/cards
- Toast notifications for control actions:
  - pause/resume
  - assign
  - escalate
  - sort/filter toggles
- Persistence via localStorage:
  - selected agent
  - filter
  - sort mode
  - paused agents

### Agent + Operations Panels
- Sidebar: filters/search/sort + agent roster
- Center: ruinscape map + incidents + throughput + job queue
- Right: selected agent metrics, controls, logs, per-agent trend

## Keyboard Shortcuts
- `/` → Focus search
- `F` → Cycle filter (`all → online → busy → error → offline`)
- `S` → Toggle sort by load
- `?` → Open/close shortcuts modal
- `Esc` → Close shortcuts modal

## Tech
- [Vite](https://vitejs.dev/)
- Vanilla JavaScript (ES modules)
- Vanilla CSS + inline SVG

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
3d-agent-office/
├─ index.html
├─ package.json
├─ src/
│  ├─ data.js
│  ├─ main.js
│  ├─ state.js
│  ├─ style.css
│  └─ ui.js
└─ README.md
```
