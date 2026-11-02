'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wheel = require('../src/wheel.js');

test('中文按两个显示宽度计，英文按一个', () => {
  assert.equal(wheel.displayWidth('abc'), 3);
  assert.equal(wheel.displayWidth('吃什么'), 6);
  assert.equal(wheel.displayWidth('a火锅b'), 6);
});

test('truncate 按显示宽度截断并保留省略号列宽', () => {
  assert.equal(wheel.truncate('abcdefgh', 5), 'abcd…');
  assert.equal(wheel.truncate('火锅烧烤麻辣烫', 5), '火锅…');
  assert.equal(wheel.truncate('短', 5), '短');
  // 8 列预算扣掉省略号后剩 7；「刚好四」=6，「字」再加就超了
  assert.equal(wheel.truncate('刚好四字啦', 8), '刚好四…');
});

test('扇区越多，标签可用列宽越短，避免 16+ 格重叠', () => {
  const wide = wheel.labelMaxWidth(8);
  const mid = wheel.labelMaxWidth(16);
  const tight = wheel.labelMaxWidth(20);
  assert.ok(wide > mid);
  assert.ok(mid >= tight);
  assert.ok(mid <= 5, '16 格时弧长只能放下大约 5 个拉丁列，不能再固定截 5 个汉字');
  assert.ok(tight >= 1);
});

test('20 个长中文选项截断后不超过该扇区预算', () => {
  const max = wheel.labelMaxWidth(20);
  const label = wheel.truncate('超级无敌好吃的麻辣烫套餐', max);
  assert.ok(wheel.displayWidth(label) <= max);
  assert.ok(label.endsWith('…') || wheel.displayWidth(label) <= max);
});
