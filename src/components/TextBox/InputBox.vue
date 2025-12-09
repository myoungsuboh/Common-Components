<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'outlined', //"outlined" | "underlined" | "solo" | "solo-filled" | "solo-inverted"
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  progressType: {
    type: String,
    default: 'Circular', // "Circular", "Linear"
  },
  progressColor: {
    type: String,
    default: 'info',
  },
  progressHeight: {
    type: Number,
    default: 7,
  },
  progressIndeterminate: {
    type: Boolean,
    default: false,
  },
});

const attrs = useAttrs();

const value = defineModel('value', {
  type: [String, Number],
  default: null,
});

const progressValue = defineModel('progressValue', {
  type: [String, Number],
  default: null,
});

const emit = defineEmits(['blur']);

const isProgressActive = computed(() => {
  const hasValue = !!progressValue.value;

  const isIndeterminate = props.progressIndeterminate;

  return hasValue || isIndeterminate;
});
</script>
<template>
  <VTextField
    v-bind="attrs"
    v-model="value"
    @blur="$emit('blur', $event)"
    :variant="variant"
    :clearable="clearable"
  >
    <template v-if="progressType === 'Linear'" v-slot:loader>
      <VProgressLinear
        v-model="progressValue"
        :active="isProgressActive"
        :color="progressColor"
        :height="progressHeight"
        :indeterminate="progressIndeterminate"
      />
    </template>
    <template v-else v-slot:append-inner>
      <VFadeTransition v-if="isProgressActive" leave-absolute>
        <VProgressCircular
          v-model="progressValue"
          :color="progressColor"
          size="24"
          :indeterminate="progressIndeterminate"
        />
      </VFadeTransition>
    </template>
  </VTextField>
</template>
<style lang=""></style>
