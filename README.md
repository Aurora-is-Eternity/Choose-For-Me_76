# Choose-For-Me · 别纠结了，让转盘决定

> 零依赖、不联网、不收集数据的决定转盘。选择留给随机，**理由留给你自己**。

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![deps](https://img.shields.io/badge/runtime%20deps-0-success.svg)](package.json)
[![tests](https://img.shields.io/badge/tests-26%20passed-success.svg)](test)

「今天吃什么」「周末干什么」「谁去买单」——这类问题的正确答案往往不存在，
存在的只是**决定本身**。转盘不解决选择困难，它只负责让纠结在 3 秒内结束。

## 它是什么

一个纯静态网页：双击 `index.html` 就能用，也可以扔到任意静态托管上。
四个内置场景、可自定义选项、可把选项编码进链接发给同学、最近决定留个记录。

## 为什么要做它

市面上不缺转盘，缺的是不打扰的转盘：

| 现有产品的常见做法 | 本项目 |
| --- | --- |
| 开屏广告、激励视频 | 没有广告，也没有广告位 |
| 要登录、要手机号、要授权 | 打开就能用，没有任何账号体系 |
| 选项存在服务器上，随时可能消失 | 选项存在你自己的浏览器里，还能用链接传给别人 |
| 转完让你「分享给好友助力」 | 转完就是转完了 |
| 代码不可见、规则不可查 | MIT 许可证，规则全在仓库里 |

## 快速开始

**方式一（最省事）**：克隆下来双击 `index.html`。

```bash
git clone https://github.com/Aurora-is-Eternity/Choose-For-Me_76.git
cd Choose-For-Me_76
# 双击 index.html，或者：
```

**方式二（本地起个服务，方便手机同网段访问）**：

```bash
npm start        # 零依赖，起在 http://localhost:4173
```

**方式三（跑测试）**：

```bash
npm test         # 26 个用例，node:test，无测试框架依赖
```

## 怎么用

1. 选场景：吃什么 / 干什么 / 谁来做 / 宵夜吃啥；
2. 想改选项：在编辑框里一行一个（也支持逗号、顿号、分号、竖线分隔），点「应用到转盘」，本机会自动记住；
3. 想换回默认：点「恢复本场景默认」；
4. 想发给别人：点「复制分享链接」，选项会编码进 URL 的 `#` 后面，对方打开就是你这一组选项；
5. 键盘党：焦点不在输入框时，空格或回车直接开转。

## 内置选项库

| 场景 | 选项数 | 说明 |
| --- | ---: | --- |
| 🍜 吃什么 | 10 | 正餐语境，含火锅、烤肉、麻辣烫、烧烤 |
| 🎯 干什么 | 7 | 周末与摸鱼时间 |
| 🙋 谁来做 | 6 | 宿舍与小组的经典分配难题 |
| 🌙 宵夜吃啥 | 7 | 晚十点之后的宿舍主战场 |

选项库是这个项目唯一「越用越值钱」的部分，欢迎用 Issue 投稿（见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

## 设计取舍

| 决定 | 为什么 | 代价 |
| --- | --- | --- |
| 不引入任何运行时依赖 | 打开即用、可离线、十年后还能跑 | 没有框架的便利，DOM 操作要自己写 |
| 不打包、不转译 | 源码就是产物，审阅成本最低 | 不能用 npm 生态的高级语法 |
| 选项存 localStorage + URL hash | 不需要后端，也不需要账号 | 换设备不同步（这是有意的） |
| 选项上限 24 条 | 超过 24 格字会挤成一团，随机也失去可读性 | 极端场景下不够用 |
| 尊重 `prefers-reduced-motion` | 前庭敏感用户不该被强制看动画 | 少了一点仪式感 |
| 使用 SVG 而非 Canvas | 可缩放、可访问、可读的 DOM | 格数极多时性能不如 Canvas |

## 项目结构

```text
Choose-For-Me_76/
├── index.html              # 页面骨架
├── style.css               # 全部样式（含深色模式与无动画降级）
├── src/
│   ├── core.js             # 纯逻辑：选项解析、随机抽取、hash 编解码（可用 node:test 直接测）
│   ├── wheel.js            # 转盘绘制与旋转动画（SVG）
│   └── ui.js               # 界面装配：场景、编辑、分享、历史
├── scripts/serve.js        # 零依赖本地预览服务器
├── test/core.test.js       # 26 个用例
├── docs/                   # 五看三定、分支实践、许可证决策、Issue 草案
└── .github/                # Issue / PR 模板、CI、Dependabot
```

## 浏览器支持

Chrome / Edge / Firefox / Safari 近两年版本均可。用到的能力：
`<svg>`、CSS 自定义属性、`localStorage`、`URL hash`、`prefers-reduced-motion`、
`navigator.clipboard`（不可用时降级为直接显示链接）。

## 已知取舍与不做的事

- **不做账号与云同步**：一旦有账号，就要处理登录、找回、隐私，收益远小于成本；
- **不做后台统计**：没有埋点，所以你看到的「最近决定」只有你自己那份；
- **不做「AI 帮你决定」**：那会重新引入一个你不知道理由的答案，与项目立场相反。

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)：分支模型、提交规范、怎么投稿选项、冲突怎么处理。
行为准则见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)，安全问题见 [SECURITY.md](SECURITY.md)。

## 许可证

[MIT](LICENSE) —— 随便用、随便改、别告我就行。
为什么选 MIT 而不是 GPL / Apache-2.0，写在 [docs/许可证选择.md](docs/许可证选择.md)。
