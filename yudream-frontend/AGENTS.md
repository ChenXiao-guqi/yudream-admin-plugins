# YuDream Admin Plugin Frontend

> **适用范围**：本仓 `yudream-frontend/` 中的 Vue Web remote 与 React Native 插件包。
> **目标**：提供前端工作入口；本仓硬规则以根 `../AGENTS.md` 与 `../docs/dev/` 为准。

## 1. 工程概览

- Vue Web 插件位于 `packages/plugin-{code}`；React Native 插件独立使用 `@yudream/plugin-mobile-ui`，不导入 Vue YD。
- Workspace 只包含 `packages/plugin-*`；不依赖宿主 workspace、本地源码或宿主 app。
- Vue Web 组件权威规范在主仓 `D:/code/yudream-admim/docs/yd-ui-guidelines.md`，本仓副本 `../docs/yd-ui-guidelines.md`。

## 2. 必须遵守

1. UI 工作前读根 `../AGENTS.md`、`../docs/dev/plugin-development.md`、`../docs/yd-ui-guidelines.md`。
2. Vue Web 业务只用已发布 `@yudream/components` 公开 `Yd*`/`useYd*`，显式导入并经 SDK shared bridge；禁止 Fa/裸 Arco/TDesign/Reka、别名和手写通用交互。缺能力先主仓封装、同步导出/resolver/SDK bridge/preview、发布验签，再更新本仓 catalog/lockfile。
3. 用户面 `/me/**` 与管理面 `/admin/**` 分开 routes/pages/API/store；个人数据始终只按当前 principal，管理员在用户面不获得跨用户权限。
4. 可增长管理列表必须 API 分页；比较型数据使用 `YdResponsiveTable` + `#card`，使用 `YdPagination`，不以装饰卡片代替表格。
5. 每个 route 映射独立真实 page，不按 path/meta 猜页面；一页一条主业务流，长流程独立 route。
6. Long/Snowflake ID 保持 string；禁止 `Number(id)` 和数值表单控件。
7. 组件契约变更/规范约束性修改要检查主仓 `docs/dev/repo-sync.md`，命中即同一工作项同步主仓文件与 `docs/yd-ui-guidelines.md` 副本；本仓副本不得成为新事实来源。
8. 目标包 typecheck/build；跨插件、依赖、打包或发布变化运行根 `ci/verify-plugin-repo-readiness.sh`。

## 3. 前端组织与适配

- Composition API + `<script setup lang="ts">`；`src/api` 放 SDK wrappers，`components` 放复用 UI，`composables` 放有状态 workflow，`pages` 放真实 route pages，`index.ts` 导出 remote contract，`types.ts` 放共享模型。
- 插件不继承宿主 auto-import；shared components 显式从包根入口导入。API wrapper 使用 host SDK，不创建私有 axios/fetch 或写死宿主 origin。
- 业务页面保持 loading/empty/error/disabled/success states，表单防重复提交并显示后端错误，modal/drawer 关闭时清临时状态；窄屏检查内容、按钮与操作区不重叠。
- 用户/管理员 API、页面和状态缓存分开；账号切换、logout、plugin unload 清个人缓存。

## 4. 常用命令

```powershell
pnpm install --frozen-lockfile
pnpm --filter @yudream/plugin-{code} run typecheck
pnpm --filter @yudream/plugin-{code} run build
```

纯文档改动不升插件版本；行为变更按根 `../docs/dev/conventions.md` 更新受影响插件 SemVer 与 `releaseNotes`。
