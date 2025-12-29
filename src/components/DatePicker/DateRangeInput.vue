<script setup>
import Card from "@/components/Card/Card.vue";
import Button from "@/components/Button/Button.vue";
import InputBox from "@/components/TextBox/InputBox.vue";
import DatePicker from "@/components/DatePicker/DatePicker.vue";

import { VMenu } from "vuetify/components";

const props = defineProps({
  minWidth: {
    type: [String, Number], // Number도 허용하도록 수정 권장
    default: "350px",
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
  from: {
    type: Date,
    default: () => new Date(),
  },
  to: {
    type: Date,
    default: () => new Date(),
  },
});

const attrs = useAttrs();

const emit = defineEmits(["update:modelValue"]);

// 날짜 포맷팅 함수
const formatDate = (dateVal = new Date(), format = "-") => {
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}${format}${month}${format}${day}`;
};

// 날짜
const searchRange = reactive({
  from: formatDate(props.from),
  to: formatDate(props.to),
});

// inputBox에 보여줄 날짜
const dateText = computed(() => `${searchRange.from} ~ ${searchRange.to}`);
const showMenu = ref(false);

// 시작 날짜 변경 함수
const updateFromDate = (newVal) => {
  if (!newVal) return;

  const formatted = formatDate(newVal);

  if (searchRange.from !== formatted) {
    searchRange.from = formatted;
  }
};

// 종료 날짜 변경 함수
const updateToDate = (newVal) => {
  if (!newVal) return;

  const formatted = formatDate(newVal);

  if (searchRange.to !== formatted) {
    searchRange.to = formatted;
  }
};

// 저장
const handleSaveDate = () => {
  const fromDate = new Date(searchRange.from);
  const toDate = new Date(searchRange.to);

  let errorMsg = "";

  if (isNaN(fromDate.getTime())) errorMsg = "시작일을 입력해주세요.";
  else if (isNaN(toDate.getTime())) errorMsg = "종료일을 입력해주세요.";
  else if (fromDate > toDate) errorMsg = "시작일이 종료일보다 늦습니다.";

  const isValid = errorMsg.length === 0;

  if (isValid) {
    handleShowPicker(false);
    emit("update:modelValue", { from: searchRange.from, to: searchRange.to });
  } else {
    alert(errorMsg);
  }
};

// 취소
const handleCancleDate = () => {
  searchRange.from = formatDate(props.from);
  searchRange.to = formatDate(props.to);

  handleShowPicker(false);
};

// 달력 컨트롤
const handleShowPicker = (value) => {
  showMenu.value = value;
};

// 달력 전체 사이즈
const menuMinWidth = computed(() => {
  const widthNum = parseInt(props.minWidth);
  return isNaN(widthNum) ? "auto" : `${widthNum * 2}px`;
});

// 날짜 감지
watch(
  () => [props.from, props.to],
  ([newFrom, newTo]) => {
    searchRange.from = formatDate(newFrom);
    searchRange.to = formatDate(newTo);
  },
);
</script>
<template>
  <VMenu
    v-model="showMenu"
    offset-y
    transition="slide-y-transition"
    :closeOnContentClick="false"
    :return-value.sync="dateText"
    :minWidth="menuMinWidth"
    @update:visible="handleShowPicker"
  >
    <template v-slot:activator="{ props }">
      <InputBox v-model="dateText" readonly prepend-icon="mdi-calendar" v-bind="{ ...attrs, ...props }"></InputBox>
    </template>
    <Card>
      <div class="d-flex flex-row justify-content-between ga-2">
        <DatePicker
          no-title
          scrollable
          :hideWeekdays="props.hideWeekdays"
          :color="props.color"
          :headerColor="props.headerColor"
          :mode="props.mode"
          :model-value="searchRange.from"
          :minWidth="props.minWidth"
          @update:model-value="updateFromDate"
        />
        <DatePicker
          no-title
          scrollable
          :hideWeekdays="props.hideWeekdays"
          :color="props.color"
          :headerColor="props.headerColor"
          :mode="props.mode"
          :model-value="searchRange.to"
          :minWidth="props.minWidth"
          @update:model-value="updateToDate"
        />
      </div>
      <div class="d-flex justify-end ga-2 pa-1">
        <Button name="취소" color="primary" @click="handleCancleDate"></Button>
        <Button name="저장" color="primary" @click="handleSaveDate"></Button>
      </div>
    </Card>
  </VMenu>
</template>
<style lang="scss" scoped></style>
