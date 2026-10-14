# 插件前端工程规则

本文件适用于本仓 `yudream-frontend`。同时遵守根 [AGENTS.md](../AGENTS.md) 与 [YD 视觉与组件使用规范](../docs/yd-ui-guidelines.md)。后者是宿主仓同名文档的同步副本；组件选型和视觉规则变化时，先维护宿主权威文档，再在同一工作项同步本副本、AGENTS 与 `.codex/skills/yudream-plugin-development/` 相关 reference。

## Vue Web 组件边界

- 业务只使用已发布 `@yudream/components` 的公开 `Yd*` / `useYd*`，显式导入并通过 SDK 共享桥消费宿主实例；不继承宿主 auto-import。
- 宿主与插件已迁移的 Vue Web 规范门禁保持零违规；保留 findings={} 与验收 Git SHA，不得重新放回历史例外。基线只能从明确已提交版本生成。
- 禁止业务直接使用 Fa、Arco、TDesign、Reka 等通用控件或局部别名，禁止原生通用交互与页面私有加载/通知/选择弹窗。语义内容、真实链接和纯布局元素可以保留；技术引擎必须经 YD adapter。
- 无组件时先在宿主封装，核对模型、事件、插槽、实例方法、主题与弹层，完成公开导出、SDK 共享桥与预览；components/SDK 发布验签通过后才更新本仓 catalog/lockfile。不得复制宿主代码、依赖本地宿主 workspace 或填写未发布版本。
- 普通管理使用 `YdPageHeader`/`YdPageMain`、基础表单控件与 `YdResponsiveTable #card`；短编辑/确认用 `YdModal`，上下文详情用 `YdDrawer`，轻量锚点交互用 `YdPopover`，远程分页选人/资源用 `YdTablePicker`，独立长流程使用路由页。
- 少量选项用 `YdSelect`/`YdRadioGroup`，可见多选用 `YdCheckboxGroup`，搜索单选用 `YdCombobox`，单值路径用 `YdCascader`，层级浏览/勾选用 `YdTree`。需要完整多选、远程搜索、异步树或拖拽时先检查契约，缺失先封装，不机械替换。
- 阶段用 `YdSteps`，顺序任务用 `YdMultiStepLoader`，进度用 `YdProgress`，历史用 `YdTimeline`。装饰仅强调少量重点，不遮挡表单、表格、错误与危险确认。三套外观中功能动画保持运行。
- 使用声明式 `style.css` 与 SDK UnoCSS 插件，保持 `yudream-base < yudream-plugin < 宿主工具类` 层级；禁止手写 style 注入、固定主色与业务私有激活色。支持明暗、三套外观、窄屏、键盘、焦点及全状态。

## React Native 适配边界

`plugin-*-mobile`、`plugin-mobile-ui` 与 `plugin-sdk-mobile` 采用 React Native，不能导入 Vue YD。业务通用交互复用独立的 `@yudream/plugin-mobile-ui`；缺少能力先扩展该共享 adapter，继承宿主移动 theme tokens、无障碍、加载/错误/禁用状态与资源清理约定。此边界不豁免 Web 业务的 YD-only 规则。

## 工作流程

读取 `.codex/skills/yudream-plugin-development/SKILL.md` 及对应 reference；检查匹配后端元数据、远程入口、Vite 与打包配置。规范同步 → 契约包发布与 verify → 已发布依赖同步 → 按模块迁移与验证，不跳过契约边界。保留已有改动，每个独立模块完成目标 typecheck/lint 和 build 后创建中文提交；未获授权不 push/tag/发布。前端包行为变化按根规则同步受影响插件版本与 releaseNotes，纯文档不升版。
