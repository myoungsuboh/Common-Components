<script setup>
import ListItem from '@/components/List/ListItem.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  openAll: {
    type: Boolean,
    default: false,
  },
  openStrategy: {
    type: String,
    default: 'single', // 'single' | 'multiple'
  },
  opened: {
    type: Array,
    default: () => [],
  },
});

const attrs = useAttrs();

const emit = defineEmits(['selectItem']);

const collectAllGroupValues = (items, parentValue) => {
  const values = [];
  items.forEach((item, index) => {
    const currentValue = `${parentValue}-${index}`;
    if (item.child && item.child.length > 0) {
      values.push(currentValue);
      values.push(...collectAllGroupValues(item.child, currentValue));
    }
  });
  return values;
};

// opened prop이 우선 적용되고, 없으면 openAll에 따라 결정
const activeGroupValues = computed(() => {
  if (props.opened && props.opened.length > 0) {
    return props.opened;
  } else if (props.openAll) {
    // props.data에 대한 모든 VListGroup의 value 수집
    return collectAllGroupValues(props.data, 'root');
  } else {
    return [];
  }
});

const handleSelect = (dt) => {
  emit('selectItem', dt);
};

provide('onSelectItem', handleSelect);
</script>
<template lang="">
  <VList :opened="activeGroupValues" :open-strategy="openStrategy">
    <ListItem
      v-for="(item, index) in props.data"
      v-bind="attrs"
      :key="index"
      :item="item"
      :value="`root-${index}`"
      :open-all="props.openAll"
    />
  </VList>
</template>
<style lang=""></style>
