import { metricLabel } from './state';

function statusClass(status) {
  return `status status--${status}`;
}

function sparklinePath(points, width, height, padding = 6) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const step = width / Math.max(points.length - 1, 1);

  return points
    .map((point, i) => {
      const x = i * step;
      const y = height - ((point - min) / range) * (height - padding * 2) - padding;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function kpiBlock(label, value, sub = '') {
  return `<article class="kpi"><p>${label}</p><strong>${value}</strong>${sub ? `<small>${sub}</small>` : ''}</article>`;
}

export function renderApp({ app, state, selected, agentList, agents, incidents, jobQueue, alerts, throughput, timelineEvents, heartbeatTimeline, idleStatus, kpis }) {
  const throughputPath = sparklinePath(throughput, 320, 92);
  const latencyPath = sparklinePath(selected.latencyHistory, 260, 70, 4);

  app.innerHTML = `
    <main class="dashboard">
      <header class="command-bar glass">
        <div class="brand-block">
          <p class="eyebrow">RUINSCAPE OPERATIONS GRID</p>
          <h1>2D Agent Operations Dashboard</h1>
        </div>
        <section class="kpis" aria-label="Global KPIs">
          ${kpiBlock('All agents live?', kpis.allLive ? 'Yes' : 'No', kpis.allLiveDetail)}
          ${kpiBlock('Uptime', kpis.uptime, 'stability window')}
          ${kpiBlock('Active Jobs', kpis.activeJobs, `${kpis.busyAgents} agents engaged`) }
          ${kpiBlock('Avg Latency', `${kpis.avgLatency}ms`, 'online + busy agents')}
          ${kpiBlock('Incidents', kpis.incidents, `${kpis.criticalIncidents} high severity`) }
        </section>
      </header>

      ${idleStatus.hasIdle ? `
        <section class="idle-banner ${idleStatus.hasHardIdle ? 'is-critical' : ''}">
          <strong>Idle Detected</strong>
          <span>${idleStatus.hardCount} hard idle · ${idleStatus.count} agents beyond threshold</span>
          <span class="idle-banner__meta">Review presence bars or nudge from details panel.</span>
        </section>
      ` : ''}

      <header class="topbar glass">
        <div class="ticker" aria-label="alerts ticker">
          <div class="ticker-track">${alerts.map((a) => `<span>${a}</span>`).join('')}</div>
        </div>
        <button id="helpBtn" class="help-btn" aria-haspopup="dialog">⌨ Shortcuts</button>
      </header>

      <section class="layout">
        <aside class="panel glass sidebar">
          <h2>Agents</h2>
          <div class="controls-row">
            ${['all', 'online', 'busy', 'error', 'offline']
              .map((f) => `<button class="chip ${state.filter === f ? 'is-active' : ''}" data-filter="${f}">${f}</button>`)
              .join('')}
          </div>
          <input class="search" id="searchInput" value="${state.search}" placeholder="Search agent name... (/)">
          <button class="sort-btn ${state.sortByLoad ? 'is-active' : ''}" id="sortBtn">Sort by load ${state.sortByLoad ? '↓' : ''} (S)</button>
          <div class="idle-settings">
            <h3>Idle thresholds</h3>
            <div class="threshold-row">
              <label>Soft (min)
                <input type="number" id="softThreshold" min="1" max="60" value="${state.idleThresholds.softMinutes}">
              </label>
              <label>Hard (min)
                <input type="number" id="hardThreshold" min="2" max="120" value="${state.idleThresholds.hardMinutes}">
              </label>
            </div>
            <p>Soft idle triggers monitoring, hard idle escalates alerts.</p>
          </div>
          <ul class="agent-list">
            ${agentList
              .map(
                (agent) => `
                  <li>
                    <button class="agent-item ${agent.id === selected.id ? 'is-selected' : ''} idle-${agent.idleState}" data-agent-id="${agent.id}">
                      <div>
                        <strong>${agent.name}</strong>
                        <p>${agent.role}</p>
                        <div class="presence-meta">
                          <span>Last ${agent.lastActivityLabel} UTC</span>
                          <span>HB ${agent.heartbeatAgeLabel}</span>
                          <span>Phase ${agent.heartbeatPhase}</span>
                          <span>Next ${agent.nextPingLabel}</span>
                        </div>
                        <div class="presence-bar">
                          <span style="width:${Math.round(agent.presencePct * 100)}%"></span>
                        </div>
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
          <h2>Ruin Office Sector</h2>
          <div class="office-map" id="officeMap">
            <div class="floor-grid"></div>
            <div class="scanline-layer"></div>
            <div class="dust-layer"></div>
            <svg class="ruinscape" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
              <g class="walls">
                <path d="M40 72 L380 52 L420 78 L90 102 Z" />
                <path d="M600 48 L960 72 L940 102 L572 78 Z" />
                <path d="M70 320 L350 284 L365 318 L88 352 Z" />
              </g>
              <g class="columns">
                <rect x="170" y="110" width="26" height="160" rx="6" />
                <rect x="480" y="92" width="28" height="176" rx="6" />
                <rect x="775" y="108" width="24" height="158" rx="6" />
              </g>
              <g class="debris">
                <polygon points="424,288 466,301 447,329 408,313" />
                <polygon points="628,277 672,291 644,322 609,308" />
                <polygon points="258,246 291,258 281,280 247,271" />
              </g>
              <g class="cables">
                <path d="M124 212 C 290 188, 316 336, 534 294" />
                <path d="M456 122 C 592 110, 654 216, 844 190" />
              </g>
              <g class="terminals">
                <rect x="228" y="208" width="48" height="24" rx="4" />
                <rect x="548" y="176" width="44" height="22" rx="4" />
                <rect x="818" y="216" width="42" height="23" rx="4" />
              </g>
            </svg>
            <div class="alert-pulse ${selected.status === 'error' ? 'is-hot' : ''}"></div>
            ${agents
              .map(
                (agent) => `
                  <button
                    class="desk ${agent.id === selected.id ? 'is-selected' : ''} idle-${agent.idleState}"
                    style="left:${agent.position.x}%;top:${agent.position.y}%;"
                    data-agent-id="${agent.id}"
                    aria-label="${agent.name} station"
                  >
                    <span class="desk-name">${agent.name.replace('Agent ', '')}</span>
                    <span class="${statusClass(agent.status)}">${agent.status}</span>
                  </button>`
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
                <path d="${throughputPath}" />
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

        <aside class="panel glass details detail-transition">
          <h2>Agent Details</h2>
          <div class="detail-card" data-key="${selected.id}-${state.lastSelectionAt}">
            <h3>${selected.name}</h3>
            <p>${selected.role}</p>
            <span class="${statusClass(selected.status)}">${selected.status}</span>
            <dl>
              <div><dt>Current task</dt><dd>${selected.task}</dd></div>
              <div><dt>Latency</dt><dd>${metricLabel(selected.latency, 'ms')}</dd></div>
              <div><dt>Queue depth</dt><dd>${selected.queueDepth}</dd></div>
              <div><dt>Success rate</dt><dd>${selected.successRate}%</dd></div>
            </dl>
            <div class="presence-card idle-${selected.idleState}">
              <div>
                <h4>Presence</h4>
                <p>Last activity: ${selected.lastActivityLabel} UTC (${selected.idleAgeLabel} ago)</p>
              </div>
              <div class="presence-bar">
                <span style="width:${Math.round(selected.presencePct * 100)}%"></span>
              </div>
              <div class="presence-grid">
                <div><span>Heartbeat age</span><strong>${selected.heartbeatAgeLabel}</strong></div>
                <div><span>Phase</span><strong>${selected.heartbeatPhase}</strong></div>
                <div><span>Next ping ETA</span><strong>${selected.nextPingLabel}</strong></div>
              </div>
            </div>
            <div class="mini-trend">
              <span>Latency trend</span>
              <svg viewBox="0 0 260 70" role="img" aria-label="${selected.name} latency trend">
                <path d="${latencyPath}" />
              </svg>
            </div>
          </div>

          <div class="action-row">
            <button id="pauseBtn">${state.pausedIds.has(selected.id) ? 'Resume agent' : 'Pause agent'}</button>
            <button id="assignBtn">Assign task</button>
            <button id="nudgeBtn">Nudge agent</button>
            <button id="restartBtn">Restart run</button>
            <button id="escalateBtn" class="danger">Escalate incident</button>
          </div>

          <article class="activity-log">
            <h3>Ops log</h3>
            <ul>${selected.logs.map((log) => `<li>${log}</li>`).join('')}</ul>
          </article>
        </aside>
      </section>

      <section class="panel glass timeline-panel">
        <h2>Incident / Event Timeline</h2>
        <ul>
          ${timelineEvents
            .map((event) => `<li><time>${event.ts}</time><span class="event-tag event-tag--${event.type}">${event.type}</span><p>${event.text}</p></li>`)
            .join('')}
        </ul>
      </section>

      <section class="panel glass timeline-panel heartbeat-panel">
        <h2>Heartbeat Timeline</h2>
        <ul>
          ${heartbeatTimeline
            .map(
              (event) => `
                <li>
                  <time>${event.ts}</time>
                  <span class="event-tag event-tag--${event.idleState === 'hard' ? 'incident' : event.idleState === 'soft' ? 'review' : 'system'}">${event.phase}</span>
                  <p>${event.agent} • heartbeat age ${event.age}</p>
                </li>`
            )
            .join('')}
        </ul>
      </section>

      <div class="toast-stack">
        ${state.toasts.map((toast) => `<div class="toast">${toast}</div>`).join('')}
      </div>

      ${state.showHelp ? `
        <div class="modal-backdrop" id="helpModalBackdrop">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="shortcutTitle">
            <h3 id="shortcutTitle">Keyboard Shortcuts</h3>
            <ul>
              <li><kbd>/</kbd> Focus search</li>
              <li><kbd>F</kbd> Cycle filter (all → online → busy → error → offline)</li>
              <li><kbd>S</kbd> Toggle sort by load</li>
              <li><kbd>?</kbd> Open/close this help</li>
              <li><kbd>Esc</kbd> Close modal</li>
            </ul>
            <button id="closeHelpBtn">Close</button>
          </div>
        </div>
      ` : ''}
    </main>
  `;
}
