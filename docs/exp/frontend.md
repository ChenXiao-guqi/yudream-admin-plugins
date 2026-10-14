# 前端经验：YD、管理页与响应式验收

> **适用范围**：插件 Vue Web 前端、共享组件消费与移动端验收。
> **目标**：记录常见静默降级、组件契约和真实尺寸问题。

## 1. 组件契约

### 插件页面使用本地组件时壳体未渲染

- **现象**：插槽内容可见但按钮/表单/弹层触发器等组件行为消失。
- **根因**：插件远程包不继承宿主 auto-import，本地兄弟组件漏掉显式 import。
- **规避**：所有 `@yudream/components` 与本地组件显式 import；不能只依赖模板标签名。
- **来源**：主仓 `unresolved-local-component-silent-degrade`。

### 插件 CSS 覆盖宿主同名工具类

- **现象**：宿主 YD 弹窗响应式宽度在插件页失效，或插件 class 抢占宿主工具类。
- **根因**：旧插件样式未置 cascade layer。
- **规避**：消费已发布 SDK ≥1.6.0 的 `yuDreamPluginUnoCss()` 并重建 `style.css`，层序为 `yudream-base < yudream-plugin < host utilities`。
- **来源**：主仓 `plugin-remote-style-injection`。

### 选择器把空值显示成首项

- **现象**：数据尚未选择，但下拉框看起来已选第一项；多选不可取消标签。
- **根因**：展示层 fallback 与 model 不一致，或套用了 Arco Select 的不兼容参数。
- **规避**：使用已发布 YdSelect 的真实契约：空值显示无选择、multiple 全标签回显且可取消；搜索为本地过滤，远程分页用 YdTablePicker。
- **来源**：主仓 `yd-select-selection-feedback`；UI guideline 同步副本。

## 2. 管理数据布局

### 用户删除末页记录后页面停留空白

- **现象**：删除本页最后一行成功，列表回刷为空，但更前页仍有数据。
- **根因**：删除后只刷新，没有回退 page。
- **规避**：删除后重拉；若当前页空且 page>1，page--/clamp 后再拉；保留当前筛选。
- **来源**：`docs/dev/plugin-development.md` 管理数据约定。

### 管理记录少时未做分页，线上列表被截断

- **现象**：测试只有 5 条所以看似完整，线上记录增长后部分不可见或只取固定 100 条。
- **根因**：依据当前 fixture 数量而非集合最大可能规模判断是否分页。
- **规避**：可超过 5 条的管理集合强制 API 分页+total；服务端分页应覆盖筛选统计、total 和末页修正。
- **来源**：主仓 `record-list-pagination`；插件 `management-pages.md` 迁移规范。

### 卡片布局堆在一起且手机按钮重叠

- **现象**：页面逻辑正确，但标题、筛选、表格、分页和行操作挤成一个连续块，窄屏按钮互相覆盖。
- **根因**：把间距当装饰，而不是可读性和触控目标的一部分。
- **规避**：一页一条主要工作流；过滤器用 responsive grid + gap；独立管理域拆 route；关键按钮允许 wrap；在实际窄 viewport 检查文本与操作边界，允许纵向滚动。
- **来源**：插件页组合规范 `page-composition.md` 迁移；YD guideline。

### 禁用统一工具只为通过 YD 审查

- **现象**：把已有控件换成名字相似的 YD 标签后，模型、键盘、插槽或弹层功能丢失；或直接增加 lint exception。
- **根因**：未核对已发布公开类型与 SDK host bridge，将名字相近当契约相同。
- **规避**：先读已发布组件公开 API/bridge；能力缺失先宿主封装 typed YD、更新预览和静态检查、发版验签，最后插件仓升级 catalog/lockfile；不复制宿主实现、不从工作区生成违规基线。
- **来源**：主仓 `yd-ui-only-design-contract`；`docs/dev/plugin-development.md`。

## 3. 图标与响应式验收

### 图标名无效导致按钮空白

- **现象**：YdIcon/FaIcon 留白，无错误。
- **根因**：图标名未在当前图标包收录，缺失时静默渲染空。
- **规避**：以仓库已安装图标名清单核验；用 YdIcon/Morphicons 已支持项，不凭 lucide 命名猜包名。
- **来源**：主仓 `faicon-missing-ri-icons`。

### 插件工作台卡片窄屏内容被裁掉

- **现象**：宽屏正常，390/320px 下文字或操作超出容器或被隐藏。
- **根因**：只按 viewport 断点布局，忽视卡片本身用户可调尺寸与 grid 子项默认 min-width。
- **规避**：测试桌面与 390/320px、默认/最小/宽矮/宽高卡片尺寸；网格轨道用 `minmax(0,1fr)`，可收缩子项 `min-width:0`；检查 scroll/client 尺寸与按钮边界，不以隐藏滚动条代替修复。
- **来源**：主仓 `dashboard-all-card-size-audit`、`dashboard-legacy-stack-lg-only`。
