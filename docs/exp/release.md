# 发布经验：契约同步与插件发布

> **适用范围**：宿主 SPI/SDK/components 契约发布、插件 catalog 与 tag 发行。
> **目标**：避免消费未发布契约和 tag/版本错位；操作流程以主仓 `docs/dev/contract-release.md` 为准。

## 1. 契约先发后用

### 主仓本地可编译，插件仓无法独立解析契约

- **现象**：插件模块在主仓 reactor 中可 build，插件仓独立 Maven/pnpm 构建失败。
- **根因**：SPI 只存在于本地 reactor/Maven cache，或 SDK/components 新版本尚未 publish+verify。
- **规避**：插件仓只升级已发布并在 Nexus 可解析、验签通过的版本；SPI 改主仓后先走 tag pipeline 发布/验签；前端 catalog 改后更新 lockfile。
- **来源**：主仓 `docs/dev/contract-release.md`；本仓 dependency boundary。

### 改组件后插件直接升级了工作区版本

- **现象**：本地 workspace 可运行，独立安装或生产宿主却找不到 YD 导出。
- **根因**：把源码目录/未发布版本当成已发布契约。
- **规避**：host component + SDK bridge 都完成并发布验签后，才改插件仓 catalog 和 lockfile；禁止 file:、host alias 或复制源码。
- **来源**：主仓 `yd-ui-only-design-contract`；`docs/dev/plugin-development.md`。

## 2. Tag 与版本选择

### 业务插件版本与发布 tag 被错误要求一致

- **现象**：为对齐 `v*` tag，把无关插件一并升版或写错 releaseNotes。
- **根因**：将触发发布的 tag 当作单插件 SemVer。
- **规避**：各插件 pom/plugin.yml 独立 SemVer；实际发布范围由 `release/plugins.txt` 决定；只有受影响插件更新 releaseNotes；tag 是发布事件和全局 catalog 坐标，不要求等于插件版本。
- **来源**：`docs/dev/conventions.md` §4.1。

### tag pipeline 已通过但目标插件未发布

- **现象**：版本提交进了 master/tag，却没有对应 artifact 发布，或意外发了额外插件。
- **根因**：release/plugins.txt 未准确维护；发布流程不是基于 diff 自动选择。
- **规避**：每次发布 commit 检查清单仅含本次需发模块，运行 `ci/verify-plugin-release-selection.sh`；清单空/重复/模块不存在均为错误。
- **来源**：`docs/dev/conventions.md` §4.1。

### 失败 tag 需要重跑时试图移动标签

- **现象**：原失败 pipeline 修复后尝试覆盖同名 tag，造成发布审计/不可变性问题。
- **根因**：把 Git tag 当可移动分支。
- **规避**：失败 tag 不移动；使用新后缀 tag 重跑（先确认脚本版本门禁与 registry 幂等性）。
- **来源**：主仓 `docs/dev/contract-release.md` 与 CI release 经验。
