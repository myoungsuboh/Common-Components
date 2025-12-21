<script setup>
const props = defineProps({
  tabValue: {
    type: [String, Number],
    required: true,
  },
  hide: {
    type: Boolean,
    default: false,
  },
  maxHeight: {
    type: [String, Number],
    default: undefined,
  },
});

const attrs = useAttrs();
</script>

<template>
  <VTabsWindowItem
    v-bind="attrs"
    :class="{
      'overflow-y-auto':
        props.maxHeight !== undefined && props.maxHeight !== null,
    }"
    :style="
      props.maxHeight
        ? {
            'max-height':
              typeof props.maxHeight === 'number'
                ? `${props.maxHeight}px`
                : props.maxHeight,
          }
        : {}
    "
    :value="props.tabValue"
  >
    <slot v-if="!props.hide"></slot>
  </VTabsWindowItem>
</template>
