<script setup>
import axios from "axios";
import { computed, ref } from "vue";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "normal",
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
  api: {
    type: Object,
    default: () => ({ url: "", params: {} }),
  },
});

const attrs = useAttrs();

const emit = defineEmits(["completed", "error", "click"]);

const getButtonColor = () => {
  if (props.type === "normal") return "black";
  return props.type === "confirm" ? "green" : "red";
};

const formatSize = (size) => {
  if (!size) return undefined;
  return typeof size === "number" ? `${size}px` : size;
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

    emit("completed", res.data);
  } catch (e) {
    emit("error", e);
  } finally {
    isLoading.value = false;
  }
};

const handleButtonClick = (event) => {
  if (props.api && typeof props.api.url === "string" && props.api.url.length > 0) {
    fnAxiosSearch();
  } else {
    emit("click", event);
  }
};
</script>

<template>
  <VBtn
    v-bind="attrs"
    :style="buttonStyle"
    :disabled="props.disabled || props.loading || isLoading"
    :loading="props.loading || isLoading"
    @click="handleButtonClick"
  >
    <slot>{{ props.name }}</slot>
  </VBtn>
</template>

<style scoped></style>
