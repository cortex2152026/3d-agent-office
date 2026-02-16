const STORAGE_KEY = 'ruinscape-dashboard-state-v1';

const defaults = {
  selectedId: 'atlas',
  filter: 'all',
  search: '',
  sortByLoad: false,
  pausedIds: [],
  idleThresholds: {
    softMinutes: 5,
    hardMinutes: 15,
  },
};

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...defaults,
      ...parsed,
      pausedIds: Array.isArray(parsed.pausedIds) ? parsed.pausedIds : [],
      idleThresholds: {
        ...defaults.idleThresholds,
        ...(parsed.idleThresholds || {}),
      },
      showHelp: false,
      toasts: [],
      lastSelectionAt: Date.now(),
    };
  } catch {
    return {
      ...defaults,
      showHelp: false,
      toasts: [],
      lastSelectionAt: Date.now(),
    };
  }
}

export function persistState(state) {
  const payload = {
    selectedId: state.selectedId,
    filter: state.filter,
    search: state.search,
    sortByLoad: state.sortByLoad,
    pausedIds: [...state.pausedIds],
    idleThresholds: {
      softMinutes: state.idleThresholds.softMinutes,
      hardMinutes: state.idleThresholds.hardMinutes,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function statusOrderValue(status) {
  const order = ['online', 'busy', 'error', 'offline'];
  return order.indexOf(status);
}

export function metricLabel(value, suffix = '') {
  if (value === 0 && suffix === 'ms') return 'offline';
  return `${value}${suffix}`;
}

export function nowTimeString() {
  return new Date().toISOString().slice(11, 19);
}
