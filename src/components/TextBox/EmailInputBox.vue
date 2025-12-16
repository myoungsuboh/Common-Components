<script setup>
import InputBox from '@/components/TextBox/InputBox.vue';

defineProps({
  // variant: {
  //   type: String,
  //   default: 'tonal', //"elevated" | "flat" | "outlined" | "plain" | "text" | "tonal";
  // },
});

const inputValue = defineModel('value', {
  type: [String, Number],
  default: null,
});

const attrs = useAttrs();
</script>
<template lang="">
  <InputBox v-bind="attrs" v-model:value="inputValue" type="text" />
  
</template>
<style lang=""></style>
