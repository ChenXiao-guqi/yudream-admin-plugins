<script setup lang="ts">
import type { WalletPluginModel } from '../composables/useWalletPlugin'
import { computed } from 'vue'
import { YdButton, YdIcon, YdInput, YdPageHeader, YdPageMain, YdSelect, YdTextarea, useYdToast } from '@yudream/components'
const props = defineProps<{ model: WalletPluginModel }>()
const toast = useYdToast()
const channelOptions = computed(() => props.model.paymentChannels.map(item => ({ label: item.name, value: item.code })))
const assetOptions = computed(() => props.model.rechargeableAssets.map(item => ({ label: `${item.name} (${item.code})`, value: item.code })))
async function submit() { const result = await props.model.submitRecharge(); if (result) toast.success('充值订单已创建') }
</script>
<template>
  <YdPageHeader title="钱包充值" description="选择支付渠道与金额，创建订单后按渠道指引完成支付" class="mb-0" />
  <YdPageMain>
    <form class="wallet-form wallet-form--page" @submit.prevent="submit">
      <div class="wallet-form-head">
        <strong>创建充值订单</strong>
        <span>充值到账以渠道实际支付结果为准，预计到账按当前汇率折算</span>
      </div>
      <label><span>支付渠道</span><YdSelect v-model="model.rechargeForm.channelCode" :options="channelOptions" placeholder="请选择支付渠道" /></label>
      <label><span>到账资产</span><YdSelect v-model="model.rechargeForm.assetCode" :options="assetOptions" placeholder="请选择到账资产" /></label>
      <label><span>支付金额</span><YdInput v-model="model.rechargeForm.payAmount" inputmode="decimal" placeholder="0.00" /></label>
      <label><span>预计到账</span><YdInput :model-value="model.estimatedWalletAmount" disabled /></label>
      <label><span>备注</span><YdTextarea v-model="model.rechargeForm.remark" placeholder="选填，仅自己可见" /></label>
      <div class="wallet-actions"><YdButton :loading="model.saving" type="submit"><YdIcon name="i-ri:bank-card-line" />创建订单</YdButton></div>
    </form>
  </YdPageMain>
</template>
