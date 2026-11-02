/*
 * Choose-For-Me 的核心逻辑。
 *
 * 设计约束：
 *   1. 纯函数、零依赖、不碰 DOM —— 这样才能用 node:test 直接测。
 *   2. 不打包、不转译 —— 浏览器里用 <script> 加载后挂到 window.CFM，
 *      Node 里则可以 require 出来跑测试（同一份源码，两种消费方式）。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CFM = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** 转盘最多 24 格：再多字就挤成一团，随机也失去「可读性」 */
  const MAX_OPTIONS = 24;
  /** 少于 2 个选项就不叫选择了 */
  const MIN_OPTIONS = 2;
  /** 用户粘贴选项时的分隔符：换行、中英文逗号、顿号、分号、竖线 */
  const SEPARATORS = /[\n\r,，、;；|]/;

  /** 内置场景：改这里就等于扩充默认选项库（社群提 Issue 就是提这个） */
  const DEFAULT_SCENES = [
    {
      id: 'eat',
      label: '吃什么',
      emoji: '🍜',
      options: ['吃食堂', '点外卖', '下馆子', '自己做饭', '泡面加蛋', '沙拉轻食'],
    },
    {
      id: 'do',
      label: '干什么',
      emoji: '🎯',
      options: ['写作业', '打游戏', '睡一觉', '去图书馆', '看部电影', '去跑步', '收拾房间'],
    },
    {
      id: 'who',
      label: '谁来做',
      emoji: '🙋',
      options: ['我来', '你来', '宿舍长', '最晚睡的人', '今天迟到的人', '石头剪刀布输的人'],
    },
  ];

  /**
   * 单个选项的清洗：去掉控制字符、把连续空白压成一个空格、首尾去空白。
   * 不做截断，超长选项交给 UI 自己用 CSS 省略号处理。
   */
  function normalizeOption(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 把「一段文本或一个数组」解析成干净的选项列表：
   * 去空行、去重复（忽略大小写）、限制最大数量。
   */
  function parseOptions(input) {
    const raw = Array.isArray(input)
      ? input
      : String(input == null ? '' : input).split(SEPARATORS);
    const seen = new Set();
    const result = [];

    for (const item of raw) {
      const text = normalizeOption(item);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(text);
      if (result.length >= MAX_OPTIONS) break;
    }

    return result;
  }

  /** 选项数量够不够开一次盘 */
  function isUsable(options) {
    return Array.isArray(options) && options.length >= MIN_OPTIONS;
  }

  /**
   * 抽一个下标。
   * rng 可注入，测试里传固定序列就能得到确定结果。
   */
  function pickIndex(count, rng) {
    if (!Number.isInteger(count) || count <= 0) {
      throw new RangeError('count 必须是正整数');
    }
    const random = typeof rng === 'function' ? rng : Math.random;
    const value = Number(random());
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('rng 必须返回 [0, 1) 之间的数');
    }
    return Math.floor(value * count);
  }

  /** 直接把选项编码进 URL 的 hash，方便发给同学（不经过任何服务器） */
  function encodeOptions(options) {
    const list = parseOptions(options);
    if (!list.length) return '';
    return '#' + encodeURIComponent(JSON.stringify(list));
  }

  /** 从 hash 还原选项；没有 hash 时返回空数组，交给调用方回退到默认场景 */
  function decodeHash(hash) {
    if (!hash) return [];
    const raw = String(hash).replace(/^#/, '');
    if (!raw) return [];
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parseOptions(parsed);
  }

  /** 历史记录里的时间戳：只留时分，够用了 */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--:--';
    const pad = (n) => String(n).padStart(2, '0');
    return pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  /** 往历史里追加一条，只保留最近 limit 条（新的在前） */
  function pushHistory(history, entry, limit) {
    const max = Number.isInteger(limit) && limit > 0 ? limit : 5;
    const list = Array.isArray(history) ? history.slice() : [];
    list.unshift(entry);
    return list.slice(0, max);
  }

  return {
    MAX_OPTIONS,
    MIN_OPTIONS,
    DEFAULT_SCENES,
    normalizeOption,
    parseOptions,
    isUsable,
    pickIndex,
    encodeOptions,
    decodeHash,
    formatTime,
    pushHistory,
  };
});
