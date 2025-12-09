<script setup>
defineProps({
  variant: {
    type: String,
    default: 'tonal', //"elevated" | "flat" | "outlined" | "plain" | "text" | "tonal";
  },
});

const attrs = useAttrs();
</script>
<template lang="">
  <VTextField v-bind="attrs" model-value="example" />
</template>
<style lang=""></style>
