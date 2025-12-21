<script setup>
import Button from "@/components/Button/Button.vue";
import InputBox from "@/components/TextBox/InputBox.vue";
import DatePicker from "@/components/DatePicker/DatePicker.vue";

import { VMenu } from "vuetify/components";

const props = defineProps({
  minWidth: {
    type: String,
    default: "290px",
  },
  hideWeekdays: {
    type: Boolean,
    default: true,
  },
  color: {
    type: String,
    default: "black",
  },
  headerColor: {
    type: String,
    default: "#dbdbdb",
  },
  mode: {
    type: String,
    default: "monthly", // none, flexible, monthly
  },
});

const attrs = useAttrs();

const formatDate = (dateVal = new Date(), format = "-") => {
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}${format}${month}${format}${day}`;
};

const date = ref(formatDate());
const showMenu = ref(false);

const updateDate = (newVal) => {
  if (!newVal) return;

  const formatted = formatDate(newVal);

  if (date.value !== formatted) {
    date.value = formatted;
  }
};

const handleSaveDate = () => {
  updateDate(date.value);
  handleShowPicker(false);
};

const handleShowPicker = (value) => {
  showMenu.value = value;
};
</script>
<template lang="">
  <VMenu
    v-model="showMenu"
    offset-y
    transition="slide-y-transition"
    :closeOnContentClick="false"
    :return-value.sync="date"
    :min-width="props.minWidth"
    @update:visible="handleShowPicker"
  >
    <template v-slot:activator="{ props }">
      <InputBox v-model="date" prepend-icon="mdi-calendar" v-bind="{ ...attrs, ...props }"></InputBox>
    </template>
    <DatePicker
      no-title
      scrollable
      :hideWeekdays="props.hideWeekdays"
      :color="props.color"
      :headerColor="props.headerColor"
      :mode="props.mode"
      :model-value="date"
      @update:model-value="updateDate"
    />
    <div class="d-flex justify-end">
      <Button name="취소" color="primary" @click="handleShowPicker(false)"></Button>
      <Button name="저장" color="primary" @click="handleSaveDate"></Button>
    </div>
  </VMenu>
</template>
<style lang="scss" scoped></style>
