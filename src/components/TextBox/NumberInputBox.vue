<script setup>
import { watch } from 'vue';
import InputBox from '@/components/TextBox/InputBox.vue';

const props = defineProps({
  fixed: {
    type: Number,
    default: 0,
  },
  density: {
    type: String,
    default: 'compact', //"default" | "comfortable" | "compact";
  },
});

const inputValue = defineModel('value', {
  type: [String, Number],
  default: null,
});

const attrs = useAttrs();

const emit = defineEmits(['blur', 'keydown.enter']);

const setFixed = (event) => {
  let iVal = '0';
  if (inputValue.value !== null && inputValue.value !== undefined) {
    iVal = inputValue.value.toString();
  }

  if (iVal.includes('.')) {
    const parts = iVal.split('.');

    if (parts[1].length < 1) iVal = parts[0];

    if (props.fixed !== null && props.fixed !== undefined && props.fixed >= 0) {
      iVal = Number(iVal).toFixed(props.fixed).toString();
    }
  }

  inputValue.value = typeof inputValue.value === 'number' ? +iVal : iVal;
};

watch(inputValue, (nVal) => {
  if (nVal !== null && nVal !== undefined) {
    let processedVal = String(nVal).replace(/[^\d.]/g, '');

    const parts = processedVal.split('.');
    if (parts.length > 2) {
      processedVal = parts[0] + '.' + parts.slice(1).join('');
    }

    if (processedVal.startsWith('.')) {
      processedVal = '0' + processedVal;
    }

    inputValue.value = processedVal;
  }
});
</script>
<template>
  <InputBox
    v-bind="attrs"
    v-model:value="inputValue"
    type="text"
    :density="density"
    @blur="setFixed($event)"
    @keydown.enter="setFixed($event)"
  />
</template>
