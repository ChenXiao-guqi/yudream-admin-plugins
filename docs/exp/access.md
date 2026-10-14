# 访问边界经验：个人数据、管理面与权限验证

> **适用范围**：插件 public/user/admin endpoint、页面、store 与持久数据。
> **目标**：防止管理员角色被错误当作个人数据范围扩张许可。

## 1. User/Admin 范围

### 管理员在个人页看到其他用户记录

- **现象**：普通用户只看到自己，管理员打开同一个 `/me/**` 页面却看到全站数据。
- **根因**：代码在 user endpoint 内按 `MANAGE_PERMISSION` 切换 owner 查询范围。
- **规避**：权限只决定是否进入，数据 scope 独立；`/me/**` owner 必须从 `request.principal().userId()` 推导，管理员访问 user 面仍只看到自己；跨用户只走 `/admin/**` + 管理权限 + 独立 use case/page。
- **来源**：主仓 `docs/dev/plugin-development.md` §4；原 `access-boundaries.md` 迁移。

### 个人 API 接受 userId 参数造成越权或旁路

- **现象**：用户可改 path/query/body userId 读取、删除他人记录；部分入口修复后下载/导出仍泄漏。
- **根因**：personal DTO 暴露 owner selector，或只保护页面主列表，未覆盖旁路。
- **规避**：personal request 不含 owner/user/member id；query/mutation 同时约束 resourceId+principalId；授权矩阵覆盖 total、分页、下载、导出、batch、options、SSE、文件。
- **来源**：主仓 `access-boundaries.md` 原 checklist；`docs/dev/plugin-development.md` §4。

### 管理员只能通过“登录为用户”维护用户数据

- **现象**：插件提供自助记录，但运营不能跨用户查找、修正、审核或归档。
- **根因**：只做 user-side CRUD，没有对应 admin lifecycle。
- **规避**：创建独立 admin list/detail 与适用的 create/edit/status/delete/archive/approve use case；集合可超 5 条必须后端分页；管理员操作做审计且遵守领域不变量。
- **来源**：插件 `access-boundaries.md` 原文迁移；`docs/dev/plugin-development.md` §4。

## 2. 个人缓存与 caller matrix

### 账号切换后显示前一用户缓存

- **现象**：登出/切账号后短暂看到前账号自助数据。
- **根因**：user 与 admin 共用 store/composable cache，或个人数据 cache 未带 principal scope。
- **规避**：user/admin API/store 分开；principal 切换、logout、impersonation 变化、插件 unload 时清空个人缓存。
- **来源**：原 `access-boundaries.md` frontend state 规则。

### 普通/管理员路径只测试了一个角色

- **现象**：普通用户路径测试通过，但管理员在 user route 可访问他人数据，或 admin endpoint 权限缺失。
- **根因**：没有覆盖角色与 surface 的交叉矩阵。
- **规避**：逐资源验证普通 user-own/other、普通访问 admin、管理员 user-own/other、管理员 admin target、未认证；其他下载/导出等旁路同样验证。
- **来源**：原 `access-boundaries.md` Authorization Test Matrix。
