<script setup>
import Card from "@/components/Card/Card.vue";
import Button from "@/components/Button/Button.vue";
import DatePicker from "@/components/DatePicker/DatePicker.vue";
import DateInputBox from "@/components/DatePicker/DateInputBox.vue";

const hideWeekdays1 = ref(true);
const hideWeekdays2 = ref(true);
const hideWeekdays3 = ref(true);

const handleChangeHideWeekdays1 = () => {
  return (hideWeekdays1.value = !hideWeekdays1.value);
};
const handleChangeHideWeekdays2 = () => {
  return (hideWeekdays2.value = !hideWeekdays2.value);
};
const handleChangeHideWeekdays3 = () => {
  return (hideWeekdays3.value = !hideWeekdays3.value);
};
</script>
<template>
  <VRow>
    <VCol cols="3">
      <DateInputBox headerColor="red" color="red" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="monthly" headerColor="orange" color="orange" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="none" headerColor="pink" color="pink" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="flexible" headerColor="green" color="green" />
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Mode : Default</p>
        </template>
        <DatePicker width="100%" />
      </Card>
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Header Custom</p>
        </template>
        <DatePicker width="100%" color="#FF7527">
          <template #header>
            <div style="padding: 16px; font-size: 18px; font-weight: bold; text-align: center; background-color: black">
              사용자 정의 헤더: {{ new Date().toLocaleDateString() }}
            </div>
          </template>
        </DatePicker>
      </Card>
    </VCol>
    <VCol cols="3">
      <DateInputBox headerColor="red" color="red" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="monthly" headerColor="orange" color="orange" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="none" headerColor="pink" color="pink" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="flexible" headerColor="green" color="green" />
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Mode : Flexible</p>
        </template>
        <DatePicker width="100%" color="blue" headerColor="red" mode="flexible" :hideWeekdays="hideWeekdays1" />
        <Button class="mt-4" variant="elevated" @click="handleChangeHideWeekdays1" :name="hideWeekdays1 ? '요일 보이기' : '요일 숨기기'" />
      </Card>
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Mode : Monthly</p>
        </template>
        <DatePicker width="100%" color="orange" headerColor="orange" mode="monthly" :hideWeekdays="hideWeekdays2" />
        <Button class="mt-4" variant="elevated" @click="handleChangeHideWeekdays2" :name="hideWeekdays2 ? '요일 보이기' : '요일 숨기기'" />
      </Card>
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Mode : None</p>
        </template>
        <DatePicker width="100%" color="green" headerColor="green" mode="none" />
      </Card>
    </VCol>
    <VCol cols="6">
      <Card>
        <template #title>
          <p>Hide Weekdays</p>
        </template>
        <DatePicker width="100%" :hideWeekdays="hideWeekdays3" mode="none" />
        <Button class="mt-4" variant="elevated" @click="handleChangeHideWeekdays3" :name="hideWeekdays3 ? '요일 보이기' : '요일 숨기기'" />
      </Card>
    </VCol>
    <VCol cols="3">
      <DateInputBox headerColor="red" color="red" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="monthly" headerColor="orange" color="orange" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="none" headerColor="pink" color="pink" />
    </VCol>
    <VCol cols="3">
      <DateInputBox mode="flexible" headerColor="green" color="green" />
    </VCol>
    <VCol cols="12">
      <DateInputBox mode="asdasd" />
    </VCol>
  </VRow>
</template>
<style lang=""></style>
