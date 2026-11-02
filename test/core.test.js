'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const CFM = require(path.join(__dirname, '..', 'src', 'core.js'));

/* ---------------- 选项清洗 ---------------- */

test('去首尾空白，连续空白压成一个空格', () => {
  assert.equal(CFM.normalizeOption('  吃  火锅  '), '吃 火锅');
});

test('非字符串输入返回空串而不是报错', () => {
  assert.equal(CFM.normalizeOption(null), '');
  assert.equal(CFM.normalizeOption(42), '');
  assert.equal(CFM.normalizeOption(undefined), '');
});

test('控制字符被替换成空格', () => {
  assert.equal(CFM.normalizeOption('火\u0000锅'), '火 锅');
});

/* ---------------- 文本 → 选项列表 ---------------- */

test('支持换行、中文逗号、顿号、分号、竖线五种分隔符', () => {
  const parsed = CFM.parseOptions('火锅\n烤肉，日料、麻辣烫;烧烤|螺蛳粉');
  assert.deepEqual(parsed, ['火锅', '烤肉', '日料', '麻辣烫', '烧烤', '螺蛳粉']);
});

test('空行与纯空白行被丢弃', () => {
  assert.deepEqual(CFM.parseOptions('火锅\n\n   \n烤肉'), ['火锅', '烤肉']);
});

test('重复选项只保留第一个（忽略大小写）', () => {
  assert.deepEqual(CFM.parseOptions('Pizza\npizza\nPIZZA'), ['Pizza']);
});

test('数组输入同样会被清洗和去重', () => {
  assert.deepEqual(CFM.parseOptions([' 火锅 ', '火锅', '', '烤肉']), ['火锅', '烤肉']);
});

test('超过 24 个选项时截断', () => {
  const many = Array.from({ length: 40 }, (_, i) => 'option-' + i);
  assert.equal(CFM.parseOptions(many).length, CFM.MAX_OPTIONS);
});

test('空输入返回空数组', () => {
  assert.deepEqual(CFM.parseOptions(''), []);
  assert.deepEqual(CFM.parseOptions('   '), []);
  assert.deepEqual(CFM.parseOptions(null), []);
});

/* ---------------- 可用性判定 ---------------- */

test('至少两个选项才可用', () => {
  assert.equal(CFM.isUsable(['a']), false);
  assert.equal(CFM.isUsable(['a', 'b']), true);
  assert.equal(CFM.isUsable([]), false);
  assert.equal(CFM.isUsable(null), false);
});

/* ---------------- 随机抽取 ---------------- */

test('注入 rng 时结果可预测', () => {
  assert.equal(CFM.pickIndex(4, () => 0), 0);
  assert.equal(CFM.pickIndex(4, () => 0.5), 2);
  assert.equal(CFM.pickIndex(4, () => 0.999999), 3);
});

test('抽取结果永远落在合法区间内', () => {
  for (let i = 0; i < 500; i += 1) {
    const index = CFM.pickIndex(7);
    assert.ok(index >= 0 && index < 7, '越界：' + index);
  }
});

test('分布大致均匀（大样本偏差不超过 10%）', () => {
  const count = 10;
  const buckets = new Array(count).fill(0);
  const rounds = 20000;
  for (let i = 0; i < rounds; i += 1) buckets[CFM.pickIndex(count)] += 1;
  const expected = rounds / count;
  for (const [index, value] of buckets.entries()) {
    const drift = Math.abs(value - expected) / expected;
    assert.ok(drift < 0.1, '第 ' + index + ' 格偏差 ' + (drift * 100).toFixed(1) + '%');
  }
});

test('非法 count 或 rng 明确报错，而不是悄悄给出错误结果', () => {
  assert.throws(() => CFM.pickIndex(0), RangeError);
  assert.throws(() => CFM.pickIndex(2.5), RangeError);
  assert.throws(() => CFM.pickIndex(3, () => 1), RangeError);
  assert.throws(() => CFM.pickIndex(3, () => NaN), RangeError);
});

/* ---------------- 分享链接 ---------------- */

test('编码后的 hash 能被原样解回来（含中文与特殊字符）', () => {
  const options = ['吃火锅', '吃烤肉', 'Who pays?', '50% 概率'];
  const hash = CFM.encodeOptions(options);
  assert.ok(hash.startsWith('#'));
  assert.deepEqual(CFM.decodeHash(hash), options);
});

test('编码会顺带完成清洗与去重', () => {
  const hash = CFM.encodeOptions('火锅, 火锅 , 烤肉');
  assert.deepEqual(CFM.decodeHash(hash), ['火锅', '烤肉']);
});

test('没有选项时不生成 hash', () => {
  assert.equal(CFM.encodeOptions([]), '');
  assert.equal(CFM.encodeOptions('   '), '');
});

test('空 hash 返回空数组', () => {
  assert.deepEqual(CFM.decodeHash(''), []);
  assert.deepEqual(CFM.decodeHash('#'), []);
  assert.deepEqual(CFM.decodeHash(undefined), []);
});

/* ---------------- 历史记录 ---------------- */

test('新记录排在最前，且只保留最近 5 条', () => {
  let history = [];
  for (let i = 1; i <= 7; i += 1) {
    history = CFM.pushHistory(history, { text: '第' + i + '次', at: i });
  }
  assert.equal(history.length, 5);
  assert.equal(history[0].text, '第7次');
  assert.equal(history[4].text, '第3次');
});

test('历史条数上限可自定义', () => {
  const history = CFM.pushHistory([{ text: 'a' }], { text: 'b' }, 2);
  assert.equal(history.length, 2);
  assert.equal(history[0].text, 'b');
});

test('时间戳格式化失败时降级为占位符', () => {
  assert.match(CFM.formatTime(Date.now()), /^\d{2}:\d{2}$/);
  assert.equal(CFM.formatTime('not-a-date'), '--:--');
});

/* ---------------- 内置场景 ---------------- */

test('内置场景结构完整：有 id、有标签、至少 5 个选项', () => {
  assert.ok(CFM.DEFAULT_SCENES.length >= 3);
  for (const scene of CFM.DEFAULT_SCENES) {
    assert.equal(typeof scene.id, 'string');
    assert.ok(scene.id.length > 0);
    assert.ok(scene.label.length > 0);
    assert.ok(Array.isArray(scene.options));
    assert.ok(scene.options.length >= 5, scene.id + ' 的选项太少');
  }
});

test('场景 id 不重复', () => {
  const ids = CFM.DEFAULT_SCENES.map((scene) => scene.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('内置选项本身也是干净的（无重复、无空串）', () => {
  for (const scene of CFM.DEFAULT_SCENES) {
    assert.deepEqual(CFM.parseOptions(scene.options), scene.options);
  }
});
