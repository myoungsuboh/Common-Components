<script setup>
defineProps({
  direction: {
    type: String,
    default: 'horizontal', // vertical
  },
  data: {
    type: Array,
    default: () => [],
  },
});

const attrs = useAttrs();

const currentTabModel = defineModel('tab', {
  type: [String, Number],
  default: null,
});
</script>

<template>
  <VTabs
    v-model="currentTabModel"
    v-bind="attrs"
    :direction="direction"
    show-arrows
  >
    <VTab
      v-for="(item, index) in data"
      :key="`tab-${index}`"
      :value="item.key"
      :text="item.label"
    />
  </VTabs>
</template>
