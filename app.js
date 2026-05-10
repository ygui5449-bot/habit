/* ==================== DATA LAYER ==================== */
const STORAGE_KEYS = {
  modules: 'ht_modules',
  records: 'ht_records',
  projects: 'ht_projects',
  activeTimer: 'ht_active_timer'
};

const DEFAULT_MODULES = [
  { id: 'english', name: '学英语', icon: '📖', color: '#4A90D9', isPreset: true },
  { id: 'exercise', name: '运动', icon: '🏃', color: '#4CAF50', isPreset: true },
  { id: 'reading', name: '读书', icon: '📚', color: '#9C27B0', isPreset: true },
  { id: 'experiment', name: '做实验', icon: '🔬', color: '#FF9800', isPreset: true },
  { id: 'study', name: '学习', icon: '✏️', color: '#3F51B5', isPreset: true },
  { id: 'work', name: '工作', icon: '💼', color: '#F44336', isPreset: true },
  { id: 'rest', name: '休息', icon: '🛌', color: '#8BC34A', isPreset: true, instant: true, instantMin: 5 },
  { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#E91E63', isPreset: true, instant: true, instantMin: 30 }
];

const ICON_OPTIONS = ['📖', '🏃', '📚', '🔬', '✏️', '💼', '🎵', '🎮', '🍳', '🧘', '💻', '🎨', '📝', '🌍', '🧪', '🏠', '🛒', '🐱', '🌱', '✈️'];
const COLOR_OPTIONS = ['#4A90D9', '#4CAF50', '#9C27B0', '#FF9800', '#3F51B5', '#F44336', '#00BCD4', '#FF5722', '#607D8B', '#795548', '#E91E63', '#009688'];

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch (e) {
    return structuredClone(fallback);
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getModules() {
  var stored = loadData(STORAGE_KEYS.modules, null);
  if (stored === null) return structuredClone(DEFAULT_MODULES);

  // Merge any new preset modules that don't exist in stored data yet
  var storedIds = {};
  stored.forEach(function(m) { storedIds[m.id] = true; });
  var changed = false;
  DEFAULT_MODULES.forEach(function(dm) {
    if (!storedIds[dm.id]) {
      stored.push(structuredClone(dm));
      changed = true;
    }
  });
  // Also ensure instant fields exist on presets (migration)
  stored.forEach(function(m) {
    DEFAULT_MODULES.forEach(function(dm) {
      if (m.id === dm.id && dm.instant && !m.instant) {
        m.instant = dm.instant;
        m.instantMin = dm.instantMin;
        changed = true;
      }
    });
  });
  if (changed) saveData(STORAGE_KEYS.modules, stored);
  return stored;
}

function saveModules(modules) {
  saveData(STORAGE_KEYS.modules, modules);
  markDataChanged();
}

function getModuleById(id) {
  return getModules().find(function(m) { return m.id === id; });
}

function addModule(module) {
  var modules = getModules();
  module.id = 'custom_' + Date.now();
  module.isPreset = false;
  modules.push(module);
  saveModules(modules);
  return module;
}

function updateModule(id, updates) {
  var modules = getModules();
  var idx = modules.findIndex(function(m) { return m.id === id; });
  if (idx === -1) return;
  Object.assign(modules[idx], updates);
  saveModules(modules);
}

function deleteModule(id) {
  var modules = getModules();
  saveModules(modules.filter(function(m) { return m.id !== id; }));
}

function getRecords() {
  return loadData(STORAGE_KEYS.records, []);
}

function saveRecords(records) {
  saveData(STORAGE_KEYS.records, records);
  markDataChanged();
}

function addRecord(record) {
  var records = getRecords();
  record.id = 'rec_' + Date.now();
  record.note = record.note || '';
  record.createdAt = new Date().toISOString();
  records.unshift(record);
  saveRecords(records);
  return record;
}

function updateRecordNote(id, note) {
  var records = getRecords();
  var rec = records.find(function(r) { return r.id === id; });
  if (rec) { rec.note = note; saveRecords(records); }
}

function deleteRecord(id) {
  var records = getRecords();
  saveRecords(records.filter(function(r) { return r.id !== id; }));
}

function getTodayRecords() {
  var today = formatDateStr(new Date());
  return getRecords().filter(function(r) {
    return r.startTime && r.startTime.startsWith(today);
  });
}

function getRecordsInRange(fromDateStr, toDateStr) {
  return getRecords().filter(function(r) {
    var d = (r.startTime || '').substring(0, 10);
    return d >= fromDateStr && d <= toDateStr;
  });
}

function getProjects() {
  return loadData(STORAGE_KEYS.projects, []);
}

function saveProjects(projects) {
  saveData(STORAGE_KEYS.projects, projects);
  markDataChanged();
}

function addProject(project) {
  var projects = getProjects();
  project.id = 'proj_' + Date.now();
  project.status = 'active';
  project.milestones = project.milestones || [];
  project.createdAt = new Date().toISOString();
  projects.unshift(project);
  saveProjects(projects);
  return project;
}

function updateProject(id, updates) {
  var projects = getProjects();
  var idx = projects.findIndex(function(p) { return p.id === id; });
  if (idx === -1) return;
  Object.assign(projects[idx], updates);
  saveProjects(projects);
}

function deleteProject(id) {
  var projects = getProjects();
  saveProjects(projects.filter(function(p) { return p.id !== id; }));
}

function addMilestone(projectId, title) {
  var projects = getProjects();
  var p = projects.find(function(p) { return p.id === projectId; });
  if (!p) return;
  p.milestones.push({ id: 'ms_' + Date.now(), title: title, completed: false });
  saveProjects(projects);
}

function toggleMilestone(projectId, milestoneId) {
  var projects = getProjects();
  var p = projects.find(function(p) { return p.id === projectId; });
  if (!p) return;
  var ms = p.milestones.find(function(m) { return m.id === milestoneId; });
  if (ms) ms.completed = !ms.completed;
  saveProjects(projects);
}

function deleteMilestone(projectId, milestoneId) {
  var projects = getProjects();
  var p = projects.find(function(p) { return p.id === projectId; });
  if (!p) return;
  p.milestones = p.milestones.filter(function(m) { return m.id !== milestoneId; });
  saveProjects(projects);
}

function getProjectProgress(project) {
  if (!project.milestones || project.milestones.length === 0) return 0;
  var done = project.milestones.filter(function(m) { return m.completed; }).length;
  return Math.round((done / project.milestones.length) * 100);
}

/* ==================== DATA CHANGE TRACKING ==================== */
var _syncInProgress = false;
var _syncTimeout = null;
var _syncStatus = 'idle'; // idle | syncing | synced | error

function getMeta() {
  return loadData('ht_meta', { updatedAt: null });
}

function markDataChanged() {
  if (_syncInProgress) return;
  var meta = { updatedAt: new Date().toISOString() };
  saveData('ht_meta', meta);
  schedulePush();
}

/* ==================== GITHUB GIST SYNC ==================== */
function getSyncConfig() {
  return loadData('ht_sync', { token: '', gistId: '' });
}

function saveSyncConfig(cfg) {
  saveData('ht_sync', cfg);
}

function isSyncConfigured() {
  var c = getSyncConfig();
  return !!(c.token && c.gistId);
}

function updateSyncStatus(status) {
  _syncStatus = status;
  var el = document.getElementById('sync-status');
  if (!el) return;
  el.className = 'sync-status sync-' + status;
  var map = { idle: '', syncing: '同步中...', synced: '✓ 已同步', error: '⚠ 同步失败' };
  el.textContent = map[status] || '';
}

function schedulePush() {
  if (!isSyncConfigured()) return;
  if (_syncTimeout) clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(pushToGist, 2000);
}

function pushToGist() {
  var config = getSyncConfig();
  if (!config.token || !config.gistId) return;

  updateSyncStatus('syncing');
  var meta = getMeta();
  var payload = {
    version: 1,
    updatedAt: meta.updatedAt || new Date().toISOString(),
    modules: getModules(),
    records: getRecords(),
    projects: getProjects()
  };

  fetch('https://api.github.com/gists/' + config.gistId, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + config.token,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      description: '习惯追踪数据',
      files: {
        'habit-tracker-data.json': { content: JSON.stringify(payload) }
      }
    })
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    updateSyncStatus('synced');
  }).catch(function() {
    updateSyncStatus('error');
  });
}

function pullFromGist() {
  var config = getSyncConfig();
  if (!config.token || !config.gistId) return Promise.resolve(false);

  return fetch('https://api.github.com/gists/' + config.gistId, {
    headers: {
      'Authorization': 'Bearer ' + config.token,
      'Accept': 'application/vnd.github.v3+json'
    }
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function(gist) {
    var file = gist.files && gist.files['habit-tracker-data.json'];
    if (!file || !file.content) return false;
    var remote = JSON.parse(file.content);
    var localMeta = getMeta();

    if (!localMeta.updatedAt || new Date(remote.updatedAt) > new Date(localMeta.updatedAt)) {
      _syncInProgress = true;
      saveModules(remote.modules);
      saveRecords(remote.records);
      saveProjects(remote.projects);
      saveData('ht_meta', { updatedAt: remote.updatedAt });
      _syncInProgress = false;
      updateSyncStatus('synced');
      return true;
    }
    updateSyncStatus('synced');
    return false;
  }).catch(function() {
    updateSyncStatus('error');
    return false;
  });
}

function setupGistSync(token, gistId) {
  updateSyncStatus('syncing');

  // If user provided a Gist ID, connect directly
  if (gistId) {
    saveSyncConfig({ token: token, gistId: gistId });
    updateSyncStatus('synced');
    showToast('已连接 Gist ✓');
    renderSettingsTab();
    return pullFromGist().then(function(updated) {
      if (updated) { renderRecordTab(); renderCalendarTab(); showToast('数据已同步 ✓'); }
      else { showToast('未发现新数据，可能 Gist ID 不正确'); }
    });
  }

  // No Gist ID provided — search existing gists
  fetch('https://api.github.com/gists?per_page=100', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json'
    }
  }).then(function(res) {
    if (!res.ok) throw new Error('search failed');
    return res.json();
  }).then(function(gists) {
    var existing = gists.find(function(g) {
      return g.description === '习惯追踪数据' &&
        g.files && g.files['habit-tracker-data.json'];
    });
    if (existing) {
      saveSyncConfig({ token: token, gistId: existing.id });
      updateSyncStatus('synced');
      showToast('已连接现有同步数据 ✓');
      renderSettingsTab();
      return pullFromGist().then(function(updated) {
        if (updated) { renderRecordTab(); renderCalendarTab(); }
      });
    }
    return doCreateGist(token);
  }).catch(function() {
    // Search failed — create new gist and tell user
    return doCreateGist(token).then(function() {
      showToast('已创建新 Gist，请在另一台设备上用此 Gist ID 连接');
    });
  });
}

function doCreateGist(token) {
  var meta = getMeta();
  var payload = {
    version: 1,
    updatedAt: meta.updatedAt || new Date().toISOString(),
    modules: getModules(),
    records: getRecords(),
    projects: getProjects()
  };

  return fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      description: '习惯追踪数据',
      public: false,
      files: {
        'habit-tracker-data.json': { content: JSON.stringify(payload) }
      }
    })
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function(gist) {
    saveSyncConfig({ token: token, gistId: gist.id });
    updateSyncStatus('synced');
    showToast('GitHub 同步已连接 ✓');
    renderSettingsTab();
  }).catch(function() {
    updateSyncStatus('error');
    showToast('连接失败，请检查 Token（需要 gist 权限）');
  });
}

function disconnectSync() {
  saveSyncConfig({ token: '', gistId: '' });
  _syncStatus = 'idle';
  showToast('已断开 GitHub 同步');
  renderSettingsTab();
}

/* ==================== EXPORT / IMPORT ==================== */
function exportAllData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    modules: getModules(),
    records: getRecords(),
    projects: getProjects()
  };
}

function importAllData(jsonStr) {
  try {
    var data = JSON.parse(jsonStr);
    if (!data.version || !data.modules || !data.records || !data.projects) {
      throw new Error('Invalid data format');
    }
    // Merge modules: keep presets, add customs from import
    var existingModules = getModules();
    var mergedModules = existingModules.filter(function(m) { return m.isPreset; });
    var importCustoms = data.modules.filter(function(m) { return !m.isPreset; });
    var seen = {};
    mergedModules.forEach(function(m) { seen[m.id] = true; });
    importCustoms.forEach(function(m) {
      if (!seen[m.id]) { mergedModules.push(m); seen[m.id] = true; }
    });
    saveModules(mergedModules);
    saveRecords(data.records);
    saveProjects(data.projects);
    return true;
  } catch (e) {
    return false;
  }
}

/* ==================== APP STATE ==================== */
var state = {
  activeTab: 0,
  activeTimer: null,    // { moduleId, startTime }
  timerInterval: null,
  calendarWeekStart: getMonday(new Date()),
  statsRange: 'day'
};

// Restore active timer from storage
(function restoreTimer() {
  var saved = loadData(STORAGE_KEYS.activeTimer, null);
  if (saved) {
    state.activeTimer = saved;
  }
})();

/* ==================== HELPERS ==================== */
function formatDateStr(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function formatStatsShort(ms) {
  if (ms < 0) ms = 0;
  var totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return totalMin + 'm';
  var h = Math.floor(totalMin / 60);
  var m = totalMin % 60;
  return h + 'h' + (m > 0 ? ' ' + m + 'm' : '');
}

function formatDateShort(date) {
  return (date.getMonth() + 1) + '/' + date.getDate();
}

function getMonday(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTimeStr(date) {
  var h = String(date.getHours()).padStart(2, '0');
  var m = String(date.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  var totalSec = Math.floor(ms / 1000);
  var hours = Math.floor(totalSec / 3600);
  var minutes = Math.floor((totalSec % 3600) / 60);
  var seconds = totalSec % 60;
  if (hours > 0) {
    return hours + 'h ' + minutes + 'm';
  }
  if (minutes > 0) {
    return minutes + 'm ' + seconds + 's';
  }
  return seconds + 's';
}

function formatDurationHHMMSS(ms) {
  if (ms < 0) ms = 0;
  var totalSec = Math.floor(ms / 1000);
  var h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  var m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  var s = String(totalSec % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

function formatDateCN(dateStr) {
  var parts = dateStr.split('-');
  return parts[0] + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
}

function getWeekdayCN(date) {
  var days = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + days[date.getDay()];
}

function todayStr() {
  return formatDateStr(new Date());
}

function nowISO() {
  return new Date().toISOString();
}

function showToast(msg) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2200);
}

/* ==================== MODAL ==================== */
function showModal(html) {
  var overlay = document.getElementById('modal-overlay');
  var content = document.getElementById('modal-content');
  content.innerHTML = '<div class="modal-handle"></div>' + html;
  overlay.classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function showNoteModal(recordId, mod) {
  if (!mod) return;
  showModal(
    '<div class="modal-title">' + mod.icon + ' ' + mod.name + ' — 添加备注</div>' +
    '<div class="form-group"><textarea id="note-input" placeholder="记录一下这次做了什么...（可选）"></textarea></div>' +
    '<button class="form-submit" id="btn-note-save" data-record="' + recordId + '">保存</button>' +
    '<button class="modal-close" id="btn-note-skip" data-record="' + recordId + '">跳过</button>'
  );
}

// Note modal actions (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  if (e.target.id === 'btn-note-save') {
    var recordId = e.target.dataset.record;
    var note = document.getElementById('note-input').value.trim();
    if (note) updateRecordNote(recordId, note);
    hideModal();
    renderRecordTab();
    showToast('记录已保存');
    return;
  }
  if (e.target.id === 'btn-note-skip') {
    hideModal();
    showToast('记录已保存');
    return;
  }
});

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) hideModal();
});

/* ==================== TIMER ==================== */
function startTimer(moduleId) {
  if (state.activeTimer) {
    stopTimer();
  }
  state.activeTimer = { moduleId: moduleId, startTime: nowISO() };
  saveData(STORAGE_KEYS.activeTimer, state.activeTimer);

  var mod = getModuleById(moduleId);

  // Update banner
  var banner = document.getElementById('timer-banner');
  banner.classList.remove('hidden');
  banner.querySelector('.timer-banner-module').textContent = mod.name;
  banner.querySelector('.timer-banner-dot').style.background = mod.color;
  banner.querySelector('.timer-banner-dot').style.boxShadow = '0 0 8px ' + mod.color;
  document.getElementById('tab-content').classList.add('with-banner');

  // Start interval
  state.timerInterval = setInterval(updateTimerDisplay, 200);
  updateTimerDisplay();
  renderRecordTab();
}

function stopTimer() {
  if (!state.activeTimer) return;

  var startTime = state.activeTimer.startTime;
  var endTime = nowISO();
  var moduleId = state.activeTimer.moduleId;
  var mod = getModuleById(moduleId);

  var rec = addRecord({
    moduleId: moduleId,
    startTime: startTime,
    endTime: endTime,
    type: 'timer'
  });

  clearActiveTimer();
  renderRecordTab();
  showNoteModal(rec.id, mod);
}

function clearActiveTimer() {
  state.activeTimer = null;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  saveData(STORAGE_KEYS.activeTimer, null);

  var banner = document.getElementById('timer-banner');
  banner.classList.add('hidden');
  document.getElementById('tab-content').classList.remove('with-banner');
}

function updateTimerDisplay() {
  if (!state.activeTimer) return;
  var elapsed = Date.now() - new Date(state.activeTimer.startTime).getTime();
  document.querySelector('.timer-banner-time').textContent = formatDurationHHMMSS(elapsed);
}

document.getElementById('btn-stop-timer').addEventListener('click', function() {
  stopTimer();
});

/* ==================== TAB SWITCHING ==================== */
function switchTab(index) {
  state.activeTab = index;

  // Update panels
  var panels = document.querySelectorAll('.tab-panel');
  panels.forEach(function(p) { p.classList.remove('active'); });
  var panelIds = ['tab-record', 'tab-calendar', 'tab-stats', 'tab-projects', 'tab-settings'];
  document.getElementById(panelIds[index]).classList.add('active');

  // Update nav buttons
  var navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(function(b) { b.classList.remove('active'); });
  navBtns[index].classList.add('active');

  // Render the tab
  renderCurrentTab();
}

document.getElementById('bottom-nav').addEventListener('click', function(e) {
  var btn = e.target.closest('.nav-btn');
  if (!btn) return;
  switchTab(parseInt(btn.dataset.tab));
});

function renderCurrentTab() {
  switch (state.activeTab) {
    case 0: renderRecordTab(); break;
    case 1: renderCalendarTab(); break;
    case 2: renderStatsTab(); break;
    case 3: renderProjectsTab(); break;
    case 4: renderSettingsTab(); break;
  }
}

/* ==================== TAB 1: RECORD ==================== */
function renderRecordTab() {
  document.getElementById('record-date').textContent = formatDateCN(todayStr()) + ' ' + getWeekdayCN(new Date());

  var modules = getModules();
  var todayRecords = getTodayRecords();
  var activeModuleId = state.activeTimer ? state.activeTimer.moduleId : null;

  // Calculate today's duration per module
  var moduleTimes = {};
  modules.forEach(function(mod) { moduleTimes[mod.id] = 0; });
  todayRecords.forEach(function(rec) {
    if (rec.startTime && rec.endTime) {
      var dur = new Date(rec.endTime).getTime() - new Date(rec.startTime).getTime();
      moduleTimes[rec.moduleId] = (moduleTimes[rec.moduleId] || 0) + dur;
    }
  });

  // Render module cards
  var grid = document.getElementById('module-grid');
  grid.innerHTML = modules.map(function(mod) {
    var isTiming = activeModuleId === mod.id;
    var duration = moduleTimes[mod.id];
    var durText = duration > 0 ? formatDuration(duration) : '0m';
    return '<div class="module-card' + (isTiming ? ' timing' : '') + '" data-module="' + mod.id + '" style="--card-color: ' + mod.color + '">' +
      '<span class="module-card-icon">' + mod.icon + '</span>' +
      '<span class="module-card-name">' + mod.name + '</span>' +
      '<span class="module-card-time">' + durText + '</span>' +
      '</div>';
  }).join('');

  // Style card top border
  grid.querySelectorAll('.module-card').forEach(function(card) {
    var color = card.style.getPropertyValue('--card-color');
    card.style.setProperty('--stripe-color', color);
    // Set the ::after pseudo element color via inline style
    card.style.borderTop = '3px solid ' + color;
  });

  // Render today's records
  var listEl = document.getElementById('today-records');
  var emptyEl = document.getElementById('records-empty');

  if (todayRecords.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = todayRecords.map(function(rec) {
      var mod = getModuleById(rec.moduleId) || { name: '未知', color: '#999' };
      var startD = new Date(rec.startTime);
      var endD = new Date(rec.endTime);
      var dur = rec.endTime ? endD.getTime() - startD.getTime() : 0;
      return '<div class="record-item" data-id="' + rec.id + '" style="border-left: 4px solid ' + mod.color + '">' +
        '<div class="record-item-info">' +
          '<div class="record-item-module">' + mod.icon + ' ' + mod.name + '</div>' +
          '<div class="record-item-time">' + formatTimeStr(startD) + ' - ' + formatTimeStr(endD) + '</div>' +
          (rec.note ? '<div class="record-item-note">' + rec.note + '</div>' : '') +
        '</div>' +
        '<div class="record-item-duration">' + formatDuration(dur) + '</div>' +
        '<button class="record-item-delete" data-delete="' + rec.id + '">✕</button>' +
      '</div>';
    }).join('');
  }
}

// Module card click - show options
document.getElementById('module-grid').addEventListener('click', function(e) {
  var card = e.target.closest('.module-card');
  if (!card) return;
  var moduleId = card.dataset.module;
  var mod = getModuleById(moduleId);
  if (!mod) return;

  // Instant modules: one-click record
  if (mod.instant) {
    var now = new Date();
    var startTime = new Date(now.getTime() - mod.instantMin * 60000);
    var rec = addRecord({
      moduleId: moduleId,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      type: 'instant'
    });
    renderRecordTab();
    // Show note modal for 娱乐
    if (moduleId === 'entertainment') {
      showNoteModal(rec.id, mod);
    } else {
      showToast(mod.name + ' +' + mod.instantMin + 'min');
    }
    return;
  }

  showModal(
    '<div class="modal-title">' + mod.icon + ' ' + mod.name + '</div>' +
    '<div class="modal-option" data-action="timer" data-module="' + moduleId + '">' +
      '<div class="modal-option-icon">⏱️</div>' +
      '<div class="modal-option-text">' +
        '<div class="modal-option-title">计时</div>' +
        '<div class="modal-option-desc">自动记录起止时间</div>' +
      '</div>' +
    '</div>' +
    '<div class="modal-option" data-action="manual" data-module="' + moduleId + '">' +
      '<div class="modal-option-icon">📅</div>' +
      '<div class="modal-option-text">' +
        '<div class="modal-option-title">添加时段</div>' +
        '<div class="modal-option-desc">手动填写时间</div>' +
      '</div>' +
    '</div>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
});

// Modal option clicks
document.getElementById('modal-content').addEventListener('click', function(e) {
  var opt = e.target.closest('.modal-option');
  if (!opt) return;
  var action = opt.dataset.action;
  var moduleId = opt.dataset.module;

  if (action === 'timer') {
    hideModal();
    startTimer(moduleId);
  } else if (action === 'manual') {
    var mod = getModuleById(moduleId);
    var now = new Date();
    var defaultStart = formatTimeStr(new Date(now.getTime() - 3600000));
    var defaultEnd = formatTimeStr(now);
    showModal(
      '<div class="modal-title">📅 添加时段 - ' + (mod ? mod.name : '') + '</div>' +
      '<div class="form-group"><label>开始时间</label><input type="time" id="manual-start" value="' + defaultStart + '"></div>' +
      '<div class="form-group"><label>结束时间</label><input type="time" id="manual-end" value="' + defaultEnd + '"></div>' +
      '<div class="form-group"><label>日期</label><input type="date" id="manual-date" value="' + todayStr() + '"></div>' +
      '<button class="form-submit" id="btn-manual-submit" data-module="' + moduleId + '">添加记录</button>' +
      '<button class="modal-close" onclick="hideModal()">取消</button>'
    );
  }
});

// Manual submit (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  if (e.target.id !== 'btn-manual-submit') return;
  var moduleId = e.target.dataset.module;
  var dateVal = document.getElementById('manual-date').value;
  var startVal = document.getElementById('manual-start').value;
  var endVal = document.getElementById('manual-end').value;

  if (!startVal || !endVal) {
    showToast('请填写开始和结束时间');
    return;
  }

  var startTime = dateVal + 'T' + startVal + ':00';
  var endTime = dateVal + 'T' + endVal + ':00';

  if (new Date(endTime) <= new Date(startTime)) {
    showToast('结束时间必须晚于开始时间');
    return;
  }

  var rec = addRecord({
    moduleId: moduleId,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    type: 'manual'
  });

  hideModal();
  renderRecordTab();
  var mod = getModuleById(moduleId);
  showNoteModal(rec.id, mod);
});

// Delete record
document.getElementById('today-records').addEventListener('click', function(e) {
  var btn = e.target.closest('[data-delete]');
  if (!btn) return;
  var id = btn.dataset.delete;
  deleteRecord(id);
  renderRecordTab();
  showToast('记录已删除');
});

/* ==================== TAB 2: CALENDAR ==================== */
/* ==================== TAB 2: CALENDAR (WEEK VIEW) ==================== */
var WEEK_COL_W = 48; // column width
var HOUR_H = 56;     // hour row height (px per hour)

function getWeekDays() {
  var days = [];
  var mon = new Date(state.calendarWeekStart);
  for (var i = 0; i < 7; i++) {
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    days.push(d);
  }
  return days;
}

function renderCalendarTab() {
  var days = getWeekDays();
  var mon = days[0];
  var sun = days[6];

  document.getElementById('calendar-date-text').textContent =
    formatDateShort(mon) + ' - ' + formatDateShort(sun);

  // Show/hide today button
  var todayBtn = document.getElementById('btn-today');
  var today = new Date();
  if (today >= mon && today <= new Date(sun.getTime() + 86400000)) {
    todayBtn.style.display = 'none';
  } else {
    todayBtn.style.display = '';
  }

  // Project reminders for the week
  renderProjectReminders(days);

  // Render week grid
  renderWeekGrid(days);
}

function renderProjectReminders(days) {
  var container = document.getElementById('project-reminders');
  var projects = getProjects().filter(function(p) { return p.status === 'active'; });
  var reminders = [];

  days.forEach(function(day) {
    var weekday = day.getDay();
    projects.forEach(function(p) {
      if (p.weekDays && p.weekDays.indexOf(weekday) !== -1) {
        reminders.push({ project: p, date: day });
      }
    });
  });

  if (reminders.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = reminders.slice(0, 3).map(function(r) {
    return '<div class="reminder-banner">📌 ' +
      r.project.title + ' — ' + formatDateShort(r.date) + ' · ' +
      (r.project.dailyGoal || '?') + 'min</div>';
  }).join('');
}

function renderWeekGrid(days) {
  var timeline = document.getElementById('timeline');
  var now = new Date();
  var todayStrVal = formatDateStr(now);

  // Gather all records for this week
  var weekStartStr = formatDateStr(days[0]);
  var weekEndStr = formatDateStr(days[6]);
  var records = getRecords().filter(function(r) {
    if (!r.startTime || !r.endTime) return false;
    var d = r.startTime.substring(0, 10);
    return d >= weekStartStr && d <= weekEndStr;
  });

  // Build block data
  var blockData = [];
  records.forEach(function(rec) {
    var mod = getModuleById(rec.moduleId) || { name: '?', color: '#999', icon: '📌' };
    var startD = new Date(rec.startTime);
    var endD = new Date(rec.endTime);
    var dayIdx = Math.floor((startD.getTime() - days[0].getTime()) / 86400000);
    if (dayIdx < 0 || dayIdx > 6) return;
    var startMin = startD.getHours() * 60 + startD.getMinutes();
    var endMin = endD.getHours() * 60 + endD.getMinutes();
    if (endMin <= startMin) endMin = startMin + 1;
    blockData.push({
      id: rec.id,
      dayIdx: dayIdx,
      name: mod.name,
      icon: mod.icon,
      color: mod.color,
      topPx: (startMin / 60) * HOUR_H,
      heightPx: Math.max(((endMin - startMin) / 60) * HOUR_H, 6),
      startTime: formatTimeStr(startD),
      endTime: formatTimeStr(endD),
      note: rec.note || ''
    });
  });

  var html = '<div class="week-grid">';

  // Column headers
  var dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  html += '<div class="week-col-headers">';
  html += '<div class="week-time-spacer"></div>';
  for (var i = 0; i < 7; i++) {
    var isToday = formatDateStr(days[i]) === todayStrVal;
    html += '<div class="week-day-header' + (isToday ? ' today' : '') + '">' +
      '<span class="week-day-name">' + dayNames[i] + '</span>' +
      '<span class="week-day-date">' + formatDateShort(days[i]) + '</span>' +
      '</div>';
  }
  html += '</div>';

  // Body: hour rows with 7 columns each
  html += '<div class="week-body">';
  html += '<div class="week-time-col">';
  for (var h = 0; h < 24; h++) {
    html += '<div class="week-time-label">' + String(h).padStart(2, '0') + ':00</div>';
  }
  html += '</div>';

  // Day columns with slots
  html += '<div class="week-day-cols">';
  for (var di = 0; di < 7; di++) {
    html += '<div class="week-day-col" data-day-idx="' + di + '" data-date="' + formatDateStr(days[di]) + '">';
    for (var h = 0; h < 24; h++) {
      html += '<div class="week-slot" data-day-idx="' + di + '" data-hour="' + h + '"></div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Blocks layer
  html += '<div class="week-blocks-layer">';
  blockData.forEach(function(b) {
    var leftPx = b.dayIdx * WEEK_COL_W;
    var noteIcon = b.note ? '📝' : '';
    html += '<div class="week-block" style="left:' + leftPx + 'px;top:' + b.topPx + 'px;height:' + b.heightPx + 'px;background:' + b.color + ';" data-record="' + b.id + '">' +
      '<span class="week-block-name">' + b.icon + noteIcon + '</span>' +
      '</div>';
  });
  html += '</div>';

  html += '</div>'; // week-body
  html += '</div>'; // week-grid

  timeline.innerHTML = html;

  // Current time line
  if (todayStrVal >= weekStartStr && todayStrVal <= weekEndStr) {
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var todayIdx = days.findIndex(function(d) { return formatDateStr(d) === todayStrVal; });
    if (todayIdx >= 0) {
      var lineEl = document.createElement('div');
      lineEl.className = 'week-now-line';
      lineEl.style.cssText = 'left:' + (todayIdx * WEEK_COL_W) + 'px;top:' + ((nowMin / 60) * HOUR_H) + 'px;width:' + WEEK_COL_W + 'px;';
      timeline.querySelector('.week-blocks-layer').appendChild(lineEl);
    }
  }
}

// Calendar navigation (week)
document.getElementById('btn-prev-day').addEventListener('click', function() {
  state.calendarWeekStart.setDate(state.calendarWeekStart.getDate() - 7);
  renderCalendarTab();
});

document.getElementById('btn-next-day').addEventListener('click', function() {
  state.calendarWeekStart.setDate(state.calendarWeekStart.getDate() + 7);
  renderCalendarTab();
});

document.getElementById('btn-today').addEventListener('click', function() {
  state.calendarWeekStart = getMonday(new Date());
  renderCalendarTab();
});

// Tap empty slot -> add record, tap block -> view details
document.getElementById('timeline').addEventListener('click', function(e) {
  // Click on a time block -> show details
  var block = e.target.closest('.week-block');
  if (block) {
    var recordId = block.dataset.record;
    var records = getRecords();
    var rec = records.find(function(r) { return r.id === recordId; });
    if (rec) {
      var mod = getModuleById(rec.moduleId) || { name: '?', icon: '📌', color: '#999' };
      var startD = new Date(rec.startTime);
      var endD = new Date(rec.endTime);
      showModal(
        '<div class="modal-title">' + mod.icon + ' ' + mod.name + '</div>' +
        '<div style="text-align:center;padding:12px 0">' +
          '<div style="font-size:24px;font-weight:700;margin-bottom:4px">' + formatDuration(endD.getTime() - startD.getTime()) + '</div>' +
          '<div style="font-size:14px;color:var(--text-secondary)">' + formatDateStr(startD) + '</div>' +
          '<div style="font-size:14px;color:var(--text-secondary)">' + formatTimeStr(startD) + ' - ' + formatTimeStr(endD) + '</div>' +
          (rec.note ? '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:10px;font-size:14px;text-align:left">📝 ' + rec.note + '</div>' : '<div style="margin-top:8px;color:var(--text-tertiary);font-size:13px">无备注</div>') +
        '</div>' +
        '<button class="modal-close" onclick="hideModal()">关闭</button>'
      );
    }
    return;
  }

  var slot = e.target.closest('.week-slot');
  if (!slot) return;
  var dayIdx = parseInt(slot.dataset.dayIdx);
  var hour = parseInt(slot.dataset.hour);
  var dateStr = slot.parentElement.dataset.date;
  var nowDt = new Date();
  var defaultStart = String(hour).padStart(2, '0') + ':00';
  var defaultEnd = String(Math.min(hour + 1, 23)).padStart(2, '0') + ':00';

  var moduleOptions = getModules().map(function(m) {
    return '<option value="' + m.id + '">' + m.icon + ' ' + m.name + '</option>';
  }).join('');

  showModal(
    '<div class="modal-title">📅 添加日程</div>' +
    '<div class="form-group"><label>模块</label><select id="cal-module">' + moduleOptions + '</select></div>' +
    '<div class="form-group"><label>开始时间</label><input type="time" id="cal-start" value="' + defaultStart + '"></div>' +
    '<div class="form-group"><label>结束时间</label><input type="time" id="cal-end" value="' + defaultEnd + '"></div>' +
    '<button class="form-submit" id="btn-cal-submit" data-date="' + dateStr + '">添加</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
});

// Calendar add button — use today's date in current week
document.getElementById('btn-calendar-add').addEventListener('click', function() {
  var now = new Date();
  var dateStr = formatDateStr(now);
  var defaultStart = formatTimeStr(new Date(now.getTime() - 3600000));
  var defaultEnd = formatTimeStr(now);
  var moduleOptions = getModules().map(function(m) {
    return '<option value="' + m.id + '">' + m.icon + ' ' + m.name + '</option>';
  }).join('');

  showModal(
    '<div class="modal-title">📅 添加日程</div>' +
    '<div class="form-group"><label>模块</label><select id="cal-module">' + moduleOptions + '</select></div>' +
    '<div class="form-group"><label>开始时间</label><input type="time" id="cal-start" value="' + defaultStart + '"></div>' +
    '<div class="form-group"><label>结束时间</label><input type="time" id="cal-end" value="' + defaultEnd + '"></div>' +
    '<button class="form-submit" id="btn-cal-submit" data-date="' + dateStr + '">添加</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
});

// Calendar submit (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  if (e.target.id !== 'btn-cal-submit') return;
  var dateVal = e.target.dataset.date;
  var moduleId = document.getElementById('cal-module').value;
  var startVal = document.getElementById('cal-start').value;
  var endVal = document.getElementById('cal-end').value;

  if (!startVal || !endVal) { showToast('请填写时间'); return; }

  var startTime = dateVal + 'T' + startVal + ':00';
  var endTime = dateVal + 'T' + endVal + ':00';
  if (new Date(endTime) <= new Date(startTime)) {
    showToast('结束时间必须晚于开始时间');
    return;
  }

  var rec = addRecord({
    moduleId: moduleId,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    type: 'manual'
  });

  hideModal();
  renderCalendarTab();
  var mod = getModuleById(moduleId);
  showNoteModal(rec.id, mod);
});

/* ==================== TAB 3: STATS ==================== */
var pieChart = null;
var barChart = null;

function renderStatsTab() {
  var range = state.statsRange;
  var now = new Date();
  var fromStr, toStr;

  switch (range) {
    case 'day':
      fromStr = formatDateStr(now);
      toStr = fromStr;
      break;
    case 'week':
      var dow = now.getDay();
      var monday = new Date(now);
      monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      fromStr = formatDateStr(monday);
      toStr = formatDateStr(now);
      break;
    case 'month':
      fromStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
      toStr = formatDateStr(now);
      break;
    case 'year':
      fromStr = now.getFullYear() + '-01-01';
      toStr = formatDateStr(now);
      break;
  }

  var records = getRecordsInRange(fromStr, toStr);
  var modules = getModules();
  var moduleMap = {};
  modules.forEach(function(m) { moduleMap[m.id] = { name: m.name, icon: m.icon, color: m.color, duration: 0 }; });

  var totalDuration = 0;
  records.forEach(function(rec) {
    if (rec.startTime && rec.endTime) {
      var dur = new Date(rec.endTime).getTime() - new Date(rec.startTime).getTime();
      if (dur > 0) {
        totalDuration += dur;
        if (moduleMap[rec.moduleId]) {
          moduleMap[rec.moduleId].duration += dur;
        }
      }
    }
  });

  var activeModules = Object.values(moduleMap).filter(function(m) { return m.duration > 0; }).length;

  // Summary cards
  document.getElementById('stats-summary').innerHTML =
    '<div class="stat-card"><div class="stat-card-value">' + formatStatsShort(totalDuration) + '</div><div class="stat-card-label">总时长</div></div>' +
    '<div class="stat-card"><div class="stat-card-value">' + activeModules + '</div><div class="stat-card-label">活跃模块</div></div>' +
    '<div class="stat-card"><div class="stat-card-value">' + records.length + '</div><div class="stat-card-label">记录条数</div></div>';

  // Pie chart
  var pieCtx = document.getElementById('pie-chart').getContext('2d');
  if (pieChart) pieChart.destroy();

  var pieData = Object.values(moduleMap).filter(function(m) { return m.duration > 0; });
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: pieData.map(function(m) { return m.icon + ' ' + m.name; }),
      datasets: [{
        data: pieData.map(function(m) { return Math.round(m.duration / 60000); }),
        backgroundColor: pieData.map(function(m) { return m.color; }),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } }
      }
    }
  });

  // Bar chart
  var barCtx = document.getElementById('bar-chart').getContext('2d');
  if (barChart) barChart.destroy();

  var barData = Object.values(moduleMap).filter(function(m) { return m.duration >= 0; });
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: barData.map(function(m) { return m.name; }),
      datasets: [{
        label: '分钟',
        data: barData.map(function(m) { return Math.round(m.duration / 60000); }),
        backgroundColor: barData.map(function(m) { return m.color; }),
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#f0f0f5' } },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

// Range switching
document.querySelector('.stats-range').addEventListener('click', function(e) {
  var btn = e.target.closest('.range-btn');
  if (!btn) return;
  this.querySelectorAll('.range-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  state.statsRange = btn.dataset.range;
  renderStatsTab();
});

/* ==================== TAB 4: PROJECTS ==================== */
var projectFilter = 'active';

function renderProjectsTab() {
  var projects = getProjects();
  var filtered = projects.filter(function(p) { return p.status === projectFilter; });
  var listEl = document.getElementById('project-list');
  var emptyEl = document.getElementById('projects-empty');

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = filtered.map(function(p) {
      var progress = getProjectProgress(p);
      var weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
      var weekDays = p.weekDays || [];
      var daysHtml = weekdayNames.map(function(name, idx) {
        return '<span class="weekday-dot' + (weekDays.indexOf(idx) !== -1 ? ' active' : '') + '">' + name + '</span>';
      }).join('');

      var milestoneCount = p.milestones ? p.milestones.length : 0;
      var milestoneDone = p.milestones ? p.milestones.filter(function(m) { return m.completed; }).length : 0;

      return '<div class="project-card" data-id="' + p.id + '">' +
        '<div class="project-card-header">' +
          '<span class="project-card-title">' + p.title + '</span>' +
          '<span class="project-card-status status-' + p.status + '">' + (p.status === 'active' ? '进行中' : '已完成') + '</span>' +
        '</div>' +
        (p.description ? '<div class="project-card-desc">' + p.description + '</div>' : '') +
        '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="project-card-meta">' +
          '<span>' + progress + '% · ' + milestoneDone + '/' + milestoneCount + ' 里程碑</span>' +
          '<div class="project-weekdays">' + daysHtml + '</div>' +
        '</div>' +
        (p.dailyGoal ? '<div class="project-card-meta" style="margin-top:4px">每次 ' + p.dailyGoal + ' 分钟</div>' : '') +
        (p.startDate && p.endDate ? '<div class="project-card-meta" style="margin-top:2px;font-size:11px;color:var(--text-tertiary)">' + p.startDate + ' ~ ' + p.endDate + '</div>' : '') +
        '<div class="project-milestones" id="milestones-' + p.id + '">' +
          '<div class="milestone-header">里程碑</div>' +
          (p.milestones || []).map(function(ms) {
            return '<div class="milestone-item">' +
              '<span class="milestone-checkbox' + (ms.completed ? ' checked' : '') + '" data-toggle="' + ms.id + '" data-project="' + p.id + '">' + (ms.completed ? '✓' : '') + '</span>' +
              '<span class="milestone-text' + (ms.completed ? ' completed' : '') + '">' + ms.title + '</span>' +
              '<button class="milestone-delete" data-delete-ms="' + ms.id + '" data-project="' + p.id + '">✕</button>' +
              '</div>';
          }).join('') +
          '<div class="milestone-add">' +
            '<input type="text" placeholder="新里程碑..." id="ms-input-' + p.id + '">' +
            '<button data-add-ms="' + p.id + '">添加</button>' +
          '</div>' +
        '</div>' +
        '<div class="project-card-actions">' +
          (p.status === 'active'
            ? '<button class="project-action-btn btn-complete" data-complete="' + p.id + '">✓ 标记完成</button>'
            : '<button class="project-action-btn btn-complete" data-reopen="' + p.id + '">↩ 重新打开</button>'
          ) +
          '<button class="project-action-btn btn-delete" data-delete-proj="' + p.id + '">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }
}

// Project tab filter
document.querySelector('.project-tabs').addEventListener('click', function(e) {
  var btn = e.target.closest('.project-tab-btn');
  if (!btn) return;
  this.querySelectorAll('.project-tab-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  projectFilter = btn.dataset.filter;
  renderProjectsTab();
});

// Project card actions (delegated)
document.getElementById('project-list').addEventListener('click', function(e) {
  // Toggle milestone
  var toggleEl = e.target.closest('[data-toggle]');
  if (toggleEl) {
    var msId = toggleEl.dataset.toggle;
    var projId = toggleEl.dataset.project;
    toggleMilestone(projId, msId);
    renderProjectsTab();
    return;
  }

  // Delete milestone
  var delMs = e.target.closest('[data-delete-ms]');
  if (delMs) {
    var msId = delMs.dataset.deleteMs;
    var projId = delMs.dataset.project;
    deleteMilestone(projId, msId);
    renderProjectsTab();
    return;
  }

  // Add milestone
  var addMs = e.target.closest('[data-add-ms]');
  if (addMs) {
    var projId = addMs.dataset.addMs;
    var input = document.getElementById('ms-input-' + projId);
    if (!input || !input.value.trim()) return;
    addMilestone(projId, input.value.trim());
    renderProjectsTab();
    return;
  }

  // Complete project
  var completeBtn = e.target.closest('[data-complete]');
  if (completeBtn) {
    updateProject(completeBtn.dataset.complete, { status: 'completed' });
    renderProjectsTab();
    showToast('项目已标记为完成');
    return;
  }

  // Reopen project
  var reopenBtn = e.target.closest('[data-reopen]');
  if (reopenBtn) {
    updateProject(reopenBtn.dataset.reopen, { status: 'active' });
    renderProjectsTab();
    showToast('项目已重新打开');
    return;
  }

  // Delete project
  var delProj = e.target.closest('[data-delete-proj]');
  if (delProj) {
    if (confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      deleteProject(delProj.dataset.deleteProj);
      renderProjectsTab();
      showToast('项目已删除');
    }
    return;
  }
});

// New project
document.getElementById('btn-new-project').addEventListener('click', function() {
  var now = new Date();
  var defaultEnd = new Date(now);
  defaultEnd.setMonth(defaultEnd.getMonth() + 3);
  var weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

  showModal(
    '<div class="modal-title">📂 新建项目</div>' +
    '<div class="form-group"><label>标题</label><input type="text" id="proj-title" placeholder="项目名称"></div>' +
    '<div class="form-group"><label>描述</label><textarea id="proj-desc" placeholder="项目描述（可选）"></textarea></div>' +
    '<div class="form-group"><label>开始日期</label><input type="date" id="proj-start" value="' + todayStr() + '"></div>' +
    '<div class="form-group"><label>结束日期</label><input type="date" id="proj-end" value="' + formatDateStr(defaultEnd) + '"></div>' +
    '<div class="form-group"><label>每周哪几天</label>' +
      '<div class="weekday-selector">' +
        weekdayNames.map(function(name, idx) {
          return '<button class="weekday-chip' + (idx >= 1 && idx <= 5 ? ' selected' : '') + '" data-wd="' + idx + '">' + name + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="form-group"><label>每次时长（分钟）</label><input type="number" id="proj-daily" value="30" min="1"></div>' +
    '<button class="form-submit" id="btn-proj-submit">创建项目</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
});

// Weekday chip toggle (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  var chip = e.target.closest('.weekday-chip');
  if (chip) {
    e.preventDefault();
    chip.classList.toggle('selected');
  }
});

// Project submit (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  if (e.target.id !== 'btn-proj-submit') return;
  var title = document.getElementById('proj-title').value.trim();
  if (!title) { showToast('请输入项目标题'); return; }

  var weekDays = [];
  document.querySelectorAll('.weekday-chip.selected').forEach(function(chip) {
    weekDays.push(parseInt(chip.dataset.wd));
  });

  var project = {
    title: title,
    description: document.getElementById('proj-desc').value.trim(),
    startDate: document.getElementById('proj-start').value,
    endDate: document.getElementById('proj-end').value,
    weekDays: weekDays,
    dailyGoal: parseInt(document.getElementById('proj-daily').value) || 30,
    milestones: []
  };

  addProject(project);
  hideModal();
  renderProjectsTab();
  showToast('项目已创建');
});

/* ==================== TAB 5: SETTINGS ==================== */
function renderSettingsTab() {
  var modules = getModules();

  document.getElementById('module-manage-list').innerHTML = modules.map(function(mod) {
    return '<div class="module-manage-item">' +
      '<span class="module-manage-icon">' + mod.icon + '</span>' +
      '<div class="module-manage-info">' +
        '<div class="module-manage-name">' + mod.name + '</div>' +
        '<div class="module-manage-meta">' + (mod.isPreset ? '预设模块' : '自定义模块') + '</div>' +
      '</div>' +
      '<div class="module-manage-actions">' +
        '<button class="module-manage-edit" data-edit-module="' + mod.id + '">✏️</button>' +
        '<button class="module-manage-delete" data-delete-module="' + mod.id + '">🗑️</button>' +
      '</div>' +
    '</div>';
  }).join('');

  // Sync section
  var syncSection = document.getElementById('sync-section');
  if (!syncSection) {
    syncSection = document.createElement('div');
    syncSection.id = 'sync-section';
    var btnAdd = document.getElementById('btn-add-module');
    btnAdd.parentNode.insertBefore(syncSection, btnAdd.nextElementSibling);
  }
  var configured = isSyncConfigured();
  var cfg = getSyncConfig();
  var statusMap = { idle: '', syncing: '同步中...', synced: '✓ 已同步', error: '⚠ 同步失败' };
  syncSection.innerHTML =
    '<div class="section-header"><h3>☁️ 云同步 (GitHub Gist)</h3>' +
      '<span class="sync-status sync-' + _syncStatus + '" id="sync-status">' + (statusMap[_syncStatus] || '') + '</span>' +
    '</div>' +
    (configured ?
      '<div class="sync-card connected">' +
        '<p>✅ 已连接 · <b>Gist:</b> <code style="font-size:11px;word-break:break-all">' + cfg.gistId + '</code></p>' +
        '<p style="font-size:12px;color:var(--text-secondary);margin-top:4px">在其他设备上输入此 Gist ID 即可配对同步</p>' +
        '<button class="btn-secondary" id="btn-disconnect-sync" style="margin-top:8px">断开连接</button>' +
      '</div>' :
      '<div class="sync-card">' +
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:10px">连接 GitHub Gist，不同设备打开页面数据自动同步</p>' +
        '<button class="btn-secondary" id="btn-setup-sync">🔗 连接 GitHub</button>' +
      '</div>'
    );
}

// Module management actions
document.getElementById('module-manage-list').addEventListener('click', function(e) {
  var editBtn = e.target.closest('[data-edit-module]');
  if (editBtn) {
    var modId = editBtn.dataset.editModule;
    var mod = getModuleById(modId);
    if (!mod) return;
    showEditModuleModal(mod);
    return;
  }

  var delBtn = e.target.closest('[data-delete-module]');
  if (delBtn) {
    var modId = delBtn.dataset.deleteModule;
    if (confirm('确定删除此自定义模块？')) {
      deleteModule(modId);
      renderSettingsTab();
      showToast('模块已删除');
    }
    return;
  }
});

// Sync buttons (delegated on settings tab)
document.getElementById('tab-settings').addEventListener('click', function(e) {
  if (e.target.id === 'btn-setup-sync') {
    showSyncSetupModal();
    return;
  }
  if (e.target.id === 'btn-disconnect-sync') {
    if (confirm('断开同步连接？数据不会丢失，但将停止自动同步。')) {
      disconnectSync();
    }
    return;
  }
});

function showSyncSetupModal() {
  showModal(
    '<div class="modal-title">☁️ 连接 GitHub 同步</div>' +
    '<div class="form-group">' +
      '<label>GitHub Personal Access Token</label>' +
      '<input type="password" id="sync-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">' +
      '<p style="font-size:12px;color:var(--text-secondary);margin-top:6px">' +
        '需要 <b>gist</b> 权限。创建方式：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → 勾选 <b>gist</b></p>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Gist ID（可选）</label>' +
      '<input type="text" id="sync-gist-id" placeholder="留空则自动搜索或创建">' +
      '<p style="font-size:12px;color:var(--text-secondary);margin-top:4px">' +
        '如果你已在其他设备上设置过同步，粘贴第一台设备上显示的 Gist ID 即可配对</p>' +
    '</div>' +
    '<button class="form-submit" id="btn-sync-connect">连接</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
}

function showEditModuleModal(mod) {
  showModal(
    '<div class="modal-title">编辑模块</div>' +
    '<div class="form-group"><label>名称</label><input type="text" id="edit-mod-name" value="' + mod.name + '"></div>' +
    '<div class="form-group"><label>图标</label>' +
      '<div class="icon-selector">' +
        ICON_OPTIONS.map(function(icon) {
          return '<button class="icon-chip' + (icon === mod.icon ? ' selected' : '') + '" data-icon="' + icon + '">' + icon + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="form-group"><label>颜色</label>' +
      '<div class="color-selector">' +
        COLOR_OPTIONS.map(function(color) {
          return '<div class="color-dot' + (color === mod.color ? ' selected' : '') + '" data-color="' + color + '" style="background:' + color + '"></div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<button class="form-submit" id="btn-save-module" data-module="' + mod.id + '">保存</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
}

// Icon & color selection (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  var iconChip = e.target.closest('.icon-chip');
  if (iconChip) {
    this.querySelectorAll('.icon-chip').forEach(function(c) { c.classList.remove('selected'); });
    iconChip.classList.add('selected');
    return;
  }
  var colorDot = e.target.closest('.color-dot');
  if (colorDot) {
    this.querySelectorAll('.color-dot').forEach(function(c) { c.classList.remove('selected'); });
    colorDot.classList.add('selected');
    return;
  }

  // Save module
  if (e.target.id === 'btn-save-module') {
    var modId = e.target.dataset.module;
    var newName = document.getElementById('edit-mod-name').value.trim();
    if (!newName) { showToast('请输入模块名称'); return; }
    var selectedIcon = document.querySelector('.icon-chip.selected');
    var selectedColor = document.querySelector('.color-dot.selected');
    updateModule(modId, {
      name: newName,
      icon: selectedIcon ? selectedIcon.dataset.icon : '📌',
      color: selectedColor ? selectedColor.dataset.color : '#607D8B'
    });
    hideModal();
    renderSettingsTab();
    showToast('模块已更新');
  }
});

// Add custom module
document.getElementById('btn-add-module').addEventListener('click', function() {
  showModal(
    '<div class="modal-title">添加自定义模块</div>' +
    '<div class="form-group"><label>名称</label><input type="text" id="add-mod-name" placeholder="模块名称"></div>' +
    '<div class="form-group"><label>图标</label>' +
      '<div class="icon-selector">' +
        ICON_OPTIONS.map(function(icon, idx) {
          return '<button class="icon-chip' + (idx === 0 ? ' selected' : '') + '" data-icon="' + icon + '">' + icon + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="form-group"><label>颜色</label>' +
      '<div class="color-selector">' +
        COLOR_OPTIONS.map(function(color, idx) {
          return '<div class="color-dot' + (idx === 0 ? ' selected' : '') + '" data-color="' + color + '" style="background:' + color + '"></div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<button class="form-submit" id="btn-add-module-submit">添加</button>' +
    '<button class="modal-close" onclick="hideModal()">取消</button>'
  );
});

// Add module submit (delegated)
document.getElementById('modal-content').addEventListener('click', function(e) {
  if (e.target.id === 'btn-add-module-submit') {
    var name = document.getElementById('add-mod-name').value.trim();
    if (!name) { showToast('请输入模块名称'); return; }
    var selectedIcon = document.querySelector('.icon-chip.selected');
    var selectedColor = document.querySelector('.color-dot.selected');
    addModule({
      name: name,
      icon: selectedIcon ? selectedIcon.dataset.icon : '📌',
      color: selectedColor ? selectedColor.dataset.color : '#607D8B'
    });
    hideModal();
    renderSettingsTab();
    showToast('自定义模块已添加');
  }
  // Sync connect from modal
  if (e.target.id === 'btn-sync-connect') {
    var token = document.getElementById('sync-token').value.trim();
    if (!token) { showToast('请输入 GitHub Token'); return; }
    var gistId = document.getElementById('sync-gist-id').value.trim();
    hideModal();
    setupGistSync(token, gistId || null);
  }
});

// Export
document.getElementById('btn-export').addEventListener('click', function() {
  var data = exportAllData();
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'habit-tracker-backup-' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('数据已导出');
});

// Import
document.getElementById('btn-import').addEventListener('click', function() {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    if (!confirm('导入将覆盖现有记录和项目数据，确定继续？')) {
      showToast('已取消导入');
      return;
    }
    var success = importAllData(ev.target.result);
    if (success) {
      showToast('数据已导入');
      renderSettingsTab();
      renderRecordTab();
    } else {
      showToast('导入失败：数据格式不正确');
    }
  };
  reader.readAsText(file);
  this.value = '';
});

/* ==================== INITIALIZATION ==================== */
function init() {
  renderRecordTab();
}

// If timer was active when page loaded, restore UI
(function() {
  if (state.activeTimer) {
    var mod = getModuleById(state.activeTimer.moduleId);
    if (mod) {
      var banner = document.getElementById('timer-banner');
      banner.classList.remove('hidden');
      banner.querySelector('.timer-banner-module').textContent = mod.name;
      banner.querySelector('.timer-banner-dot').style.background = mod.color;
      banner.querySelector('.timer-banner-dot').style.boxShadow = '0 0 8px ' + mod.color;
      document.getElementById('tab-content').classList.add('with-banner');
      state.timerInterval = setInterval(updateTimerDisplay, 200);
      updateTimerDisplay();
    } else {
      // Module doesn't exist anymore, clear timer
      clearActiveTimer();
    }
  }
})();

init();

// Pull latest data from Gist on load (if sync configured)
if (isSyncConfigured()) {
  updateSyncStatus('syncing');
  pullFromGist().then(function(updated) {
    if (updated) {
      renderRecordTab();
    }
  });
}
