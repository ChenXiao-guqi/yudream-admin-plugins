<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { YdButton, YdCard, YdIcon, YdInput, YdLabel, YdPageHeader, YdPageMain, YdTag } from '@yudream/components'
import { onMounted } from 'vue'
import { useMyStudentProfile } from '../composables/useMyStudentProfile'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const model = useMyStudentProfile(props.sdk)

onMounted(model.load)
</script>

<template>
  <section class="student-info-page">
    <YdPageHeader title="我的学生信息" description="维护与当前账号绑定的个人学籍资料。" class="mb-0">
      <YdTag :variant="model.profileReady ? 'default' : 'secondary'">
        {{ model.profileReady ? '资料完整' : '待完善' }}
      </YdTag>
    </YdPageHeader>

    <YdPageMain>
      <div class="student-info-profile-grid">
        <YdCard title="学籍资料" :description="model.accountName" content-class="student-info-card-content">
          <form class="student-info-form" @submit.prevent="model.save">
            <YdLabel label="姓名" class="student-info-field">
              <YdInput v-model="model.form.studentName" class="w-full" maxlength="40" />
            </YdLabel>
            <YdLabel label="学号" class="student-info-field">
              <YdInput v-model="model.form.studentNo" class="w-full" maxlength="64" />
            </YdLabel>
            <YdLabel label="班级" class="student-info-field">
              <YdInput v-model="model.form.className" class="w-full" maxlength="80" />
            </YdLabel>
            <YdLabel label="学院" class="student-info-field">
              <YdInput v-model="model.form.college" class="w-full" maxlength="80" />
            </YdLabel>
            <div class="student-info-actions">
              <YdButton type="submit" :loading="model.saving" :disabled="model.loading">
                <YdIcon name="i-ri:save-3-line" />
                保存
              </YdButton>
            </div>
          </form>
        </YdCard>

        <YdCard title="当前记录" description="仅展示当前登录账号的资料" content-class="student-info-card-content">
          <dl class="student-info-detail">
            <div><dt>姓名</dt><dd>{{ model.profile?.studentName || '-' }}</dd></div>
            <div><dt>学号</dt><dd>{{ model.profile?.studentNo || '-' }}</dd></div>
            <div><dt>班级</dt><dd>{{ model.profile?.className || '-' }}</dd></div>
            <div><dt>学院</dt><dd>{{ model.profile?.college || '-' }}</dd></div>
            <div><dt>更新时间</dt><dd>{{ model.formatTime(model.profile?.updatedAt) }}</dd></div>
          </dl>
        </YdCard>
      </div>
    </YdPageMain>
  </section>
</template>
