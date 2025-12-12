<script setup>
import ListItem from '@/components/List/ListItem.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
});

const attrs = useAttrs();

const emit = defineEmits(['selectItem']);

const open = ref();

const handleSelect = (dt) => {
  emit('selectItem', dt);
};
</script>
<template lang="">
  <VList v-model:opened="open">
    <ListItem
      v-for="(item, index) in props.data"
      v-bind="attrs"
      :key="index"
      :item="item"
      :value="`root-${index}`"
      @selectItem="(dt) => handleSelect(dt)"
    />
  </VList>
</template>
<style lang=""></style>
