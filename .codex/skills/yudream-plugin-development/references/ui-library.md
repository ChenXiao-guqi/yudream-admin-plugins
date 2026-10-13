# YD UI Library Rules

Read repository `docs/yd-ui-guidelines.md` before choosing a component. It is the synchronized copy of the host-authoritative document and defines the full catalog, capability boundaries, theme schemes, motion, state and maintenance rules.

## Strict Public Entry

Vue Web business UI uses only public `Yd*` components and `useYd*` composables from released `@yudream/components`, supplied at runtime by the SDK host shared bridge. Fa exports are compatibility implementation details, not new or migrated business entry points. Direct Arco, TDesign, Reka, other generic UI libraries, aliases and raw generic `button`/`input`/`select`/`textarea` controls are forbidden in business code.

Semantic content and pure layout elements remain allowed. Do not turn a clickable div into a page-local control. Specialized editors, chart engines, workflow canvases and visual builders also require typed YD adapters. Display-only code or relation-graph components cannot replace editable engines.

React Native plugins use the separate `@yudream/plugin-mobile-ui` adapter and mobile theme tokens; do not import Vue YD. Extend that shared mobile adapter for missing generic behavior rather than duplicating it across mobile pages. This platform boundary does not create a Web exception.

## Published Contract Gate

Keep shared package versions in `yudream-frontend/pnpm-workspace.yaml`; packages consume them with `catalog:`:

```json
{
  "dependencies": {
    "@yudream/components": "catalog:",
    "@yudream/plugin-sdk": "catalog:"
  }
}
```

The guideline catalog describes the host source contract, not proof that the plugin's currently installed version contains it. Verify the installed public types, the released SDK component bridge and the runtime host exports. A new component must be available in all three places before use.

Missing capability workflow: define a typed adapter in the host shared YD package, preserve models/events/slots/ref methods/keyboard/focus/theme/overlays, update root and domain exports/resolver/SDK shared bridge/interactive preview, publish and verify the affected components/SDK contracts, then update the plugin catalog and lockfile. Do not point at an unpublished version, copy host code into this repository, commit host-local aliases or use a page-level third-party fallback.

## Explicit Imports

After the required public entries are available in verified releases, import from the package root:

```ts
import type { TableColumn } from '@yudream/components'
import { YdButton, YdModal, YdResponsiveTable, useYdToast } from '@yudream/components'
```

Plugins do not inherit host auto-import. Read public README/types instead of guessing props, slots, events or v-model names. Never import shared source subpaths or host internals.

## Selection By User Task

| Task | Entry and boundary |
| --- | --- |
| Ordinary actions and fields | `YdButton`, `YdInput`, `YdTextarea`, `YdNumberField`, `YdSwitch`, `YdSlider`; form layout/validation requires the shared form adapter |
| Few visible choices | `YdRadioGroup` or `YdCheckboxGroup`; compact scalar choice uses `YdSelect` |
| Local searchable scalar choice | `YdCombobox`; not a substitute for remote/multiple search |
| Hierarchy and paths | `YdTree` for browse/check, `YdCascader` for one path; async loading and drag/drop need an explicit published contract |
| Remote paginated records | `YdTablePicker`, string-array IDs, labels and confirmation; no page-private selection modal |
| API date/time strings | `YdDatePicker`, `YdRangePicker`, `YdTimePicker`; preserve format, granularity and disabled-date/time behavior |
| Calendar browsing | `YdCalendar*` and `YdDate` use DateValue; explicitly serialize at the API boundary |
| Management records | `YdResponsiveTable` with `#card` and `YdPagination`; small desktop-only internal tables may use `YdTable` |
| Focused temporary commands | `YdModal`/`useYdModal`; contextual inspection uses `YdDrawer`, anchor-sized interaction uses `YdPopover` |
| Steps, tasks and history | `YdSteps`, `YdMultiStepLoader`/`YdProgress`, `YdTimeline` respectively; these are not interchangeable |
| AI tools and coding | `YdAgentWorkbench`, `YdAgentContextPanel`, `YdAgentAnswer`; simple chat can compose `YdChat*` |

Do not mechanically rename Arco controls. YD Select options, TanStack table columns/cell slots, Tabs lists, Dropdown groups, calendar models, progress units and confirmation APIs have their own contracts. Preserve the existing user task before removing a third-party import. Missing multiple-selection, async tree, sorting or exposed methods must be encapsulated first.

## Theme, Motion And Layers

Host FA theme runtime owns primary color, font and dark/light schemes. YD owns shared control appearance. Business CSS uses neutral background/text/border/fill tokens and layout variables; no fixed brand palette or privately simulated active state. All enabled functional animations keep running in vibrant/calm/compact modes. Reduced-motion handling only softens speed, amplitude, elasticity and decoration density in calm/compact modes.

Web plugin CSS is declared as `style.css`: use `yuDreamPluginUnoCss()` from `@yudream/plugin-sdk/uno-config`, import `virtual:uno.css`, set Vite lib `cssFileName: 'style'` and declare `@PluginFrontend(styles = {"style.css"})`. Do not inject inline stylesheet text in install(). Preserve `yudream-base < yudream-plugin < host utility classes`. ADMIN theme overrides belong to root variables; SITE styles remain inside SITE scope and never pollute ADMIN.

## Maintenance And Acceptance

Plugin-local components may compose public YD entries for domain behavior; they may not hide raw generic UI or reimplement shared controls. When a generic gap is discovered, update the host adapter and the synchronized guideline in the same work item. Keep AGENTS, this skill, references, component catalog and actual released/runtime exports aligned.

Check loading, refresh, empty, error, disabled, selection, cancellation, permission denial, keyboard and focus behavior. Verify three schemes, light/dark, narrow screens, overlays and functional motion. Follow `management-pages.md` and `page-composition.md`; validate target typecheck/lint and build before module completion. Pure rules/docs work does not bump plugin versions.
