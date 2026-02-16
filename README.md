# 3D Agent Office — Cyber Loft Demo

A shareable 3D web demo built with **Vite + Three.js** featuring a tasteful blend of cyberpunk neon and warm loft materials.

## What’s Included

- Walkable first-person camera (WASD + mouse)
- 4 labeled agent stations with floating status cards:
  - Agent Atlas — Systems + Routing
  - Agent Echo — Comms + QA
  - Agent Forge — Build + Infra
  - Agent Nova — Research + UX
- Central animated hologram table with rotating rings/core
- Ambient animated elements (drifting particles, pulsing lights, neon strips)
- Mini HUD with title + controls overlay
- Polished lighting/fog mood and desktop-first responsive behavior

## Tech

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)

Dependencies are intentionally modest.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

### Build for Production

```bash
npm run build
npm run preview
```

## Controls

- **Click scene**: lock pointer
- **Mouse**: look around
- **W/A/S/D**: move
- **Shift**: sprint
- **Esc**: unlock pointer

## Screenshot Instructions

### Option A (quick)
1. Run `npm run dev`
2. Open in browser
3. Click scene, move to desired framing
4. Use your OS screenshot shortcut:
   - Linux: `PrtSc` / `Shift+PrtSc`
   - macOS: `Cmd+Shift+4`
   - Windows: `Win+Shift+S`

### Option B (browser DevTools)
1. Open DevTools
2. Run Command Menu (`Ctrl/Cmd + Shift + P`)
3. Type **screenshot**
4. Choose **Capture screenshot** or **Capture full size screenshot**

## Project Structure

```text
3d-agent-office/
├─ index.html
├─ package.json
├─ src/
│  ├─ main.js
│  └─ style.css
└─ README.md
```
