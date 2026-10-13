<template>
  <div ref="previewRootRef" class="skin-preview" :class="{ compact }">
    <div v-if="title || controls" class="skin-preview__toolbar">
      <strong>{{ title }}</strong>
      <div v-if="controls" class="skin-preview__actions">
        <YdButton size="icon-sm" :variant="rotateEnabled ? 'secondary' : 'outline'" aria-label="旋转" title="自动旋转" :aria-pressed="rotateEnabled" @click="rotateEnabled = !rotateEnabled">
          <YdIcon name="morph:rotate-ccw" class="size-4" />
        </YdButton>
        <YdButton size="sm" variant="outline" @click="nextAnimation">
          {{ animationLabel }}
        </YdButton>
        <YdTooltip
          v-for="item in backgrounds"
          :key="item.label"
          :text="`${item.label}背景`"
        >
          <YdButton
            size="icon-sm"
            :variant="backgroundLabel === item.label ? 'secondary' : 'outline'"
            :aria-label="`${item.label}背景`"
            :aria-pressed="backgroundLabel === item.label"
            @click="backgroundLabel = item.label; backgroundValue = item.value"
          >
            <YdIcon :name="item.icon" class="size-4" />
          </YdButton>
        </YdTooltip>
      </div>
    </div>
    <div v-if="hasPreview" class="skin-preview__stage">
      <SkinView3d
        ref="viewerRef"
        :width="width"
        :height="height"
        :skin-url="skin || undefined"
        :cape-url="cape || undefined"
        :skin-options="skinOptions"
        :cape-options="capeOptions"
        :fov="fov"
        :auto-rotate="false"
        :animation="animation"
        :enable-rotate="controls"
        :enable-zoom="controls"
        :enable-pan="false"
        :global-light="1.7"
        :camera-light="1.35"
        :zoom="zoom"
        :background="previewBackground"
      />
    </div>
    <div v-else class="skin-preview__empty">
      <YdIcon name="morph:shirt" class="skin-preview__empty-icon" />
      <strong>还没有外观</strong>
      <small>选择皮肤后会在这里预览</small>
    </div>
    <div v-if="$slots.default" class="skin-preview__footer">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkinViewer } from 'skinview3d'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { YdButton, YdIcon, YdTooltip } from '@yudream/components'
import { SkinView3d, type Background, type CapeOptions, type SkinOptions } from 'vue-skinview3d'
import { IdleAnimation, RunningAnimation, WalkingAnimation } from 'vue-skinview3d/animations'

const props = withDefaults(defineProps<{
  title?: string
  skin?: string
  cape?: string
  slim?: boolean
  compact?: boolean
  frameWidth?: number
  frameHeight?: number
  autoRotate?: boolean
  controls?: boolean
  view?: 'front' | 'back' | 'left' | 'right'
}>(), {
  title: '',
  skin: '',
  cape: '',
  slim: false,
  compact: false,
  autoRotate: true,
  controls: false,
  view: 'front',
})

interface PreviewBackground {
  label: string
  icon: string
  value: number
}

interface RgbColor {
  r: number
  g: number
  b: number
}

const fallbackBackgrounds: PreviewBackground[] = [
  { label: '表面', icon: 'morph:layers', value: 0xf7f7f8 },
  { label: '柔和', icon: 'morph:sun', value: 0xf7f7f8 },
  { label: '柔暗', icon: 'morph:moon', value: 0xececef },
]
const backgrounds = ref<PreviewBackground[]>(fallbackBackgrounds)
const backgroundValue = ref(fallbackBackgrounds[0].value)
const backgroundLabel = ref(fallbackBackgrounds[0].label)
const previewBackground = computed<Background>(() => ({ type: 'color', value: backgroundValue.value }))
const previewRootRef = ref<HTMLElement | null>(null)
const rotateEnabled = ref(props.autoRotate)
const animationIndex = ref(0)
const viewerRef = ref<InstanceType<typeof SkinView3d> | null>(null)
let themeObserver: MutationObserver | null = null
let rotateFrame: number | null = null
let lastRotateTime = 0
const animations = [
  { label: '待机', create: () => new IdleAnimation() },
  { label: '行走', create: () => new WalkingAnimation() },
  { label: '奔跑', create: () => new RunningAnimation() },
]
const width = computed(() => props.frameWidth ?? (props.compact ? 220 : 320))
const height = computed(() => props.frameHeight ?? (props.compact ? 270 : 390))
const fov = computed(() => props.compact ? 48 : 46)
const zoom = computed(() => props.compact ? 0.86 : 0.84)
const rotateSpeed = computed(() => props.compact ? 0.55 : 0.42)
const verticalOffset = computed(() => props.compact ? 1.6 : 2.6)
const skinOptions = computed<SkinOptions>(() => ({
  model: props.slim ? 'slim' : 'auto-detect',
}))
const capeOptions = computed<CapeOptions>(() => ({
  backEquipment: 'cape',
}))
const animationLabel = computed(() => animations[animationIndex.value].label)
const animation = computed(() => animations[animationIndex.value].create())
const hasPreview = computed(() => !!props.skin || !!props.cape)
const viewRotation = computed(() => {
  // skinview3d 默认相机看向模型正面：rotation.y=0 是正面，PI 是背面（实测验证）
  if (props.view === 'back') {
    return Math.PI
  }
  if (props.view === 'left') {
    return Math.PI / 2
  }
  if (props.view === 'right') {
    return -Math.PI / 2
  }
  return 0
})

onMounted(() => {
  syncThemeBackgrounds()
  themeObserver = new MutationObserver(syncThemeBackgrounds)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-admin-style'] })
  if (document.body) {
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'arco-theme'] })
  }
  void applyView()
  syncRotationLoop()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  stopRotationLoop()
})

watch([viewRotation, rotateEnabled, backgroundValue, () => props.skin, () => props.cape], () => {
  void applyView()
  syncRotationLoop()
}, { flush: 'post' })

watch(() => props.autoRotate, (value) => {
  rotateEnabled.value = value
})

// 明确切换视角时暂停自动旋转，保证按钮所选视角可见。
watch(() => props.view, () => { rotateEnabled.value = false })

async function applyView() {
  await nextTick()
  const viewer = resolveViewer()
  if (!viewer) {
    return
  }
  configureViewerFrame(viewer)
  viewer.controls.target.set(0, 4, 0)
  viewer.controls.update()
  if (!rotateEnabled.value) {
    viewer.playerWrapper.rotation.y = viewRotation.value
  }
  viewer.render()
}

function syncRotationLoop() {
  if (rotateEnabled.value && hasPreview.value) {
    startRotationLoop()
    return
  }
  stopRotationLoop()
}

function startRotationLoop() {
  if (rotateFrame !== null) {
    return
  }
  lastRotateTime = window.performance.now()
  const tick = (time: number) => {
    rotateFrame = null
    if (!rotateEnabled.value || !hasPreview.value) {
      return
    }
    const viewer = resolveViewer()
    if (viewer) {
      const delta = Math.min(time - lastRotateTime, 80) / 1000
      configureViewerFrame(viewer)
      viewer.playerWrapper.rotation.y += delta * rotateSpeed.value
      viewer.controls.target.set(0, 4, 0)
      viewer.controls.update()
      viewer.render()
    }
    lastRotateTime = time
    rotateFrame = window.requestAnimationFrame(tick)
  }
  rotateFrame = window.requestAnimationFrame(tick)
}

function stopRotationLoop() {
  if (rotateFrame === null) {
    return
  }
  window.cancelAnimationFrame(rotateFrame)
  rotateFrame = null
}

function configureViewerFrame(viewer: SkinViewer) {
  viewer.playerWrapper.position.y = verticalOffset.value
  // The embedded viewer's FXAA pass outputs raw color channels. Set them
  // explicitly so shared Three.js color-management state cannot darken the
  // theme surface a second time. Other plugins' renderers are left untouched.
  const background = viewer.background
  if (background && 'isColor' in background) {
    const value = backgroundValue.value
    background.setRGB(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255)
  }
}

function resolveViewer(): SkinViewer | null {
  const exposed = viewerRef.value?.viewer as unknown
  if (!exposed) {
    return null
  }
  if (typeof exposed === 'object' && 'value' in exposed) {
    return (exposed as { value?: SkinViewer | null }).value || null
  }
  return exposed as SkinViewer
}

function syncThemeBackgrounds() {
  // Arco's surface tokens live on body and change with arco-theme. Reading the
  // root misses them and leaves a white WebGL canvas in dark mode.
  const styles = getComputedStyle(document.body)
  const surface = readThemeColor(styles, '--color-bg-1', { r: 247, g: 247, b: 248 })
  const panel = readThemeColor(styles, '--color-bg-2', surface)
  const fill = readThemeColor(styles, '--color-fill-2', panel)
  const currentIndex = backgrounds.value.findIndex(item => item.label === backgroundLabel.value)
  // skinview3d creates an opaque WebGL context. Match the actual enclosing
  // surface instead of brightening it into a white rectangle.
  const nextBackgrounds = [
    toPreviewBackground('表面', 'morph:layers', enclosingSurfaceColor() || panel),
    toPreviewBackground('柔和', 'morph:sun', panel),
    toPreviewBackground('柔暗', 'morph:moon', fill),
  ]
  backgrounds.value = nextBackgrounds
  if (currentIndex >= 0) {
    backgroundValue.value = nextBackgrounds[Math.min(currentIndex, nextBackgrounds.length - 1)].value
  }
}

function enclosingSurfaceColor(): RgbColor | null {
  for (let element = previewRootRef.value; element; element = element.parentElement) {
    const value = getComputedStyle(element).backgroundColor
    if (value === 'transparent'
      || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(value)
      || /^rgba?\([^)]*\/\s*0(?:\.0+)?\s*\)$/.test(value)) {
      continue
    }
    const color = parseCssColor(value)
    if (color) {
      return color
    }
  }
  return null
}

function readThemeColor(styles: CSSStyleDeclaration, name: string, fallback: RgbColor): RgbColor {
  return parseCssColor(styles.getPropertyValue(name)) || fallback
}

function parseCssColor(value: string): RgbColor | null {
  const text = value.trim()
  const hex = text.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (hex) {
    const full = hex[1].length === 3
      ? hex[1].split('').map(item => item + item).join('')
      : hex[1]
    return {
      r: Number.parseInt(full.slice(0, 2), 16),
      g: Number.parseInt(full.slice(2, 4), 16),
      b: Number.parseInt(full.slice(4, 6), 16),
    }
  }
  const rgb = text.replace(/^rgba?\(|\)$/gi, '').split(/[,\s/]+/).filter(Boolean).map(Number)
  if (rgb.length < 3 || !rgb.slice(0, 3).every(value => Number.isFinite(value) && value >= 0 && value <= 255)) {
    return null
  }
  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
  }
}

function toPreviewBackground(label: string, icon: string, color: RgbColor): PreviewBackground {
  return {
    label,
    icon,
    value: (color.r << 16) + (color.g << 8) + color.b,
  }
}

function nextAnimation() {
  animationIndex.value = (animationIndex.value + 1) % animations.length
}
</script>
