# 2D Agent Operations Dashboard (Vite)

A desktop-first **2D operations cockpit** with a ruinscape/pixel-office aesthetic, built on the existing Vite stack with local mock data only.

## Feature Overview

### Landing + Core Layout
- Dark-mode default, glass panels, pixel-grid accents, and realistic worn office-floor map styling
- **Three-column dashboard**:
  - Left: agent list + filters/search/sort
  - Center: clickable 2D office scene/map + ops widgets
  - Right: selected agent details + controls + activity logs

### Agent System
- 8 seeded agents with realistic operational metrics:
  - status (`online`, `busy`, `error`, `offline`)
  - current task
  - latency
  - queue depth
  - success rate
  - load
- Click any desk/station in the office map or row in the sidebar to focus that agent

### Interactions
- Filters: **all / online / busy / error**
- Search by agent name
- Sort toggle: by load
- Selected station highlight synced across map + list + details panel

### Operations Widgets
- Active incidents list
- Job queue table
- Throughput sparkline (inline SVG)
- Animated alert ticker

### Mock Controls (Local State Only)
- Pause/Resume agent
- Assign task
- Escalate incident
- All actions update local UI state and append activity logs (no backend)

## Tech
- [Vite](https://vitejs.dev/)
- Vanilla JS + CSS

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

## Screenshots

> Add your captured images to `docs/screenshots/` and update paths below.

- Dashboard overview: `docs/screenshots/dashboard-overview.png`
- Selected agent detail view: `docs/screenshots/agent-detail.png`
- Office map with stations: `docs/screenshots/office-map.png`

Example markdown:

```md
![Dashboard overview](docs/screenshots/dashboard-overview.png)
![Agent detail](docs/screenshots/agent-detail.png)
![Office map](docs/screenshots/office-map.png)
```

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
