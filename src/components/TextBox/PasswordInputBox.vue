<script setup>
defineProps({
  variant: {
    type: String,
    default: 'outlined', //"elevated" | "flat" | "outlined" | "plain" | "text" | "tonal";
  },
  density: {
    type: String,
    default: 'compact', //"default" | "comfortable" | "compact";
  },
  placeholder: {
    type: String,
    default: 'Enter your password',
  },
  hint: {
    type: String,
    default: '',
  },
  pInnerIcon: {
    type: String,
    default: '',
  },
  aInnerOffIcon: {
    type: String,
    default: 'mdi-eye-off',
  },
  aInnerOnIcon: {
    type: String,
    default: 'mdi-eye',
  },
});

const attrs = useAttrs();

const mValue = defineModel('value', {
  type: [String, Number],
  default: null,
});

const visible = ref(false);
</script>
<template lang="">
  <VTextField
    v-bind="attrs"
    :model-value="mValue"
    :type="visible ? 'text' : 'password'"
    :density="density"
    :variant="variant"
    :hint="hint"
    :placeholder="placeholder"
    :prepend-inner-icon="pInnerIcon"
    :append-inner-icon="visible ? aInnerOffIcon : aInnerOnIcon"
    @click:append-inner="visible = !visible"
  />
</template>
<style lang=""></style>
