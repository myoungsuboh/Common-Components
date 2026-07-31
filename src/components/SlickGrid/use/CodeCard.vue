<script setup>
import { ref } from "vue";
import CodeHighlight from "vue-code-highlight/src/CodeHighlight.vue";

/* ***************************************************************************************************************
데모용 사용법 카드

각 케이스의 예제 코드를 접었다 펼 수 있게 감싸는 컴포넌트.
데모 페이지가 코드 블록으로 길어지는 것을 막기 위해 기본은 접힌 상태다.
****************************************************************************************************************** */
const props = defineProps({
  /** 카드 제목 */
  title: { type: String, default: "사용법 보기" },
  /** 표시할 코드 */
  code: { type: String, required: true },
  /** 처음부터 펼친 상태로 둘지 */
  open: { type: Boolean, default: false },
});

const expanded = ref(props.open);
</script>

<template>
  <div class="code-card">
    <button type="button" class="code-card__head" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="code-card__arrow" :class="{ 'is-open': expanded }" aria-hidden="true">▶</span>
      <span class="code-card__title">{{ props.title }}</span>
      <span class="code-card__hint">{{ expanded ? "접기" : "펼치기" }}</span>
    </button>

    <div v-if="expanded" class="code-card__body">
      <CodeHighlight>{{ props.code }}</CodeHighlight>
    </div>
  </div>
</template>

<style scoped>
.code-card {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.code-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  border: 0;
  background: #fafafa;
  color: #37474f;
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.code-card__head:hover {
  background: #f0f4f8;
}

.code-card__arrow {
  font-size: 9px;
  transition: transform 0.15s;
}

.code-card__arrow.is-open {
  transform: rotate(90deg);
}

.code-card__title {
  flex: 1 1 auto;
  font-weight: 600;
}

.code-card__hint {
  color: #90a4ae;
}

.code-card__body {
  padding: 8px;
  background: #000;
  overflow-x: auto;
}

/*
 * 글자색을 명시한다.
 * vue-code-highlight의 prism 테마가 적용되기 전(또는 일부 토큰)에 pre 기본 글자색(검정)이 남으면
 * 검은 배경 위에 검은 글씨가 되어 "내용이 없는 것처럼" 보인다.
 */
.code-card__body :deep(pre),
.code-card__body :deep(code) {
  color: #f1f1f1;
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
  background: transparent;
}
</style>
