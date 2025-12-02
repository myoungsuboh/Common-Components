<script setup>
// v-card의 모든 props를 상속받기 위해 defineProps를 비워둡니다.
// 특정 prop에 대한 기본값을 설정하거나 로직을 추가해야 할 경우 여기에 정의할 수 있습니다.
defineProps({});
</script>
<template>
  <v-card v-bind="$attrs">
    <!-- 모든 슬롯을 자식 컴포넌트(v-card)로 전달합니다. -->
    <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </v-card>
</template>
<style lang=""></style>
