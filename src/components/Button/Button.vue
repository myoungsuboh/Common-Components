<script setup>
import { computed, ref } from 'vue';
import axios from 'axios';

const props = defineProps({
  name: {
    type: String,
    default: '확인',
  },
  type: {
    type: String,
    default: 'normal',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'outlined', // tonal, outlined, elevated, flat, text, plain
  },
  width: {
    type: [String, Number],
    default: null,
  },
  height: {
    type: [String, Number],
    default: null,
  },
  api: {
    type: Object,
    default: () => ({ url: '', params: {} }),
  },
});

const attrs = useAttrs();

const emit = defineEmits(['completed', 'error', 'click']);

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
  width: formatSize(props.width),
  height: formatSize(props.height),
}));

const isLoading = ref(false);

const fnAxiosSearch = async () => {
  if (isLoading.value) return;

  isLoading.value = true;

  try {
    const res = await axios.get(props.api.url, { params: props.api.params });

    emit('completed', res.data);
  } catch (e) {
    emit('error', e);
  } finally {
    isLoading.value = false;
  }
};

const handleButtonClick = (event) => {
  if (
    props.api &&
    typeof props.api.url === 'string' &&
    props.api.url.length > 0
  ) {
    fnAxiosSearch();
  } else {
    emit('click', event);
  }
};
</script>

<template>
  <VBtn
    v-bind="attrs"
    :style="buttonStyle"
    :disabled="disabled || loading || isLoading"
    :loading="loading || isLoading"
    :variant="variant"
    @click="handleButtonClick"
  >
    <slot>{{ name }}</slot>
  </VBtn>
</template>

<style scoped></style>
