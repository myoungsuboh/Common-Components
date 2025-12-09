<script setup>
import { watch } from 'vue';
import InputBox from '@/components/TextBox/InputBox.vue';

const emit = defineEmits(['only-text']);

const value = defineModel('value', {
  type: String,
  default: '',
});

const specialCharsRegex = /[^\p{L}\p{N}\s]/gu;

watch(value, (nVal) => {
  if (nVal && typeof nVal === 'string') {
    if (specialCharsRegex.test(nVal)) emit('only-text', nVal);
    value.value = nVal.replace(specialCharsRegex, '');
  }
});
</script>
<template>
  <InputBox v-model:value="value" type="text" />
</template>
