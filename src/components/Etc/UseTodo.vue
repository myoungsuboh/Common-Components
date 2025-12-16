<script setup>
import CodeHighlight from 'vue-code-highlight/src/CodeHighlight.vue';
</script>
<template>
  <VCard>
    <VCardItem>
      <VCardTitle>To Do List</VCardTitle>
      <VCardSubtitle>Desc...</VCardSubtitle>
    </VCardItem>
    <VCardText class="bg-black">
      <h2>목표</h2>
      <span>
        <p>
          신규 프로젝트에서 공통 컴포넌트를 사용하여 보다 편리하고 빠르게
          작업하기 위함.
        </p>
        <br />
        <VDivider class="border-opacity-100" color="white" />
        <h3>컴포넌트 종류</h3>
        <div class="pl-5">
          <ol>
            <li>
              <h4>TextBox</h4>
              - InputBox, TextInputBox, NumberInputBox, EmailInputBox,
              PasswordInputBox
            </li>
            <li>
              <h4>Tab</h4>
              - Tab, TabContent, InternalTabs
            </li>
            <li>
              <h4>Card</h4>
              - Card
            </li>
            <li>
              <h4>Button</h4>
              - Button 클릭시 API 호출하여 데이터만 리턴하는 기능 필요
            </li>
            <li>
              <h4>List</h4>
              - 계층 구조의 데이터로 그룹핑 가능하도록 구현
              <br />
              - {{ `<List :data="data" ...` }}
              <br />
              - lv1
              <br />
              &nbsp;&nbsp;- lv1.1
              <br />
              - lv2 
              <br />
              &nbsp;&nbsp;- lv2.1
            </li>
            <li>
              <h4>ReadGrid 커스텀</h4>
              - Pagenation, 엑셀 출력
            </li>
            <li>
              <h4>Node 서버 띄우기</h4>
              - 웹으로 시각화
            </li>
          </ol>
        </div>
        <VDivider class="border-opacity-100" color="white" />
      </span>
    </VCardText>
  </VCard>
</template>
<style lang=""></style>
