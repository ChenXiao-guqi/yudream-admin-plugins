# Management Page Standard

Use this standard for Vue Web plugin pages that maintain repeated business records. Read repository `docs/yd-ui-guidelines.md` and use only verified released public YD entries through the SDK host shared bridge. React Native uses the independent mobile UI adapter. Changes to this standard must be synchronized with the host guideline, plugin copy, AGENTS and related skill/reference.

## Decide Whether This Is Managed Data

Treat a collection as managed data when users need one or more record-level operations:

- create or import;
- view details;
- edit or configure;
- enable, disable, publish, archive, revoke, or change status;
- delete or otherwise remove a record;
- filter, search, sort, select, or perform batch operations.

Do not apply CRUD controls to read-only summaries, activity feeds, tiny fixed option sets, dashboards, or data that users cannot maintain.

When records are owned by individual users, implement the administrator's cross-user collection as a separate management page under the admin surface. Follow `access-boundaries.md`; never turn the personal page into an admin page based on the current account's roles.

## Pagination Rule

- If managed data can exceed 5 total records, pagination is mandatory even when the current fixture or test data contains 5 or fewer records.
- Use server-side pagination for persisted, remote, permission-filtered, or growing collections. Send `page`, `size`, and filters and receive `records` plus `total`.
- Use client-side filtering and slicing only when the collection is explicitly bounded and already loaded for another valid reason.
- Use the framework pagination default of 10 records per page unless the product requires another size. Bind `page`, `size`, and `total` to `YdPagination`.
- Reset `page` to 1 when filters or page size change.
- After deletion, reload the data. If the current page becomes empty and `page > 1`, decrement or clamp the page and reload so the user never remains on an invalid empty page.
- Preserve active filters after create, edit, status changes, and delete unless the workflow explicitly requires clearing them.

## Choose A Table

Use `YdResponsiveTable` when records expose repeated comparable fields, such as name, code, owner, status, amount, time, category or operation state. Provide an explicit `#card` narrow-screen view preserving identity, important fields, permission-controlled row actions and selection. Use `YdTable` only for a deliberately desktop-only internal table. Do not hand-build separate desktop/mobile pagination, filters or selection state.

Do not use a card grid for normal administrative records when the same information naturally forms columns. Cards are appropriate only when spatial preview, imagery, rich visual identity, or non-columnar content is the primary task.

For hierarchical records with comparable columns, use the shared table tree contract rather than manually indented cards. Pure hierarchy browsing/checking uses `YdTree`. Missing async loading, drag/drop, sorting or selection capabilities must be encapsulated and published first; do not penetrate to a raw Arco tree/table.

## Framework Management Page Style

Use this structure:

1. `YdPageHeader` for the page title and page-level primary actions such as create, import, or export.
2. `YdPageMain` for the management surface.
3. `YdResponsiveTable` with:
   - `YdLoading`/`useYdLoading` for applicable waiting state and an accessible busy indication, while keeping loaded data available during refresh;
   - a stable `row-key`, normally the string ID;
   - `table-root-class="rounded-lg overflow-hidden"`;
   - an explicit `table-class="min-w-[...px]"` when columns require horizontal scrolling;
   - `border`, `stripe`, and `column-visibility` for standard management tables;
   - typed `TableColumn<T>[]` definitions with explicit widths for predictable layout;
   - an explicit `#card` view for the shared 768px narrow-screen behavior, preserving domain actions and meaningful fields.
4. `YdSearchBar class="w-full"` in the table `#toolbar` slot when filters or search are useful.
5. `YdPagination class="mt-3"` immediately below the table when pagination is required.

Use a responsive filter grid: one column on narrow screens, `minmax(200px, 1fr)` or task-specific tracks on desktop, and a right-aligned action group containing reset and search buttons. Search on Enter and reload on clear where appropriate.

Keep unrelated record types, settings, statistics, imports, exports, and complex editors out of the table page. Read `page-composition.md` and create another route when the capability has its own business goal or state. Use a modal only for focused create/edit commands; use a route page for long or multi-section forms.

## Column Style

- Put the primary identifying column first and fix it left when horizontal scrolling is likely.
- Render status/type values with `YdTag` rather than raw internal enum codes.
- Format dates, money, IDs, and empty values consistently. Display a deliberate `-` or the component empty state instead of `undefined`.
- Keep Java `Long`/Snowflake IDs as strings.
- Add the operation column last with `id: 'operation'`, header `操作`, centered alignment, an explicit width, and `fixed: 'right'` when the table scrolls horizontally.
- Use `#cell-operation` with the table row wrapper (`row.original`); use the raw row in `#card`. Keep a compact `flex-center gap-2` action group and preserve permissions in both views.
- Use `YdButton size="sm" variant="outline"` for edit and ordinary row actions.
- Use `YdButton size="sm" variant="destructive"` for delete, revoke or other genuinely destructive actions. Decide whether a reversible state change is destructive from its domain effect rather than mechanically styling every disable action as danger.
- Size the operation column to its real actions. Do not squeeze buttons until labels wrap or overlap.

## Management Actions

Implement actions justified by the domain rather than blindly adding every CRUD verb:

- Provide create/edit/delete for records users fully own and manage.
- Use disable, archive, revoke, or unpublish when hard deletion would violate history, references, audit, or recovery requirements.
- Provide view/details when the table cannot show the complete record.
- Protect page-level and row-level actions with matching backend and frontend permissions.
- Keep management actions on admin routes and personal actions on user routes. A management permission must not reveal admin actions or other users' records inside the user page.
- Disable or hide actions that do not apply to protected/system records, and explain failures returned by the backend.

## Delete And Destructive Flow

1. Open `useYdModal().confirm(...)` before the operation.
2. Name the affected record in the confirmation when possible.
3. State important consequences, such as retained child records or irreversible deletion.
4. Prevent duplicate submissions with an action loading/disabled state where latency is visible.
5. Call the SDK-backed API wrapper; do not issue an ad hoc request from the page.
6. Show `useYdToast()` success feedback only after the backend succeeds.
7. Reload the current filtered page and correct an empty last page.
8. Let useful backend business errors reach the standard error feedback path.

## Reference Shape

This is a composition sketch; explicitly import the released YD entries and define the typed business state, API workflow and matching permission checks. Read `YdResponsiveTable` public types before adapting existing table slots.

```vue
<YdPageHeader title="记录管理" class="mb-0">
  <YdButton @click="openCreate">
    <YdIcon name="i-ri:add-line" />
    新增记录
  </YdButton>
</YdPageHeader>

<YdPageMain>
  <YdLoading v-if="loading" />
  <YdResponsiveTable
    :aria-busy="loading"
    row-key="id"
    table-root-class="rounded-lg overflow-hidden"
    table-class="min-w-[960px]"
    border
    stripe
    column-visibility
    :columns="columns"
    :data="rows"
  >
    <template #toolbar>
      <YdSearchBar class="w-full">
        <!-- responsive filters plus reset/search actions -->
      </YdSearchBar>
    </template>
    <template #cell-operation="{ row }">
      <div class="flex-center gap-2">
        <YdButton size="sm" variant="outline" @click="openEdit(row.original)">编辑</YdButton>
        <YdButton size="sm" variant="destructive" @click="confirmDelete(row.original)">删除</YdButton>
      </div>
    </template>
    <template #card="{ row }">
      <YdCard>
        <div class="flex flex-col gap-3">
          <strong>{{ row.name }}</strong>
          <!-- Preserve the same important fields and permission checks as the desktop row. -->
          <div class="flex flex-wrap gap-2">
            <YdButton size="sm" variant="outline" @click="openEdit(row)">编辑</YdButton>
            <YdButton size="sm" variant="destructive" @click="confirmDelete(row)">删除</YdButton>
          </div>
        </div>
      </YdCard>
    </template>
  </YdResponsiveTable>

  <YdPagination
    v-model:page="pagination.page"
    v-model:size="pagination.size"
    :total="pagination.total"
    class="mt-3"
    @page-change="onPageChange"
    @size-change="onSizeChange"
  />
</YdPageMain>
```

Adapt fields and actions to the plugin domain, but preserve the component hierarchy, density, table treatment, action hierarchy, and pagination behavior.

## Review Checklist

- Is this managed data, and can it exceed 5 records?
- Is naturally tabular management data rendered with `YdResponsiveTable` and a complete narrow-screen `#card` view?
- Does pagination use real totals and correct page reset/clamping behavior?
- Are filters, loading, empty state, row key, column widths, and horizontal overflow handled?
- Are the operation column and button variants consistent with YD, and do both desktop and card views retain permissions and actions?
- Are create/edit/delete or domain-equivalent actions complete across UI, SDK API, endpoint, permission, and backend behavior?
- Does destructive behavior use confirmation, accurate wording, success feedback, and refresh?
- Does the page have one primary workflow, with unrelated capabilities split into routes and focused commands placed in modals/drawers?
- Are the page header, toolbar, table, pagination, forms, and independent sections separated with deliberate responsive spacing?
