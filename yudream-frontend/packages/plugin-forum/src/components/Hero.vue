<script setup lang="ts">
import { YdAction, YdIcon } from '@yudream/components'
import { ref, onMounted } from 'vue'
const STORAGE_KEY = 'forum-welcome-hidden'
const hidden = ref(false)

onMounted(() => {
  try { hidden.value = localStorage.getItem(STORAGE_KEY) === '1' } catch { /* ignore */ }
})

function dismiss() {
  hidden.value = true
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
}
</script>

<template>
  <section v-if="!hidden" class="forum-hero">
    <YdAction class="forum-hero-close" type="button" aria-label="隐藏欢迎横幅" @click="dismiss">
      <YdIcon name="i-ri:close-line" />
    </YdAction>
    <div class="forum-hero-container">
      <h1 class="forum-hero-title">论坛</h1>
      <p class="forum-hero-subtitle">分享想法、交流经验，找到属于你的社区板块</p>
    </div>
  </section>
</template>

<style scoped>
.forum-hero {
  position: relative;
  margin: 0 0 1rem;
  padding: 2rem 1rem;
  background: linear-gradient(145deg, color-mix(in srgb, var(--forum-accent) 12%, var(--card)), var(--card));
  border: 1px solid var(--forum-border);
  border-radius: 8px;
  text-align: center;
}
.forum-hero-close {
  position: absolute;
  top: .75rem;
  right: .75rem;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--forum-muted);
  opacity: .5;
  cursor: pointer;
  transition: opacity .2s;
}
.forum-hero-close:hover { opacity: 1; }
.forum-hero-container { max-width: 32rem; margin: 0 auto; }
.forum-hero-title { margin: 0; font-size: 1.375rem; font-weight: normal; line-height: 1.5em; color: var(--forum-heading); }
.forum-hero-subtitle { margin: .5rem 0 0; line-height: 1.5em; color: var(--forum-muted); font-size: .92rem; }
@media (min-width: 768px) {
  .forum-hero { padding: 2.5rem 1rem; }
  .forum-hero-title { font-size: 1.375rem; }
  .forum-hero-subtitle { font-size: 1rem; }
}
</style>
