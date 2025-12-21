<script setup>
import { useDisplay } from 'vuetify'

const props = defineProps({
    cols: { type: String },
    sm: { type: String },
    md: { type: String },
    lg: { type: String },
    minWidth: {type: String},
})    

const { smAndUp, mdAndUp, lgAndUp } = useDisplay() 

const toPercent = val => {
  if (!val) return undefined
  const n = parseFloat(val)
  if (Number.isNaN(n)) return undefined
  const clamped = Math.max(0, Math.min(12, n))
  return `${(clamped / 12) * 100}%`

}

// 현재 활성 브레이크포인트에 맞는 퍼센트 선택
const activePercent = computed(() => {
  // 우선순위: lg > md > sm > xs(cols)
  if (lgAndUp.value && props.lg != null) return toPercent(props.lg)
  if (mdAndUp.value && props.md != null) return toPercent(props.md)
  if (smAndUp.value && props.sm != null) return toPercent(props.sm)
  return toPercent(props.cols) ?? 'auto'
})

// 인라인 스타일 객체
const styleObj = computed(() => {
  const p = activePercent.value
  const style = {}

  if (p && p !== 'auto') {
    style.flex =  `0 0 ${p}`;
    style.maxWidth =  p;
  }  
  
  if(props.minWidth) style.minWidth = props.minWidth;

  return style;
})  

</script>
  
<template>
  <VCol class="p-col" :style="styleObj">
    <slot />
  </VCol>
</template>