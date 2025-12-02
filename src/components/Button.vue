<script setup>
import { ref, computed, onBeforeMount } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: '확인',
  },
  type: {
    type: String,
    default: 'normal',
  },
  variant: {
    type: String,
    default: 'tonal',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [String, Number],
    default: null,
  },
  height: {
    type: [String, Number],
    default: null,
  },
  fontWeight: {
    type: String,
    default: 'bold',
  },
  fontSize: {
    type: String,
    default: '16px',
  },
});

const emit = defineEmits(['click']);

const getButtonColor = () => {
  if (props.type === 'normal') return undefined;
  return props.type === 'confirm' ? 'green' : 'red';
};

const formatSize = (size) => {
  if (!size) return undefined;
  return typeof size === 'number' ? `${size}px` : size;
};

const buttonStyle = computed(() => ({
  color: getButtonColor(),
  fontWeight: props.fontWeight,
  fontSize: props.fontSize,
  width: formatSize(props.width),
  height: formatSize(props.height),
}));

const handleOnClick = () => {
  emit('click');
};
</script>

<template>
  <v-btn
    v-bind="$attrs"
    :style="buttonStyle"
    :disabled="disabled || loading"
    :loading="loading"
    :variant="variant"
    @click="handleOnClick"
  >
    <slot>{{ name }}</slot>
  </v-btn>
</template>

<style scoped></style>
