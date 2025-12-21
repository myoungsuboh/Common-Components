<script setup>
import ListItem from "@/components/List/ListItem.vue";

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
    default: "single", // 'single' | 'multiple'
  },
  opened: {
    type: Array,
    default: () => [],
  },
});

const attrs = useAttrs();

const emit = defineEmits(["selectItem"]);

const collectAllGroupValues = (items, accumulator, parentValue) => {
  items.forEach((item, index) => {
    const currentValue = `${parentValue}-${index}`;
    if (item.child && item.child.length > 0) {
      accumulator.push(currentValue);

      collectAllGroupValues(item.child, accumulator, currentValue);
    }
  });
};

const activeGroupValues = computed(() => {
  if (props.opened && props.opened.length > 0) return props.opened;

  if (!props.openAll) return [];

  const allValues = [];

  // props.data에 대한 모든 VListGroup의 value 수집
  collectAllGroupValues(props.data, allValues, "root");

  return allValues;
});

const handleSelect = (dt) => {
  emit("selectItem", dt);
};

provide("onSelectItem", handleSelect);
</script>
<template lang="">
  <VList :opened="activeGroupValues" :open-strategy="openStrategy">
    <ListItem v-for="(item, index) in props.data" v-bind="attrs" :key="index" :item="item" :value="`root-${index}`" :open-all="props.openAll" />
  </VList>
</template>
<style lang="scss" scoped></style>
