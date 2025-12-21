<script setup>
import Card from "@/components/Card/Card.vue";

defineProps({
  // 다이얼로그 닫힘 방지
  persistent: {
    type: Boolean,
    default: false,
  },
  //포커스를 내부 요소로 유지할지 여부
  retainFocus: {
    type: Boolean,
    default: true,
  },
  // 다이얼로그가 처음 렌더링 될 때 미리 로드할지 여부
  eager: {
    type: Boolean,
    default: false,
  },
  // 다이얼로그 내용이 길 때 스크롤 가능 여부
  scrollable: {
    type: Boolean,
    default: false,
  },
  // 전체 화면 모드 여부
  fullscreen: {
    type: Boolean,
    default: false,
  },
  // 드래그 가능 여부
  draggable: {
    type: Boolean,
    default: false,
  },
});

const modelValue = defineModel({
  type: Boolean,
  required: true,
});

const attrs = useAttrs();

const slots = useSlots();

const emit = defineEmits(["update:modelValue"]);

const isStructural = computed(() => slots.header || slots.body || slots.footer);

const handleUpdate = (nVal) => {
  emit("update:modelValue", nVal);
};
</script>
<template>
  <div class="text-center pa-4">
    <VDialog
      v-model="modelValue"
      v-bind="attrs"
      :persistent="persistent"
      :retainFocus="retainFocus"
      :eager="eager"
      :scrollable="scrollable"
      :fullscreen="fullscreen"
      @update:model-value="handleUpdate"
    >
      <Card v-if="isStructural" variant="elevated" :draggable="draggable">
        <VCardTitle v-if="slots.header">
          <slot name="header" />
        </VCardTitle>
        <VCardText v-if="slots.body">
          <slot name="body" />
        </VCardText>
        <VCardActions v-if="slots.footer">
          <slot name="footer" />
        </VCardActions>
      </Card>

      <slot v-else />
    </VDialog>
  </div>
</template>
<style lang="scss" scoped></style>
