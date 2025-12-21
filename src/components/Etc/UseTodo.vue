<script setup>
import CodeHighlight from "vue-code-highlight/src/CodeHighlight.vue";
</script>
<template>
  <VCard>
    <VCardItem>
      <VCardTitle>To Do List</VCardTitle>
      <VCardSubtitle>Desc...</VCardSubtitle>
    </VCardItem>
    <VCardText class="bg-black">
      <div class="pd-4">
        <h2>목표</h2>
        <p>신규 프로젝트에서 공통 컴포넌트를 사용하여 보다 편리하고 빠르게 작업하기 위함.</p>
        <br />
        <VDivider class="border-opacity-100" color="white" />
        <div class="pa-5">
          <span>
            <h4>To Do List는 Redmine으로 관리합니다.</h4>
            <br />
            <h4 style="color: green">http://192.168.0.210:3000/my</h4>
          </span>
        </div>
        <VDivider class="border-opacity-100" color="white" />
      </div>
    </VCardText>
  </VCard>
</template>
<style lang="scss" scoped></style>
