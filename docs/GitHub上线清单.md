# GitHub 上线清单

这份清单是本项目从「本地能跑」到「别人能看、能用、能参与」的完整步骤。
第 1～3 节已经完成，第 4 节及以后是维护期要做的事。

## 1. 创建仓库（已完成）

- 仓库名：**`Choose-For-Me_76`**（作业要求：`项目名称_学号后两位`，学号 2025131076 → 76）
- 可见性：**Public**
- 许可证：MIT
- **不要**勾选 Add README / .gitignore / license —— 本地已经有，勾了会产生无关的初始提交

## 2. 关联远端并推送（已完成）

```bash
git remote add origin https://github.com/Aurora-is-Eternity/Choose-For-Me_76.git
git push -u origin main
git push origin --all     # 连 5 条历史分支一起推，评审要看分支证据
git push origin --tags
```

## 3. 仓库设置（已完成）

- **Description**：零依赖、离线的决定转盘：今天吃什么、周末干什么，转一下就有答案
- **Topics**：`wheel` `decision` `random` `picker` `vanilla-js` `offline` `zero-dependency`
  `open-source` `education`
- 开启 **Issues** 与 **Discussions**
- **保护 main 分支**：需 PR + 至少 1 个 approving review + `test (node 22)` / `test (node 24)` 通过

## 4. 发 Issue 并邀请同学（要求第 4 条）

`docs/issue草案.md` 里已经写好 5 条可直接粘贴的 Issue，最短路径：

1. 打开 <https://github.com/Aurora-is-Eternity/Choose-For-Me_76/issues/new>，先建 #1、#2；
2. 把下面的话术发到班级群；
3. 逐条回复评论，并把 #1 标成 `good first issue`。

### 邀请话术（可直接复制）

> 打扰一下，我期末开源项目想求几位同学帮忙：
>
> 我做了一个**零依赖、无广告、不收集数据**的「决定转盘」，专治今天吃什么的纠结：
> https://github.com/Aurora-is-Eternity/Choose-For-Me_76
>
> 拜托两件事，30 秒能搞定：
> 1. 点个 ⭐ Star（想持续看更新就顺手 Watch）；
> 2. 到 Issues 里说一个你想加的选项（比如「去老板办公室跳舞」），我审核后就合并进默认选项库。
>
> 你们的 Issue 会直接变成代码里的选项，谢谢！

## 5. 发布 Release（已完成）

- `v1.0.0`：首个可用版本
- `v1.1.0`：宵夜场景、键盘操作、坏链接白屏修复；正文取自 `CHANGELOG.md`

## 6. 评审要看的三处证据

| 要求 | 点开哪里 |
| --- | --- |
| 分支管理 | `/branches`（9 条分支）、`/network`、合并提交 `42449f7` |
| 冲突解决 | `git show 42449f7`、`docs/分支管理实践.md` |
| 社区互动 | `/issues`（同学评论）、Star / Watch 数 |

## 7. 维护期节奏

- 每周一：处理 Dependabot 的 actions 升级 PR；
- 每个 Release：更新 CHANGELOG、打附注标签、在 Release 页面写「这一版解决了谁的什么问题」；
- 每季度：回看一次「不做清单」，确认没有因为功能膨胀而破坏零依赖与无广告的定位。
