<script>
export default {
  name: 'ListItem',
};
</script>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({ name: '', child: [] }),
  },
  value: {
    type: String,
    required: true,
  },
});

const attrs = useAttrs();

const emit = defineEmits(['selectItem']);

const hasChildren = computed(() => {
  return props.item.child && props.item.child.length > 0;
});

const onSelectItem = inject('onSelectItem');

const handleSelect = () => {
  const payload = {
    name: props.item.name,
    data: props.item,
    value: props.value,
  };

  if (onSelectItem) {
    onSelectItem(payload);
  }
};
</script>

<template>
  <VListGroup v-if="hasChildren" :value="props.value" :model-value="true">
    <template v-slot:activator="{ props: activatorProps }">
      <VListItem
        v-bind="{ ...attrs, ...activatorProps }"
        :title="item.name || 'No Name'"
        :value="props.value"
        @click="handleSelect"
      />
    </template>
    <ListItem
      v-for="(childItem, childIndex) in item.child"
      :key="`${props.value}-${childIndex}`"
      v-bind="attrs"
      :item="childItem"
      :value="`${props.value}-${childIndex}`"
    />
  </VListGroup>
  <VListItem
    v-else
    v-bind="attrs"
    :title="item.name || 'Leaf Item'"
    prepend-icon="mdi-file-outline"
    :value="props.value"
    @click="handleSelect"
  />
</template>
