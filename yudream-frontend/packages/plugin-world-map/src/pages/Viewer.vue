<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { computed, ref } from 'vue'
import { YdButton, YdCheckbox, YdIcon, YdInput, YdSelect, YdSlider } from '@yudream/components'
import { useWorldMapViewer } from '../composables/useWorldMapViewer'
import { findMarkers } from '../map/markerSearch'

const props = defineProps<{
  sdk: YuDreamPluginSdk
  route?: RouteLocationNormalizedLoaded
}>()

const {
  container,
  maps,
  currentMapId,
  mapOptions,
  loading,
  error,
  cameraMode,
  viewMode,
  timeOfDay,
  cameraPos,
  markerSets,
  layerVisibility,
  selectedMarker,
  hiresRadius,
  lowresCoverage,
  mock,
  tileLoadingMessage,
  fps,
  isFullscreen,
  screenshot,
  toggleFullscreen,
  setLayerVisible,
  focusSelectedMarker,
  focusMarker,
  focusCoordinates,
  resetToSpawn,
  retryCurrentMap,
} = useWorldMapViewer(props.sdk, props.route)

const coordinateX = ref('')
const coordinateZ = ref('')
const renderSettingsOpen = ref(false)
const coordinatePanelOpen = ref(false)
const markerQuery = ref('')
const markerMatches = computed(() => findMarkers(markerSets.value, markerQuery.value))

function toggleCameraMode() {
  cameraMode.value = cameraMode.value === 'orbit' ? 'fly' : 'orbit'
}

function toggleViewMode() {
  if (viewMode.value === 'perspective') {
    cameraMode.value = 'orbit'
    viewMode.value = 'flat'
  }
  else {
    viewMode.value = 'perspective'
  }
}

function setContainer(el: unknown) {
  container.value = el instanceof HTMLElement ? el : null
}

function focusCoordinateInput() {
  const x = Number(coordinateX.value)
  const z = Number(coordinateZ.value)
  if (Number.isFinite(x) && Number.isFinite(z) && focusCoordinates(x, z)) {
    coordinateX.value = String(Math.round(x))
    coordinateZ.value = String(Math.round(z))
    coordinatePanelOpen.value = false
  }
}

function toggleCoordinatePanel() {
  coordinatePanelOpen.value = !coordinatePanelOpen.value
  if (coordinatePanelOpen.value) {
    renderSettingsOpen.value = false
  }
}

function toggleRenderSettings() {
  renderSettingsOpen.value = !renderSettingsOpen.value
  if (renderSettingsOpen.value) {
    coordinatePanelOpen.value = false
  }
}
</script>

<template>
  <div class="world-map-viewer">
    <div :ref="setContainer" class="world-map-canvas" />

    <div class="world-map-control-stack">
      <div class="world-map-toolbar">
      <div class="world-map-toolbar-map">
        <YdSelect
          v-if="mapOptions.length > 1"
          v-model="currentMapId"
          :options="mapOptions"
          class="world-map-toolbar-select"
        />
        <span v-else class="world-map-toolbar-title">{{ maps[0]?.name || '世界地图' }}</span>
      </div>

      <div class="world-map-toolbar-sun">
        <YdIcon name="i-mdi:weather-night" />
        <YdSlider
          v-model="timeOfDay"
          :min="0"
          :max="1000"
          :step="1"
          :tooltip="false"
          class="world-map-toolbar-slider"
        />
        <YdIcon name="i-mdi:weather-sunny" />
      </div>

      <div class="world-map-toolbar-actions">
        <YdButton
          size="sm"
          variant="outline"
          :title="viewMode === 'perspective' ? '切换到俯视地图' : '切换到三维视图'"
          @click="toggleViewMode"
        >
          <YdIcon :name="viewMode === 'perspective' ? 'i-mdi:map' : 'i-mdi:cube-outline'" />
        </YdButton>

        <YdButton
          size="sm"
          variant="outline"
          :disabled="viewMode === 'flat'"
          :title="cameraMode === 'orbit' ? '切换到飞行模式' : '切换到轨道模式'"
          @click="toggleCameraMode"
        >
          <YdIcon :name="cameraMode === 'orbit' ? 'i-mdi:airplane' : 'i-mdi:orbit'" />
          <span class="world-map-toolbar-mode-label">{{ cameraMode === 'orbit' ? '飞行' : '轨道' }}</span>
        </YdButton>

        <YdButton size="sm" variant="outline" title="重置到出生点" @click="resetToSpawn">
          <YdIcon name="i-mdi:home-map-marker" />
        </YdButton>

        <YdButton size="sm" variant="outline" title="截图下载" @click="screenshot">
          <YdIcon name="i-mdi:camera" />
        </YdButton>

        <YdButton
          size="sm"
          variant="outline"
          :title="isFullscreen ? '退出地图全屏' : '地图全屏（会隐藏宿主侧栏）'"
          :aria-label="isFullscreen ? '退出地图全屏' : '地图全屏（会隐藏宿主侧栏）'"
          @click="toggleFullscreen"
        >
          <YdIcon :name="isFullscreen ? 'i-mdi:fullscreen-exit' : 'i-mdi:fullscreen'" />
        </YdButton>
        <YdButton
          size="sm"
          variant="outline"
          title="渲染距离"
          :aria-pressed="renderSettingsOpen"
          @click="toggleRenderSettings"
        >
          <YdIcon name="i-mdi:tune-variant" />
        </YdButton>
        <YdButton
          size="sm"
          variant="outline"
          class="world-map-toolbar-coordinate-action"
          title="坐标定位"
          :aria-pressed="coordinatePanelOpen"
          @click="toggleCoordinatePanel"
        >
          <YdIcon name="i-mdi:crosshairs-gps" />
        </YdButton>
      </div>

      <div class="world-map-toolbar-status">
        <span v-if="tileLoadingMessage" class="world-map-toolbar-pending">
          {{ tileLoadingMessage }}
        </span>

        <span class="world-map-toolbar-coords">
          XYZ: {{ cameraPos.x }} / {{ cameraPos.y }} / {{ cameraPos.z }}
        </span>
        <span class="world-map-toolbar-fps">{{ fps }} FPS</span>
        <span v-if="mock" class="world-map-toolbar-mock">MOCK</span>
      </div>
      </div>

      <div v-if="renderSettingsOpen || coordinatePanelOpen" class="world-map-toolbar-panel">
        <div v-if="renderSettingsOpen" class="world-map-render-settings">
          <label>
            <span>地形细节 {{ hiresRadius[0] }}</span>
            <YdSlider v-model="hiresRadius" :min="2" :max="6" :step="1" :tooltip="false" />
          </label>
          <label>
            <span>概览范围 {{ lowresCoverage[0]?.toFixed(1) }}x</span>
            <YdSlider v-model="lowresCoverage" :min="1" :max="2.5" :step="0.25" :tooltip="false" />
          </label>
        </div>

        <div v-else class="world-map-coordinate-panel">
          <form class="world-map-coordinate-form" @submit.prevent="focusCoordinateInput">
            <YdInput v-model="coordinateX" aria-label="X coordinate" inputmode="decimal" placeholder="X" />
            <YdInput v-model="coordinateZ" aria-label="Z coordinate" inputmode="decimal" placeholder="Z" />
            <YdButton size="sm" variant="outline" title="定位到坐标" type="submit">
              <YdIcon name="i-mdi:crosshairs-gps" />
            </YdButton>
          </form>
        </div>
      </div>
    </div>

    <div v-if="markerSets.length" class="world-map-layers">
      <div class="world-map-layer-search">
        <YdInput v-model="markerQuery" aria-label="搜索标注" placeholder="搜索标注" />
      </div>
      <div v-if="markerMatches.length" class="world-map-marker-results">
        <YdButton
          v-for="match in markerMatches"
          :key="`${match.setId}:${match.marker.id ?? match.label}`"
          size="sm"
          variant="outline"
          class="world-map-marker-result"
          :title="`定位到 ${match.label}`"
          @click="focusMarker(match.marker)"
        >
          <span>{{ match.label }}</span>
          <small>{{ match.setLabel }}</small>
        </YdButton>
      </div>
      <YdCheckbox
        v-for="set in markerSets"
        :key="set.id"
        :model-value="layerVisibility[set.id ?? ''] ?? set.defaultVisible !== false"
        @update:model-value="value => setLayerVisible(set.id ?? '', Boolean(value))"
      >
        {{ set.label || set.id }}
      </YdCheckbox>
    </div>

    <div v-if="selectedMarker" class="world-map-marker-popup">
      <div class="world-map-marker-popup-title">
        <strong>{{ selectedMarker.label || selectedMarker.id || '标注' }}</strong>
        <YdButton size="sm" variant="outline" title="定位到标注" @click="focusSelectedMarker">
          <YdIcon name="i-mdi:crosshairs-gps" />
        </YdButton>
      </div>
      <span v-if="selectedMarker.position">
        {{ Math.round(selectedMarker.position.x) }} / {{ Math.round(selectedMarker.position.y) }} / {{ Math.round(selectedMarker.position.z) }}
      </span>
    </div>

    <div v-if="loading" class="world-map-overlay">地图加载中……</div>
    <div v-else-if="error" class="world-map-overlay world-map-error">
      <span>{{ error }}</span>
      <YdButton size="sm" variant="outline" @click="retryCurrentMap">重试</YdButton>
    </div>
    <div v-else-if="viewMode === 'flat'" class="world-map-hint">
      拖拽平移，滚轮或双指缩放
    </div>
    <div v-else-if="cameraMode === 'fly'" class="world-map-hint">
      点击画面锁定鼠标，WASD 移动，Space/Q 升降，Shift 加速，Esc 退出
    </div>

  </div>
</template>
