<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { YdAction, YdButton, YdIcon, YdInput, YdPageHeader, YdPageMain, YdPagination, YdTag, useYdToast } from '@yudream/components'
import { computed, onMounted, reactive, ref } from 'vue'
import { createForumApi } from '../api/forum-api'
import PostCard from '../components/PostCard.vue'
import type { Category, Post } from '../api/forum-api'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createForumApi(props.sdk)
const toast = useYdToast()
const loading = ref(false)
const rows = ref<Post[]>([])
const categories = ref<Category[]>([])
const popularTags = ref<string[]>([])
const filter = reactive({ sort: 'latest', categoryId: '', tag: '', keyword: '', page: 1, size: 10, total: 0 })

const categoryNameById = computed(() => new Map(categories.value.map(category => [category.id, category.name])))
const activeCategoryName = computed(() => filter.categoryId ? categoryNameById.value.get(filter.categoryId) || '当前板块' : '全部帖子')
const visibleTags = computed(() => popularTags.value.slice(0, 12))

async function load() {
  loading.value = true
  try {
    const result = await api.posts({ sort: filter.sort, categoryId: filter.categoryId, tag: filter.tag, keyword: filter.keyword, page: filter.page, size: filter.size })
    rows.value = result.records
    filter.total = result.total
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : '加载论坛失败')
  }
  finally {
    loading.value = false
  }
}

function open(post?: Post) {
  const target = post?.id ? `/platform/plugins/forum/post?id=${encodeURIComponent(post.id)}` : '/platform/plugins/forum/post/edit'
  window.history.pushState({}, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function selectSort(sort: string) {
  filter.sort = sort
  filter.page = 1
  void load()
}

function selectCategory(categoryId: string) {
  filter.categoryId = categoryId
  filter.page = 1
  void load()
}

function selectTag(tag: string) {
  filter.tag = filter.tag === tag ? '' : tag
  filter.page = 1
  void load()
}

async function interact(id: string, type: 'like' | 'bookmark') {
  try {
    await api.interact(id, type)
    await load()
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : '操作失败')
  }
}

function openProfile(authorId: string) {
  if (!authorId) return
  window.history.pushState({}, '', `/platform/plugins/forum/profile?id=${encodeURIComponent(authorId)}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

onMounted(async () => {
  try {
    const [categoryResult, tagResult] = await Promise.all([api.categories(), api.tags()])
    categories.value = categoryResult.records
    popularTags.value = tagResult.records
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : '加载论坛导航失败')
  }
  await load()
})
</script>

<template>
  <div class="forum-page forum-home-page">
    <YdPageHeader title="论坛" description="分享想法、交流经验，找到属于你的社区板块">
      <YdButton class="forum-compose-button" @click="open()"><YdIcon name="i-ri:quill-pen-line" />发布帖子</YdButton>
    </YdPageHeader>
    <YdPageMain>
      <div class="forum-layout">
        <aside class="forum-sidebar forum-sidebar--left" aria-label="论坛板块">
          <div class="forum-sidebar-section">
            <div class="forum-sidebar-heading"><YdIcon name="i-ri:compass-3-line" />浏览</div>
            <YdAction type="button" class="forum-nav-item" :class="{ 'is-active': !filter.categoryId && filter.sort === 'latest' }" @click="selectSort('latest')"><YdIcon name="i-ri:time-line" />最新帖子</YdAction>
            <YdAction type="button" class="forum-nav-item" :class="{ 'is-active': !filter.categoryId && filter.sort === 'hot' }" @click="selectSort('hot')"><YdIcon name="i-ri:fire-line" />热门帖子</YdAction>
            <YdAction type="button" class="forum-nav-item" :class="{ 'is-active': filter.sort === 'featured' }" @click="selectSort('featured')"><YdIcon name="i-ri:star-line" />精华内容</YdAction>
          </div>
          <div class="forum-sidebar-section">
            <div class="forum-sidebar-heading"><YdIcon name="i-ri:layout-grid-line" />板块</div>
            <YdAction type="button" class="forum-nav-item" :class="{ 'is-active': !filter.categoryId }" @click="selectCategory('')"><YdIcon name="i-ri:apps-2-line" />全部板块</YdAction>
            <YdAction v-for="category in categories" :key="category.id" type="button" class="forum-nav-item" :class="{ 'is-active': filter.categoryId === category.id }" @click="selectCategory(category.id)"><YdIcon name="i-ri:folder-2-line" />{{ category.name }}</YdAction>
          </div>
        </aside>

        <section class="forum-feed" aria-label="帖子列表">
          <div class="forum-feed-header">
            <div><span class="forum-eyebrow">社区动态</span><h2>{{ activeCategoryName }}</h2></div>
            <div class="forum-feed-sort"><YdAction type="button" :class="{ 'is-active': filter.sort === 'latest' }" @click="selectSort('latest')">最新</YdAction><YdAction type="button" :class="{ 'is-active': filter.sort === 'hot' }" @click="selectSort('hot')">最热</YdAction><YdAction type="button" :class="{ 'is-active': filter.sort === 'featured' }" @click="selectSort('featured')">精华</YdAction></div>
          </div>
          <div class="forum-searchbar"><YdIcon name="i-ri:search-line" /><YdInput v-model="filter.keyword" placeholder="搜索帖子标题或摘要" @keyup.enter="filter.page = 1; load()" /><YdButton variant="outline" @click="filter.page = 1; load()">搜索</YdButton></div>
          <YdLoadingOverlay :loading="loading"><div  class="forum-feed-list">
            <PostCard v-for="post in rows" :key="post.id" :post="post" :category-name="categoryNameById.get(post.categoryId)" @open="open(post)" @profile="openProfile(post.authorId)" @like="interact(post.id, 'like')" @bookmark="interact(post.id, 'bookmark')" />
            <div v-if="!loading && !rows.length" class="forum-empty"><YdIcon name="i-ri:chat-smile-2-line" /><strong>这里还没有帖子</strong><span>成为第一个分享内容的人吧。</span><YdButton @click="open()"><YdIcon name="i-ri:quill-pen-line" />发布第一篇帖子</YdButton></div>
          </div></YdLoadingOverlay>
          <YdPagination v-model:page="filter.page" v-model:size="filter.size" :total="filter.total" class="mt-3" @page-change="load" @size-change="filter.page = 1; load()" />
        </section>

        <aside class="forum-sidebar forum-sidebar--right" aria-label="社区信息">
          <div class="forum-community-card"><div class="forum-community-icon"><YdIcon name="i-ri:chat-3-line" /></div><h3>加入社区讨论</h3><p>分享你的经验、作品和问题，和其他成员一起交流。</p><YdButton class="w-full" @click="open()"><YdIcon name="i-ri:edit-box-line" />写一篇帖子</YdButton></div>
          <div class="forum-sidebar-section forum-tags-panel"><div class="forum-sidebar-heading"><YdIcon name="i-ri:price-tag-3-line" />热门标签</div><div class="forum-tag-cloud"><YdTag v-for="tag in visibleTags" :key="tag" variant="outline" :class="{ 'is-selected': filter.tag === tag }" @click="selectTag(tag)">#{{ tag }}</YdTag><span v-if="!visibleTags.length" class="forum-muted">还没有标签</span></div></div>
          <div class="forum-sidebar-section forum-rules-panel"><div class="forum-sidebar-heading"><YdIcon name="i-ri:information-line" />社区规则</div><ul><li>尊重他人，友善交流</li><li>发布前请选择正确的板块</li><li>内容可能需要人工审核后展示</li></ul></div>
        </aside>
      </div>
    </YdPageMain>
  </div>
</template>
