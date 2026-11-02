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

  function truncate(text, max) {
    const value = String(text);
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }

  /** 把选项画成扇形，一圈铺满 360° */
  function render(rotor, options) {
    const namespace = 'http://www.w3.org/2000/svg';
    rotor.textContent = '';

    const count = Math.max(options.length, 1);
    const angle = 360 / count;

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
      label.setAttribute('font-size', String(count > 12 ? 9 : count > 8 ? 10 : 11));
      label.setAttribute('font-weight', '600');
      label.setAttribute('transform', `rotate(${mid} ${CX} ${CY})`);
      label.textContent = truncate(option, count > 12 ? 5 : 7);
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

  root.CFMWheel = { render, spinTo, reset, COLORS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
