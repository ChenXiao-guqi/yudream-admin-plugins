# 插件经验库索引

> **适用范围**：官方插件开发、打包、依赖与用户验收中已确认的可复用问题。
> **目标**：留下精简诊断路径；规范正文以主仓 `docs/dev/` 和本仓 `docs/dev/` 为准。

## 1. 条目格式

每条记录四项：**现象**、**根因**、**规避**、**来源**。根因必须有证据，不记录推测。经验形成硬规则后提炼进 `docs/dev/plugin-development.md`，经验文件只保留快速定位信息。

## 2. 分类

| 文件 | 主题 |
|---|---|
| [plugin.md](plugin.md) | 生命周期、依赖、后端打包、插件前端远程加载 |
| [frontend.md](frontend.md) | YD 组件、管理页、响应式与真实 UI 验收 |
| [access.md](access.md) | `/me` 与 `/admin`、权限/owner、数据泄漏 |
| [release.md](release.md) | SPI/SDK/components 版本、Nexus、tag 发布 |
