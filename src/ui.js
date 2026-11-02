/*
 * 界面装配：把 core（纯逻辑）和 wheel（绘制/动画）连起来。
 * 所有状态都存在浏览器本地，没有任何网络请求。
 */
(function () {
  'use strict';

  const CFM = window.CFM;
  const CFMWheel = window.CFMWheel;

  const STORAGE_CUSTOM = 'cfm.custom.v1';
  const STORAGE_HISTORY = 'cfm.history.v1';
  const HISTORY_LIMIT = 5;

  const dom = {
    scenes: document.getElementById('scenes'),
    rotor: document.getElementById('wheelRotor'),
    result: document.getElementById('result'),
    spinBtn: document.getElementById('spinBtn'),
    optionsInput: document.getElementById('optionsInput'),
    optionsCount: document.getElementById('optionsCount'),
    optionsHint: document.getElementById('optionsHint'),
    applyBtn: document.getElementById('applyBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shareBtn: document.getElementById('shareBtn'),
    toast: document.getElementById('toast'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
  };

  const state = {
    sceneId: CFM.DEFAULT_SCENES[0].id,
    options: [],
    history: [],
    shared: null,
  };

  /* ---------------- 本地存储 ---------------- */

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      // 存储被禁用或内容损坏时，不应该影响主流程
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* 隐私模式下会失败，忽略即可 */
    }
  }

  function loadCustom() {
    const stored = readJson(STORAGE_CUSTOM, {});
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  }

  function saveCustom(sceneId, options) {
    const custom = loadCustom();
    custom[sceneId] = options;
    writeJson(STORAGE_CUSTOM, custom);
  }

  /* ---------------- 渲染 ---------------- */

  function renderScenes() {
    dom.scenes.textContent = '';
    const entries = CFM.DEFAULT_SCENES.slice();
    if (state.shared) {
      entries.push({ id: 'shared', label: '分享的选项', emoji: '🔗', options: state.shared });
    }

    entries.forEach((scene) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scene';
      button.dataset.sceneId = scene.id;
      button.setAttribute('aria-pressed', String(scene.id === state.sceneId));
      button.textContent = (scene.emoji || '🎲') + ' ' + scene.label;
      button.addEventListener('click', () => selectScene(scene.id));
      dom.scenes.appendChild(button);
    });
  }

  function sceneById(sceneId) {
    if (sceneId === 'shared' && state.shared) {
      return { id: 'shared', label: '分享的选项', options: state.shared };
    }
    return CFM.DEFAULT_SCENES.find((scene) => scene.id === sceneId) || null;
  }

  function optionsFor(sceneId) {
    const scene = sceneById(sceneId);
    if (!scene) return [];
    if (sceneId === 'shared') return CFM.parseOptions(scene.options);
    const custom = loadCustom();
    const saved = custom[sceneId];
    if (Array.isArray(saved) && CFM.isUsable(saved)) return CFM.parseOptions(saved);
    return CFM.parseOptions(scene.options);
  }

  function selectScene(sceneId) {
    state.sceneId = sceneId;
    state.options = optionsFor(sceneId);
    dom.optionsInput.value = state.options.join('\n');
    dom.result.innerHTML = '<span class="result__placeholder">点一下按钮开始</span>';
    dom.result.classList.remove('result--done');
    CFMWheel.reset(dom.rotor);
    renderScenes();
    renderWheel();
    updateEditorState();
  }

  function renderWheel() {
    CFMWheel.render(dom.rotor, state.options);
    dom.spinBtn.disabled = !CFM.isUsable(state.options);
  }

  function updateEditorState() {
    const parsed = CFM.parseOptions(dom.optionsInput.value);
    dom.optionsCount.textContent = parsed.length + ' / ' + CFM.MAX_OPTIONS;
    dom.optionsHint.hidden = CFM.isUsable(parsed);
  }

  function renderHistory() {
    dom.historyList.textContent = '';
    state.history.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'history__item';
      const text = document.createElement('span');
      text.textContent = entry.text;
      const time = document.createElement('span');
      time.className = 'history__time';
      time.textContent = CFM.formatTime(entry.at);
      item.appendChild(text);
      item.appendChild(time);
      dom.historyList.appendChild(item);
    });
    dom.historyEmpty.hidden = state.history.length > 0;
  }

  function toast(message) {
    dom.toast.textContent = message;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => {
      dom.toast.textContent = '';
    }, 2400);
  }

  /* ---------------- 交互 ---------------- */

  async function spin() {
    if (dom.spinBtn.disabled) return;
    const options = state.options;
    if (!CFM.isUsable(options)) return;

    const index = CFM.pickIndex(options.length);
    dom.spinBtn.disabled = true;
    dom.result.classList.remove('result--done');
    dom.result.innerHTML = '<span class="result__placeholder">转动中…</span>';

    await CFMWheel.spinTo(dom.rotor, index, options.length, 3200);

    const text = options[index];
    dom.result.textContent = text;
    dom.result.classList.add('result--done');

    state.history = CFM.pushHistory(state.history, { text, at: Date.now() }, HISTORY_LIMIT);
    writeJson(STORAGE_HISTORY, state.history);
    renderHistory();

    dom.spinBtn.disabled = false;
  }

  function applyOptions() {
    const parsed = CFM.parseOptions(dom.optionsInput.value);
    if (!CFM.isUsable(parsed)) {
      toast('至少要有 2 个选项，否则没得选。');
      updateEditorState();
      return;
    }
    state.options = parsed;
    if (state.sceneId !== 'shared') saveCustom(state.sceneId, parsed);
    CFMWheel.reset(dom.rotor);
    renderWheel();
    updateEditorState();
    dom.result.innerHTML = '<span class="result__placeholder">点一下按钮开始</span>';
    toast('已应用到转盘（本次已保存在本地）');
  }

  function resetOptions() {
    const scene = sceneById(state.sceneId);
    if (!scene) return;
    const defaults = CFM.parseOptions(scene.options);
    dom.optionsInput.value = defaults.join('\n');
    state.options = defaults;
    if (state.sceneId !== 'shared') {
      const custom = loadCustom();
      delete custom[state.sceneId];
      writeJson(STORAGE_CUSTOM, custom);
    }
    CFMWheel.reset(dom.rotor);
    renderWheel();
    updateEditorState();
    toast('已恢复本场景的默认选项');
  }

  async function share() {
    const hash = CFM.encodeOptions(state.options);
    if (!hash) {
      toast('先填几个选项再分享吧。');
      return;
    }
    const url = window.location.origin + window.location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      toast('链接已复制，发给同学即可打开同一组选项');
    } catch (err) {
      // 非 https 或旧浏览器下 clipboard 不可用，退化成显示链接
      toast(url);
    }
  }

  function bindEvents() {
    dom.spinBtn.addEventListener('click', () => {
      spin();
    });
    dom.applyBtn.addEventListener('click', applyOptions);
    dom.resetBtn.addEventListener('click', resetOptions);
    dom.shareBtn.addEventListener('click', () => {
      share();
    });
    dom.optionsInput.addEventListener('input', updateEditorState);
  }

  /* ---------------- 启动 ---------------- */

  function boot() {
    state.history = readJson(STORAGE_HISTORY, []);
    if (!Array.isArray(state.history)) state.history = [];

    const shared = CFM.decodeHash(window.location.hash);
    if (CFM.isUsable(shared)) state.shared = shared;

    bindEvents();
    selectScene(state.shared ? 'shared' : CFM.DEFAULT_SCENES[0].id);
    renderHistory();
  }

  boot();
})();
