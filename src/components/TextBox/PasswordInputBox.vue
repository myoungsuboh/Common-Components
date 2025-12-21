<script setup>
import InputBox from "@/components/TextBox/InputBox.vue";

defineProps({
  pInnerIcon: {
    type: String,
    default: "",
  },
  aInnerOffIcon: {
    type: String,
    default: "mdi-eye-off",
  },
  aInnerOnIcon: {
    type: String,
    default: "mdi-eye",
  },
});

const attrs = useAttrs();

const mValue = defineModel("value", {
  type: [String, Number],
  default: null,
});

const visible = ref(false);
</script>
<template lang="">
  <InputBox
    v-bind="attrs"
    :model-value="mValue"
    :type="visible ? 'text' : 'password'"
    :prepend-inner-icon="pInnerIcon"
    :append-inner-icon="visible ? aInnerOffIcon : aInnerOnIcon"
    @click:append-inner="visible = !visible"
  />
</template>
<style lang="scss" scoped></style>
