<script setup>
import { useAttrs, defineProps } from 'vue';
import { VCard } from 'vuetify/components'; // VCard 임포트 필요

const props = defineProps({
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
  // 💡 [NEW] Dialog에서 넘겨받을 drag prop 정의
  draggable: {
    type: Boolean,
    default: false,
  },
});

const attrs = useAttrs();

const vDrag = {
  mounted(el) {
    if (!props.draggable) return;

    const handle = el.querySelector('.v-card-title') || el;
    const dialog = el.parentNode;

    if (handle && dialog && dialog.classList.contains('v-overlay__content')) {
      handle.style.cursor = 'move';

      handle.onmousedown = function (e) {
        const coords = dialog.getBoundingClientRect();
        const shiftX = e.clientX - coords.left;
        const shiftY = e.clientY - coords.top;

        dialog.style.position = 'fixed';
        dialog.style.top = coords.top + 'px';
        dialog.style.left = coords.left + 'px';
        dialog.style.margin = '0';
        dialog.style.transform = 'none';

        function moveAt(pageX, pageY) {
          dialog.style.left = pageX - shiftX + 'px';
          dialog.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
          moveAt(event.clientX, event.clientY);
        }

        document.addEventListener('mousemove', onMouseMove);

        handle.onmouseup = function () {
          document.removeEventListener('mousemove', onMouseMove);
          handle.onmouseup = null;
        };
      };
      handle.ondragstart = () => false;
    }
    // else: VDialog 래퍼를 찾을 수 없거나 핸들이 없을 경우
  },
};
</script>
<template>
  <VCard
    v-bind="attrs"
    :elevation="elevation"
    :variant="variant"
    :loading="loading"
    :disabled="loading"
    :key="props.draggable"
    v-drag="props.draggable"
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
