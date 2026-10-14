# 插件经验：依赖、生命周期与产物

> **适用范围**：插件后端 JAR、宿主插件生命周期及远程前端产物。
> **目标**：记录依赖加载、编译、发布和运行环境的高频定位线索。

## 1. 插件依赖

### 适配器 reload 报 StackOverflowError 或 SOE

- **现象**：插件启停/重载递归溢出，或消费者在提供方启用后出现 `NoClassDefFoundError`。
- **根因**：`depend/softdepend` 图成环；或 consumer load 时快照依赖 ClassLoader，provider 后启用不会更新快照。
- **规避**：依赖图必须无环，适配器不反向依赖 softdepend 自己的业务插件；更换 provider JAR 前先 unload consumer，按依赖顺序 reload/enable。
- **来源**：主仓 `docs/dev/plugin-system.md`；`plugin-softdepend-acyclic`。

### 提供方 API 被消费插件重复打包

- **现象**：provider reload 后 cast 失败/类身份不一致，或 JAR 包含 provider API 副本。
- **根因**：consumer shade/relocate/复制 provider `*.api`，类由不同 ClassLoader 定义。
- **规避**：API 由 provider JAR 唯一拥有；consumer 用 `provided` 编译、plugin.yml 声明依赖并经 context.service 访问；热重载先停卸 consumer。
- **来源**：主仓 `docs/dev/plugin-system.md`。

## 2. 构建与发布物

### 源码编译通过，开发模式启动缺 SDK 类

- **现象**：Maven compile 正常，但插件运行出现 `NoClassDefFoundError`。
- **根因**：Dev ClassLoader 只加载 `target/classes` 与 `target/plugin-dev/lib/*.jar`；普通 compile 未导出运行时依赖。
- **规避**：采用宿主登记的 `mvn -q compile -DskipTests -P dev-export`；依赖变化后显式 `-am -P dev-export package -DskipTests`，生产 shaded JAR 仍需内含第三方类。
- **来源**：主仓 DevTools 规则 `docs/dev/plugin-system.md`；`plugin-devmode-compile-export`。

### 代码已更新但浏览器仍运行旧 remoteEntry

- **现象**：dist 更新/Java 插件已 reload，前端页面仍显示旧版本。
- **根因**：浏览器按 URL 缓存 ESM import；只发 SSE 或使用冻结 assetRevision 不会改变 URL。
- **规避**：走独立 frontend-reload，使 manifest entry URL 带时间戳 query；刷新动态路由时防抖 `refreshDynamicRoutes`。
- **来源**：主仓 `plugin-frontend-reload-esm-cache`；`docs/dev/plugin-system.md`。

### JAR 有 remoteEntry 但资源加载失败

- **现象**：页面 chunk/CSS/图片 404，或动态 chunk 被当脚本重复执行。
- **根因**：Vite base 绝对化指向宿主，或宿主通配扫描整个 assets 目录。
- **规避**：Vite 使用相对资源路径；最终 JAR 检查 `META-INF/yudream-plugin/frontend/{code}`；只让 ESM 按需拉动态 chunk，禁止 `assets/**` 通配加载。
- **来源**：`docs/dev/plugin-development.md`。

### 相同插件版本替换 JAR 后行为未变

- **现象**：上传同版本 JAR 或调用 enable 后看不到代码更新。
- **根因**：版本字符串相同且 JVM 仍持有旧 ClassLoader；enable 不会重编译或刷新加载类。
- **规避**：确认构建 JAR 字节/loadedAt，按 unload/load 替换并验收；必要时先重新构建依赖包。
- **来源**：主仓 `Runtime plugin version check`。

## 3. 热重载调试边界

### 沙盒命令面板没有异常堆栈

- **现象**：插件指令已捕获并吞掉异常，但宿主 timeline 没报错。
- **根因**：宿主只能观察逃逸异常或插件自身日志，不能知道未记录的内部 catch。
- **规避**：插件记录异常；界面只呈现实际可观测状态，不宣称宿主能捕获所有插件内错误。
- **来源**：主仓 `qq-sandbox-error-diagnostics`。

### DevTools 调试事件影响真实消息连接

- **现象**：沙盒调试输出落到真实群/连接，或身份模拟影响真实账户。
- **根因**：使用生产 connectionId 处理输出，未区分 policy read connection 与 synthetic output connection。
- **规避**：调试连接使用 `devtools-sandbox:{sessionId}`；真实 connection 只读策略和历史，输出通过 synthetic 连接截获；沙盒作用域禁止真实绑定/资料写入。
- **来源**：主仓 `qq-sandbox-synthetic-connection`、`qq-sandbox-identity-simulation`。
