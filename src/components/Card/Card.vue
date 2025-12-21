<script setup>
import { useAttrs } from 'vue';
import { VCard } from 'vuetify/components';

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

      handle.onmousedown = (e) => {
        const coords = dialog.getBoundingClientRect();
        const shiftX = e.clientX - coords.left;
        const shiftY = e.clientY - coords.top;

        const windowWidth = document.documentElement.clientWidth;
        const windowHeight = document.documentElement.clientHeight;
        const dialogWidth = coords.width;

        const minX = -dialogWidth + 50; // 좌측 최소 경계 (다이얼로그 전체가 왼쪽으로 사라지는 지점)
        const maxX = windowWidth - 50; // 우측 최대 경계 (다이얼로그가 우측 끝에 닿는 지점)

        const minY = 0; // 상단 최소 경계
        const maxY = windowHeight - 50; // 하단 최대 경계 (다이얼로그가 하단 끝에 닿는 지점)

        dialog.style.position = 'fixed';
        dialog.style.top = coords.top + 'px';
        dialog.style.left = coords.left + 'px';
        dialog.style.margin = '0';
        dialog.style.transform = 'none';

        const stopDrag = () => {
          document.removeEventListener('mousemove', onMouseMove);
          handle.onmouseup = null;
          window.removeEventListener('mouseleave', stopDrag);
        };

        window.addEventListener('mouseleave', stopDrag);

        const moveAt = (pageX, pageY) => {
          let newLeft = pageX - shiftX;
          let newTop = pageY - shiftY;

          if (newLeft < minX) {
            newLeft = minX;
          } else if (newLeft > maxX) {
            newLeft = maxX;
          }

          if (newTop < minY) {
            newTop = minY;
          } else if (newTop > maxY) {
            newTop = maxY;
          }

          dialog.style.left = newLeft + 'px';
          dialog.style.top = newTop + 'px';
        };

        const onMouseMove = (event) => {
          moveAt(event.clientX, event.clientY);
        };

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', stopDrag);

        handle.onmouseup = function () {
          document.removeEventListener('mousemove', onMouseMove);
          handle.onmouseup = null;
        };
      };

      handle.ondragstart = () => false;
    }
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
