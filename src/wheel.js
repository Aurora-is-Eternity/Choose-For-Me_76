/*
 * 转盘的绘制与旋转。
 * 只依赖 DOM / SVG，不依赖核心逻辑（选项数组由外部传进来）。
 */
(function (root) {
  'use strict';

  const CX = 160;
  const CY = 160;
  const RADIUS = 150;
  const LABEL_RADIUS = 96;
  const COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  ];

  const prefersReducedMotion = () =>
    typeof root.matchMedia === 'function' &&
    root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

  function pointAt(cx, cy, radius, deg) {
    const rad = toRad(deg);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function slicePath(startDeg, endDeg) {
    const start = pointAt(CX, CY, RADIUS, startDeg);
    const end = pointAt(CX, CY, RADIUS, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [
      'M', CX, CY,
      'L', start.x.toFixed(2), start.y.toFixed(2),
      'A', RADIUS, RADIUS, 0, largeArc, 1, end.x.toFixed(2), end.y.toFixed(2),
      'Z',
    ].join(' ');
  }

  /** CJK / 全角大约占两个拉丁列宽，用来估算标签是否塞得进扇区弧长 */
  function charDisplayWidth(ch) {
    const code = ch.codePointAt(0);
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      return 2;
    }
    return 1;
  }

  function displayWidth(text) {
    let width = 0;
    for (const ch of String(text)) width += charDisplayWidth(ch);
    return width;
  }

  /**
   * 按显示宽度截断；中文按 2 计宽。ellipsis 占 1 列。
   * @param {string} text
   * @param {number} maxWidth 可用显示列数（至少 1）
   */
  function truncate(text, maxWidth) {
    const value = String(text);
    const limit = Math.max(0, Math.floor(maxWidth));
    if (limit <= 0) return '';
    if (displayWidth(value) <= limit) return value;
    const budget = Math.max(1, limit - 1);
    let width = 0;
    let out = '';
    for (const ch of value) {
      const w = charDisplayWidth(ch);
      if (width + w > budget) break;
      out += ch;
      width += w;
    }
    return out + '…';
  }

  function fontSizeForCount(count) {
    return count > 12 ? 9 : count > 8 ? 10 : 11;
  }

  /**
   * 扇区在 LABEL_RADIUS 处的可用弧长决定能放多少列宽的字。
   * arc = 2πr / count；拉丁字宽约 0.6em，并留一点相邻间距。
   */
  function labelMaxWidth(count) {
    const n = Math.max(count, 1);
    const arc = (2 * Math.PI * LABEL_RADIUS) / n;
    const advance = fontSizeForCount(n) * 0.6;
    return Math.max(1, Math.floor((arc * 0.85) / advance));
  }

  /** 把选项画成扇形，一圈铺满 360° */
  function render(rotor, options) {
    const namespace = 'http://www.w3.org/2000/svg';
    rotor.textContent = '';

    const count = Math.max(options.length, 1);
    const angle = 360 / count;
    const maxWidth = labelMaxWidth(count);
    const fontSize = fontSizeForCount(count);

    options.forEach((option, index) => {
      const start = index * angle;
      const end = start + angle;
      const mid = start + angle / 2;

      const path = root.document.createElementNS(namespace, 'path');
      path.setAttribute('d', slicePath(start, end));
      path.setAttribute('fill', COLORS[index % COLORS.length]);
      path.setAttribute('stroke', 'rgba(255,255,255,0.85)');
      path.setAttribute('stroke-width', '2');
      rotor.appendChild(path);

      const label = root.document.createElementNS(namespace, 'text');
      label.setAttribute('x', String(CX));
      label.setAttribute('y', String(CY - LABEL_RADIUS));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('fill', '#fff');
      label.setAttribute('font-size', String(fontSize));
      label.setAttribute('font-weight', '600');
      label.setAttribute('transform', `rotate(${mid} ${CX} ${CY})`);
      label.textContent = truncate(option, maxWidth);
      rotor.appendChild(label);
    });
  }

  /** 当前旋转角度（度），旋转是累加的，避免每次归零造成的回弹 */
  let currentRotation = 0;
  let spinning = false;

  /**
   * 把第 index 个扇区转到指针位置。
   * @returns {Promise<void>} 动画结束（或立即结束）时 resolve
   */
  function spinTo(rotor, index, count, durationMs) {
    return new Promise((resolve) => {
      if (spinning) {
        resolve();
        return;
      }
      spinning = true;

      const angle = 360 / Math.max(count, 1);
      const targetCenter = index * angle + angle / 2;
      const turns = 4;
      // 让选中的扇区中心停在正上方（0°）：需要把转盘逆时针转到 -targetCenter
      const base = Math.floor(currentRotation / 360) * 360;
      const target = base + 360 * turns - targetCenter;
      const duration = prefersReducedMotion() ? 0 : durationMs || 3200;

      rotor.style.transition = duration
        ? `transform ${duration}ms cubic-bezier(0.16, 0.84, 0.18, 1)`
        : 'none';
      rotor.style.transform = `rotate(${target}deg)`;
      currentRotation = target;

      if (!duration) {
        spinning = false;
        resolve();
        return;
      }

      const done = () => {
        rotor.removeEventListener('transitionend', done);
        spinning = false;
        resolve();
      };
      rotor.addEventListener('transitionend', done);
      // 兜底：某些浏览器在标签页切走时不触发 transitionend
      root.setTimeout(() => {
        if (spinning) done();
      }, duration + 200);
    });
  }

  function reset(rotor) {
    currentRotation = 0;
    rotor.style.transition = 'none';
    rotor.style.transform = 'rotate(0deg)';
  }

  root.CFMWheel = {
    render,
    spinTo,
    reset,
    COLORS,
    truncate,
    displayWidth,
    labelMaxWidth,
    LABEL_RADIUS,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = root.CFMWheel;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
