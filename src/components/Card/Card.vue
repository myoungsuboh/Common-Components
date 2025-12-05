<script setup>
defineProps({
  elevation: {
    type: Number,
    default: 0,
  },
  variant: {
    type: String,
    default: 'tonal', //"elevated" | "flat" | "outlined" | "plain" | "text" | "tonal";
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const attrs = useAttrs();
</script>
<template>
  <VCard
    v-bind="attrs"
    :elevation="elevation"
    :variant="variant"
    :loading="loading"
    :disabled="loading"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.subtitle" #subtitle>
      <slot name="subtitle" />
    </template>
    <template v-if="$slots.text" #text>
      <slot name="text" />
    </template>
    <slot />
  </VCard>
</template>

<style scoped></style>
