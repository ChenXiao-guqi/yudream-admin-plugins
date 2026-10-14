<script setup lang="ts">
import type { WalletPluginModel } from '../composables/useWalletPlugin'
import { computed } from 'vue'
import { YdButton, YdIcon, YdInput, YdPageHeader, YdPageMain, YdSelect, YdTextarea, useYdToast } from '@yudream/components'
import WalletPanel from '../components/WalletPanel.vue'
const props = defineProps<{ model: WalletPluginModel }>()
const toast = useYdToast()
const channelOptions = computed(() => props.model.paymentChannels.map(item => ({ label: item.name, value: item.code })))
const assetOptions = computed(() => props.model.rechargeableAssets.map(item => ({ label: `${item.name} (${item.code})`, value: item.code })))
async function submit() { const result = await props.model.submitRecharge(); if (result) toast.success('充值订单已创建') }
</script>
<template>
  <YdPageHeader title="钱包充值" class="mb-0" />
  <YdPageMain>
    <WalletPanel title="创建充值订单" eyebrow="Recharge">
      <form class="wallet-form" @submit.prevent="submit">
        <label><span>支付渠道</span><YdSelect v-model="model.rechargeForm.channelCode" :options="channelOptions" /></label>
        <label><span>到账资产</span><YdSelect v-model="model.rechargeForm.assetCode" :options="assetOptions" /></label>
        <label><span>支付金额</span><YdInput v-model="model.rechargeForm.payAmount" inputmode="decimal" placeholder="0.00" /></label>
        <label><span>预计到账</span><YdInput :model-value="model.estimatedWalletAmount" disabled /></label>
        <label><span>备注</span><YdTextarea v-model="model.rechargeForm.remark" placeholder="可选" /></label>
        <div class="wallet-actions"><YdButton :loading="model.saving" type="submit"><YdIcon name="i-ri:bank-card-line" />创建订单</YdButton></div>
      </form>
    </WalletPanel>
  </YdPageMain>
</template>
