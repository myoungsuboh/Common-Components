<script setup>
defineProps({
  tabValue: {
    type: [String, Number],
    required: true,
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const attrs = useAttrs();
</script>

<template>
  <VTabsWindowItem v-bind="attrs" :value="tabValue">
    <slot v-if="!hide"></slot>
  </VTabsWindowItem>
</template>
