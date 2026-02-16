import './style.css';
import { agents, incidents, jobQueue, alerts, throughput, timelineEvents } from './data';
import { loadState, nowTimeString, persistState, statusOrderValue } from './state';
import { renderApp } from './ui';

const app = document.querySelector('#app');
const state = loadState();
state.pausedIds = new Set(state.pausedIds);

const MS_MINUTE = 60000;
const MS_SECOND = 1000;

function getSelectedAgent() {
  return agents.find((agent) => agent.id === state.selectedId) ?? agents[0];
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19);
}

function deriveAgentPresence(agent, thresholds, now) {
  const lastActivityAt = now - agent.lastActivityOffsetMin * MS_MINUTE;
  const lastHeartbeatAt = now - agent.lastHeartbeatOffsetSec * MS_SECOND;
  const heartbeatAgeMs = now - lastHeartbeatAt;
  const heartbeatIntervalMs = agent.heartbeatIntervalSec * MS_SECOND;
  const nextPingMs = heartbeatIntervalMs - (heartbeatAgeMs % heartbeatIntervalMs);
  const idleAgeMs = now - lastActivityAt;
  const softMs = thresholds.softMinutes * MS_MINUTE;
  const hardMs = thresholds.hardMinutes * MS_MINUTE;
  const idleState = idleAgeMs >= hardMs ? 'hard' : idleAgeMs >= softMs ? 'soft' : 'active';
  const presencePct = Math.max(0, Math.min(1, 1 - idleAgeMs / hardMs));

  return {
    ...agent,
    lastActivityAt,
    lastActivityLabel: formatTime(lastActivityAt),
    idleAgeLabel: formatDuration(idleAgeMs),
    idleState,
    lastHeartbeatAt,
    lastHeartbeatLabel: formatTime(lastHeartbeatAt),
    heartbeatAgeMs,
    heartbeatAgeLabel: formatDuration(heartbeatAgeMs),
    nextPingLabel: formatDuration(nextPingMs),
    presencePct,
  };
}

function filteredAgents() {
  return agents
    .filter((agent) => (state.filter === 'all' ? true : agent.status === state.filter))
    .filter((agent) => agent.name.toLowerCase().includes(state.search.toLowerCase().trim()))
    .sort((a, b) => {
      if (state.sortByLoad) return b.load - a.load;
      return statusOrderValue(a.status) - statusOrderValue(b.status);
    });
}

function addToast(text) {
  state.toasts = [text, ...state.toasts].slice(0, 3);
  setTimeout(() => {
    state.toasts = state.toasts.filter((toast) => toast !== text);
    render();
  }, 2600);
}

function prependLog(agentId, entry) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return;
  agent.logs = [entry, ...agent.logs].slice(0, 6);
}

function addTimeline(type, text) {
  timelineEvents.unshift({ ts: nowTimeString(), type, text });
  timelineEvents.splice(8);
}

function cycleFilter() {
  const order = ['all', 'online', 'busy', 'error', 'offline'];
  const idx = order.indexOf(state.filter);
  state.filter = order[(idx + 1) % order.length];
}

function computeKpis(agentViews, idleAgents, hardIdleAgents) {
  const activeJobs = jobQueue.length;
  const busyAgents = agents.filter((agent) => agent.status === 'busy' || agent.status === 'error').length;
  const available = agents.filter((agent) => agent.status !== 'offline');
  const avgLatency = Math.round(available.reduce((sum, agent) => sum + agent.latency, 0) / Math.max(available.length, 1));
  const criticalIncidents = incidents.filter((incident) => incident.severity === 'high').length;
  const offlineAgents = agentViews.filter((agent) => agent.status === 'offline').length;
  const allLive = idleAgents.length === 0 && offlineAgents === 0;

  return {
    uptime: '99.94%',
    activeJobs,
    busyAgents,
    avgLatency,
    incidents: incidents.length,
    criticalIncidents,
    allLive,
    allLiveDetail: allLive
      ? 'Heartbeat lanes stable'
      : `${hardIdleAgents.length} hard idle · ${idleAgents.length} idle · ${offlineAgents} offline`,
  };
}

function selectAgent(agentId) {
  if (state.selectedId === agentId) return;
  state.selectedId = agentId;
  state.lastSelectionAt = Date.now();
}

function render() {
  const now = Date.now();
  const list = filteredAgents();
  if (!list.some((agent) => agent.id === state.selectedId)) {
    state.selectedId = list[0]?.id ?? agents[0].id;
  }

  const agentViews = agents.map((agent) => deriveAgentPresence(agent, state.idleThresholds, now));
  const agentListViews = list.map((agent) => agentViews.find((view) => view.id === agent.id));
  const selectedView = agentViews.find((agent) => agent.id === state.selectedId) ?? agentViews[0];
  const idleAgents = agentViews.filter((agent) => agent.idleState !== 'active');
  const hardIdleAgents = idleAgents.filter((agent) => agent.idleState === 'hard');
  const idleAlerts = idleAgents.map((agent) =>
    `${agent.lastActivityLabel} UTC — ${agent.name} idle ${agent.idleAgeLabel} (${agent.idleState})`
  );
  const alertMessages = idleAlerts.length ? [...idleAlerts, ...alerts] : alerts;
  const heartbeatTimeline = [...agentViews]
    .sort((a, b) => b.lastHeartbeatAt - a.lastHeartbeatAt)
    .map((agent) => ({
      ts: agent.lastHeartbeatLabel,
      agent: agent.name,
      age: agent.heartbeatAgeLabel,
      phase: agent.heartbeatPhase,
      idleState: agent.idleState,
    }));

  renderApp({
    app,
    state,
    selected: selectedView,
    agentList: agentListViews,
    agents: agentViews,
    incidents,
    jobQueue,
    alerts: alertMessages,
    throughput,
    timelineEvents,
    heartbeatTimeline,
    idleStatus: {
      hasIdle: idleAgents.length > 0,
      hasHardIdle: hardIdleAgents.length > 0,
      count: idleAgents.length,
      hardCount: hardIdleAgents.length,
    },
    kpis: computeKpis(agentViews, idleAgents, hardIdleAgents),
  });

  bindEvents();
  persistState(state);
}

function bindEvents() {
  document.querySelectorAll('[data-agent-id]').forEach((el) => {
    el.addEventListener('click', () => {
      selectAgent(el.dataset.agentId);
      render();
    });
  });

  document.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      state.filter = el.dataset.filter;
      render();
    });
  });

  document.querySelector('#searchInput')?.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
  });

  document.querySelector('#sortBtn')?.addEventListener('click', () => {
    state.sortByLoad = !state.sortByLoad;
    addToast(`Sort ${state.sortByLoad ? 'enabled' : 'disabled'}: load`);
    render();
  });

  document.querySelector('#softThreshold')?.addEventListener('change', (event) => {
    const value = Math.max(1, Number(event.target.value || 0));
    state.idleThresholds.softMinutes = value;
    if (state.idleThresholds.hardMinutes <= value) {
      state.idleThresholds.hardMinutes = value + 1;
    }
    addToast(`Idle soft threshold: ${state.idleThresholds.softMinutes}m`);
    render();
  });

  document.querySelector('#hardThreshold')?.addEventListener('change', (event) => {
    const value = Math.max(2, Number(event.target.value || 0));
    state.idleThresholds.hardMinutes = value;
    if (state.idleThresholds.softMinutes >= value) {
      state.idleThresholds.softMinutes = Math.max(1, value - 1);
    }
    addToast(`Idle hard threshold: ${state.idleThresholds.hardMinutes}m`);
    render();
  });

  document.querySelector('#pauseBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    if (state.pausedIds.has(selected.id)) {
      state.pausedIds.delete(selected.id);
      selected.status = selected.status === 'offline' ? 'offline' : 'online';
      prependLog(selected.id, `Manual resume issued at ${nowTimeString()} UTC`);
      addTimeline('system', `${selected.name} resumed by command console`);
      addToast(`${selected.name} resumed`);
    } else {
      state.pausedIds.add(selected.id);
      if (selected.status !== 'offline') selected.status = 'busy';
      prependLog(selected.id, `Manual pause issued at ${nowTimeString()} UTC`);
      addTimeline('system', `${selected.name} paused for controlled intervention`);
      addToast(`${selected.name} paused`);
    }
    render();
  });

  document.querySelector('#assignBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    selected.task = 'Assigned: Investigate synthetic workload drift';
    selected.queueDepth += 1;
    selected.load = Math.min(99, selected.load + 6);
    selected.latency = Math.max(10, selected.latency + 5);
    selected.latencyHistory = [...selected.latencyHistory.slice(1), selected.latency];
    prependLog(selected.id, 'Task assigned by supervisor console');
    addTimeline('review', `${selected.name} received assignment: synthetic workload drift`);
    addToast(`Assignment sent to ${selected.name}`);
    render();
  });

  document.querySelector('#nudgeBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    selected.lastActivityOffsetMin = Math.max(0.6, selected.lastActivityOffsetMin - 2);
    selected.lastHeartbeatOffsetSec = Math.max(12, selected.lastHeartbeatOffsetSec - 20);
    prependLog(selected.id, `Nudge ping sent at ${nowTimeString()} UTC`);
    addTimeline('system', `${selected.name} nudged by ops console`);
    addToast(`Nudge signal sent to ${selected.name}`);
    render();
  });

  document.querySelector('#restartBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    selected.task = 'Restarting runbook automation';
    selected.status = 'busy';
    selected.lastActivityOffsetMin = 0.8;
    selected.lastHeartbeatOffsetSec = 15;
    prependLog(selected.id, `Restart cycle initiated at ${nowTimeString()} UTC`);
    addTimeline('deploy', `${selected.name} run restarted under supervision`);
    addToast(`Restart triggered for ${selected.name}`);
    render();
  });

  document.querySelector('#escalateBtn')?.addEventListener('click', () => {
    const selected = getSelectedAgent();
    const id = `INC-${Math.floor(Math.random() * 200 + 900)}`;
    incidents.unshift({
      id,
      severity: 'high',
      summary: `${selected.name} escalation requested from detail panel`,
      owner: selected.name,
      timestamp: nowTimeString(),
    });
    incidents.splice(4);
    prependLog(selected.id, 'Incident escalated to command lane');
    addTimeline('incident', `${id} escalated by ${selected.name}`);
    addToast(`Escalation submitted: ${id}`);
    render();
  });

  document.querySelector('#helpBtn')?.addEventListener('click', () => {
    state.showHelp = true;
    render();
  });

  document.querySelector('#closeHelpBtn')?.addEventListener('click', () => {
    state.showHelp = false;
    render();
  });

  document.querySelector('#helpModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'helpModalBackdrop') {
      state.showHelp = false;
      render();
    }
  });
}

window.addEventListener('keydown', (event) => {
  if (event.key === '/') {
    event.preventDefault();
    document.querySelector('#searchInput')?.focus();
    return;
  }

  if (event.key.toLowerCase() === 'f') {
    cycleFilter();
    addToast(`Filter: ${state.filter}`);
    render();
    return;
  }

  if (event.key.toLowerCase() === 's') {
    state.sortByLoad = !state.sortByLoad;
    addToast(`Sort ${state.sortByLoad ? 'enabled' : 'disabled'}: load`);
    render();
    return;
  }

  if (event.key === '?') {
    state.showHelp = !state.showHelp;
    render();
    return;
  }

  if (event.key === 'Escape' && state.showHelp) {
    state.showHelp = false;
    render();
  }
});

render();
