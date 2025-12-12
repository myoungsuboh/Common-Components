<script setup>
import CodeHighlight from 'vue-code-highlight/src/CodeHighlight.vue';

const vueCode = `
공통 컴포넌트를 만들면서 대부분 사용하는 기능인 상속에 대한 내용입니다.

부모 -> 자식 직접적으로 props 전달하는 방법은 크게 2가지가 있습니다. [고정 값(정적) / 바인딩(동적)]

동적 옵션들은 defineProps 에서 정의해서 사용,

정적인 옵션들은 v-bind="$attrs" 를 사용해서 상속합니다.

문제 : 정적 옵션 상속 중 아래 경고가 발생했습니다.
--------------------------------------------------------------------------------------
[Vue warn]: 
 Extraneous non-props attributes (color) were passed to component 
 but could not be automatically inherited 
 because component renders fragment or text or teleport root nodes.
--------------------------------------------------------------------------------------

원인 :
자식 컴포넌트의 최상위 태그에 적용되는걸 몰라 삽질을 좀 했습니다.
<div> 태그에는 color라는 속성이 없기 때문에 
Vue가 해당 속성을 Extraneous Attribute으로 간주하고 
자동 상속 과정에서 경고를 발생시킨 것이 원인이었습니다.

해결 방법 :
자동 속성을 막고 직접 수동 상속을 진행
defineOptions({ inheritAttrs: false });
`;
</script>
<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Technical Notes</VCardTitle>
      <VCardSubtitle>작업하면서 알게된 내용 리마인드</VCardSubtitle>
    </VCardItem>
    <VCardText class="bg-black">
      <h2>props상속</h2>
      <CodeHighlight>
        {{ vueCode }}
      </CodeHighlight>
    </VCardText>
  </VCard>
</template>
<style lang=""></style>
