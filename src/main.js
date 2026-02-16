const app = document.querySelector('#app');

const agents = [
  {
    id: 'atlas',
    name: 'Agent Atlas',
    role: 'Routing Orchestrator',
    status: 'online',
    task: 'Balancing inference shards',
    latency: 42,
    queueDepth: 5,
    successRate: 98.9,
    load: 44,
    position: { x: 12, y: 20 },
    logs: ['Heartbeat stable', 'Rerouted APAC traffic', 'No failed handoffs in last hour'],
  },
  {
    id: 'echo',
    name: 'Agent Echo',
    role: 'Comms QA Monitor',
    status: 'busy',
    task: 'Auditing escalation transcript',
    latency: 89,
    queueDepth: 11,
    successRate: 96.4,
    load: 78,
    position: { x: 33, y: 24 },
    logs: ['Flagged tone mismatch in incident #847', 'Queued compliance summary', 'Manual review in progress'],
  },
  {
    id: 'forge',
    name: 'Agent Forge',
    role: 'Build & Infra',
    status: 'online',
    task: 'Canary deploy validation',
    latency: 53,
    queueDepth: 7,
    successRate: 97.3,
    load: 61,
    position: { x: 55, y: 22 },
    logs: ['Rebuilt worker image v2.14', 'Watching rollback guardrail', 'CPU saturation nominal'],
  },
  {
    id: 'nova',
    name: 'Agent Nova',
    role: 'Research Analyst',
    status: 'offline',
    task: 'Awaiting wake schedule',
    latency: 0,
    queueDepth: 0,
    successRate: 99.2,
    load: 0,
    position: { x: 74, y: 20 },
    logs: ['Last seen 11m ago', 'Nightly memory archive complete', 'No active assignments'],
  },
  {
    id: 'rift',
    name: 'Agent Rift',
    role: 'Threat Sentinel',
    status: 'error',
    task: 'Packet anomaly triage',
    latency: 221,
    queueDepth: 19,
    successRate: 88.7,
    load: 91,
    position: { x: 18, y: 52 },
    logs: ['Socket timeout on node 4', 'Retry budget exceeded', 'Escalation recommended'],
  },
  {
    id: 'lumen',
    name: 'Agent Lumen',
    role: 'UX Simulation',
    status: 'busy',
    task: 'Running conversion heatmap',
    latency: 71,
    queueDepth: 9,
    successRate: 95.1,
    load: 73,
    position: { x: 38, y: 56 },
    logs: ['Generated 3 prototype variants', 'A/B sweep 62% complete', 'Insights queued for review'],
  },
  {
    id: 'quill',
    name: 'Agent Quill',
    role: 'Knowledge Scribe',
    status: 'online',
    task: 'Summarizing overnight changes',
    latency: 34,
    queueDepth: 3,
    successRate: 99.1,
    load: 31,
    position: { x: 58, y: 54 },
    logs: ['Generated executive digest', 'Tagged 14 policy updates', 'Awaiting publish approval'],
  },
  {
    id: 'warden',
    name: 'Agent Warden',
    role: 'Access Governor',
    status: 'busy',
    task: 'Rotating expiring keys',
    latency: 64,
    queueDepth: 8,
    successRate: 97.8,
    load: 66,
    position: { x: 78, y: 53 },
    logs: ['Revoked stale token set', 'MFA challenge refresh sent', 'Privilege drift scan running'],
  },
];

const incidents = [
  { id: 'INC-847', severity: 'high', summary: 'Rift packet parser timeout cascade', owner: 'Agent Rift' },
  { id: 'INC-842', severity: 'medium', summary: 'Echo flagged escalation sentiment mismatch', owner: 'Agent Echo' },
  { id: 'INC-836', severity: 'low', summary: 'Forge canary metrics drift under load', owner: 'Agent Forge' },
];

const jobQueue = [
  { id: 'JOB-9012', agent: 'Agent Atlas', type: 'Route rebalance', eta: '00:38', priority: 'high' },
  { id: 'JOB-9013', agent: 'Agent Lumen', type: 'UX cohort simulation', eta: '01:12', priority: 'medium' },
  { id: 'JOB-9014', agent: 'Agent Warden', type: 'Credential rotation', eta: '00:46', priority: 'high' },
  { id: 'JOB-9015', agent: 'Agent Quill', type: 'Knowledge digest publish', eta: '00:18', priority: 'low' },
];

const alerts = [
  '07:14 UTC — Rift queue depth exceeded 18 tasks',
  '07:11 UTC — Forge canary checks 94% complete',
  '07:09 UTC — Atlas rerouted EU requests to backup fabric',
  '07:06 UTC — Warden completed key revocation sweep',
  '07:03 UTC — Echo opened manual QA review lane',
];

const throughput = [54, 58, 63, 59, 66, 72, 68, 75, 79, 74, 82, 86, 80, 88, 92, 89];

const state = {
  selectedId: agents[0].id,
  filter: 'all',
  search: '',
  sortByLoad: false,
  paused: new Set(),
};

const statusOrder = ['online', 'busy', 'error', 'offline'];

function statusClass(status) {
  return `status status--${status}`;
}

function metricLabel(value, suffix = '') {
  if (value === 0 && suffix === 'ms') return 'offline';
  return `${value}${suffix}`;
}

function getSelectedAgent() {
  return agents.find((agent) => agent.id === state.selectedId) ?? agents[0];
}

function filteredAgents() {
  return agents
    .filter((agent) => (state.filter === 'all' ? true : agent.status === state.filter))
    .filter((agent) => agent.name.toLowerCase().includes(state.search.toLowerCase().trim()))
    .sort((a, b) => {
      if (state.sortByLoad) return b.load - a.load;
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });
}

function sparklinePath(points, width, height) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const step = width / (points.length - 1);

  return points
    .map((point, i) => {
      const x = i * step;
      const y = height - ((point - min) / range) * (height - 8) - 4;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function render() {
  const list = filteredAgents();
  if (!list.some((agent) => agent.id === state.selectedId)) {
    state.selectedId = list[0]?.id ?? agents[0].id;
  }

  const selected = getSelectedAgent();
  const sparkPath = sparklinePath(throughput, 320, 92);

  app.innerHTML = `
    <main class="dashboard">
      <header class="topbar glass">
        <div>
          <p class="eyebrow">RUINSCAPE OPERATIONS GRID</p>
          <h1>2D Agent Operations Dashboard</h1>
        </div>
        <div class="ticker" aria-label="alerts ticker">
          <div class="ticker-track">${alerts.map((a) => `<span>${a}</span>`).join('')}</div>
        </div>
      </header>

      <section class="layout">
        <aside class="panel glass sidebar">
          <h2>Agents</h2>
          <div class="controls-row">
            ${['all', 'online', 'busy', 'error'].map((f) => `<button class="chip ${state.filter === f ? 'is-active' : ''}" data-filter="${f}">${f}</button>`).join('')}
          </div>
          <input class="search" id="searchInput" value="${state.search}" placeholder="Search agent name..." />
          <button class="sort-btn ${state.sortByLoad ? 'is-active' : ''}" id="sortBtn">Sort by load ${state.sortByLoad ? '↓' : ''}</button>

          <ul class="agent-list">
            ${list
              .map(
                (agent) => `
                <li>
                  <button class="agent-item ${agent.id === selected.id ? 'is-selected' : ''}" data-agent-id="${agent.id}">
                    <div>
                      <strong>${agent.name}</strong>
                      <p>${agent.role}</p>
                    </div>
                    <div class="agent-mini">
                      <span class="${statusClass(agent.status)}">${agent.status}</span>
                      <small>${agent.load}%</small>
                    </div>
                  </button>
                </li>`
              )
              .join('')}
          </ul>
        </aside>

        <section class="panel glass office-map-wrap">
          <h2>Office Map</h2>
          <div class="office-map" id="officeMap">
            <div class="ruin-overlay"></div>
            ${agents
              .map(
                (agent) => `
                <button
                  class="desk ${agent.id === selected.id ? 'is-selected' : ''}"
                  style="left:${agent.position.x}%;top:${agent.position.y}%;"
                  data-agent-id="${agent.id}"
                  aria-label="${agent.name} station"
                >
                  <span class="desk-name">${agent.name.replace('Agent ', '')}</span>
                  <span class="${statusClass(agent.status)}">${agent.status}</span>
                </button>
              `
              )
              .join('')}
          </div>

          <section class="widgets-grid">
            <article class="widget">
              <h3>Active Incidents</h3>
              <ul>
                ${incidents
                  .map(
                    (incident) => `<li><span class="sev sev--${incident.severity}">${incident.severity}</span><strong>${incident.id}</strong> ${incident.summary}</li>`
                  )
                  .join('')}
              </ul>
            </article>

            <article class="widget">
              <h3>Throughput (jobs/min)</h3>
              <svg class="sparkline" viewBox="0 0 320 92" role="img" aria-label="Throughput sparkline">
                <path d="${sparkPath}" />
              </svg>
            </article>

            <article class="widget queue-widget">
              <h3>Job Queue</h3>
              <table>
                <thead><tr><th>ID</th><th>Agent</th><th>Type</th><th>ETA</th><th>P</th></tr></thead>
                <tbody>
                  ${jobQueue
                    .map(
                      (job) => `<tr><td>${job.id}</td><td>${job.agent.split(' ')[1]}</td><td>${job.type}</td><td>${job.eta}</td><td>${job.priority[0].toUpperCase()}</td></tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </article>
          </section>
        </section>

        <aside class="panel glass details">
          <h2>Agent Details</h2>
          <div class="detail-card">
            <h3>${selected.name}</h3>
            <p>${selected.role}</p>
            <span class="${statusClass(selected.status)}">${selected.status}</span>
            <dl>
              <div><dt>Current task</dt><dd>${selected.task}</dd></div>
              <div><dt>Latency</dt><dd>${metricLabel(selected.latency, 'ms')}</dd></div>
              <div><dt>Queue depth</dt><dd>${selected.queueDepth}</dd></div>
              <div><dt>Success rate</dt><dd>${selected.successRate}%</dd></div>
            </dl>
          </div>

          <div class="action-row">
            <button id="pauseBtn">${state.paused.has(selected.id) ? 'Resume agent' : 'Pause agent'}</button>
            <button id="assignBtn">Assign task</button>
            <button id="escalateBtn" class="danger">Escalate incident</button>
          </div>

          <article class="activity-log">
            <h3>Ops log</h3>
            <ul id="logsList">
              ${selected.logs.map((log) => `<li>${log}</li>`).join('')}
            </ul>
          </article>
        </aside>
      </section>
    </main>
  `;

  bindEvents();
}

function prependLog(agentId, entry) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return;
  agent.logs = [entry, ...agent.logs].slice(0, 6);
}

function bindEvents() {
  document.querySelectorAll('[data-agent-id]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedId = el.dataset.agentId;
      render();
    });
  });

  document.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      state.filter = el.dataset.filter;
      render();
    });
  });

  const searchInput = document.querySelector('#searchInput');
  searchInput?.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
  });

  document.querySelector('#sortBtn')?.addEventListener('click', () => {
    state.sortByLoad = !state.sortByLoad;
    render();
  });

  document.querySelector('#pauseBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    if (state.paused.has(selected.id)) {
      state.paused.delete(selected.id);
      selected.status = selected.status === 'offline' ? 'offline' : 'online';
      prependLog(selected.id, `Manual resume issued at ${new Date().toISOString().slice(11, 19)} UTC`);
    } else {
      state.paused.add(selected.id);
      if (selected.status !== 'offline') selected.status = 'busy';
      prependLog(selected.id, `Manual pause issued at ${new Date().toISOString().slice(11, 19)} UTC`);
    }
    render();
  });

  document.querySelector('#assignBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    selected.task = 'Assigned: Investigate synthetic workload drift';
    selected.queueDepth += 1;
    selected.load = Math.min(99, selected.load + 6);
    prependLog(selected.id, 'Task assigned by supervisor console');
    render();
  });

  document.querySelector('#escalateBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    incidents.unshift({
      id: `INC-${Math.floor(Math.random() * 200 + 900)}`,
      severity: 'high',
      summary: `${selected.name} escalation requested from detail panel`,
      owner: selected.name,
    });
    incidents.splice(4);
    prependLog(selected.id, 'Incident escalated to command lane');
    render();
  });
}

render();
