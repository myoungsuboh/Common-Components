<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  titleColor: {
    type: String,
    default: '',
  },
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

const emit = defineEmits(['before-change']);

const tab = defineModel({
  type: [String, Number],
  default: null,
});

const onTabChange = (newTabValue) => {
  const event = {
    newTab: newTabValue,
    preventDefault: () => {
      event.defaultPrevented = true;
    },
    defaultPrevented: false,
  };

  emit('before-change', event);

  if (!event.defaultPrevented) {
    tab.value = newTabValue;
  }
};

defineOptions({
  inheritAttrs: false,
});
</script>
<template>
  <div :class="direction === 'vertical' && !title && 'd-flex flex-row'">
    <VToolbar v-if="title" :color="titleColor" extended>
      <VToolbarTitle :text="title"></VToolbarTitle>
      <template #extension>
        <VTabs
          :model-value="tab"
          v-bind="attrs"
          :direction="direction"
          @update:model-value="onTabChange"
        >
          <VTab
            v-for="item in data"
            :key="item.key"
            :value="item.key"
            :text="item.label"
          />
        </VTabs>
      </template>
    </VToolbar>
    <VTabs
      v-else
      :model-value="tab"
      v-bind="attrs"
      :direction="direction"
      @update:model-value="onTabChange"
    >
      <VTab
        v-for="item in data"
        :key="item.key"
        :value="item.key"
        :text="item.label"
      />
    </VTabs>
    <VTabsWindow v-model="tab" class="flex-grow-1">
      <slot />
    </VTabsWindow>
  </div>
</template>
