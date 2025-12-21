script
<script setup>
import Card from "@/components/Card/Card.vue";
import Button from "@/components/Button/Button.vue";

import { VDatePicker } from "vuetify/components";

const props = defineProps({
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
    default: "none", // none, flexible, monthly
  },
});

const modelValue = defineModel({
  type: [String, Date],
  default: () => new Date(),
});

const attrs = useAttrs();

const slots = useSlots();

const observer = ref(null);

const datePickerContainer = ref(null);

const daysOfWeekLabels = ["일", "월", "화", "수", "목", "금", "토"];

const yearList = ref([new Date(modelValue.value).getFullYear()]);

const simpleMonths = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const month = Object.values(simpleMonths).map((dt) => dt);

const monthName = Object.values(simpleMonths).map((dt) => `${dt}월`);

const getMonth = (dateVal) => {
  if (dateVal === undefined || dateVal === null || dateVal === "") return "";

  if (typeof dateVal === "string" && simpleMonths[dateVal] !== undefined) {
    return simpleMonths[dateVal];
  }

  if (typeof dateVal === "number") {
    if (isNaN(numDate) || numDate < 1 || numDate > 12) return "";

    return numDate - 1;
  }

  const d = new Date(dateVal);

  if (isNaN(d.getTime())) return "";

  return d.getMonth() || 0;
};

const formatDate = (dateVal, format = "-") => {
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}${format}${month}${format}${day}`;
};

const hideWeekdaysHandler = async (hide) => {
  await nextTick();

  if (!datePickerContainer.value) return;

  const container = datePickerContainer.value.querySelector(".v-date-picker-month__days");
  if (!container) return;

  const weeks = datePickerContainer.value.querySelectorAll(".v-date-picker-month__day.v-date-picker-month__weekday");

  if (hide) {
    weeks.forEach((week) => week.remove());
  } else if (weeks.length < 1) {
    const fragment = document.createDocumentFragment();

    daysOfWeekLabels.forEach((label) => {
      const div = document.createElement("div");
      div.className = "v-date-picker-month__day v-date-picker-month__weekday";
      div.style.alignItems = "center";
      div.style.fontSize = "0.875rem";
      div.textContent = label;
      fragment.appendChild(div);
    });

    container.insertBefore(fragment, container.firstChild);
  } else {
    weeks.forEach((week, idx) => {
      week.textContent = daysOfWeekLabels[idx];
    });
  }
};

// Flexible Mode 사용
const handleChangeYear = (year) => {
  const getDate = new Date(modelValue.value);

  getDate.setFullYear(year);

  modelValue.value = getDate;
};

const handleChangeMonth = (month) => {
  const getDate = new Date(modelValue.value);

  getDate.setMonth(month - 1);

  modelValue.value = getDate;
};

// Monthly Mode 사용
const handleChangeDate = (type, year, month) => {
  const getDate = new Date(modelValue.value);

  getDate.setFullYear(type === "prev" ? +year - 1 : +year + 1);

  getDate.setMonth(getMonth(month) - 1);

  modelValue.value = getDate;
};

watch(
  () => props.hideWeekdays,
  (nVal) => {
    hideWeekdaysHandler(nVal);
  },
);

onMounted(() => {
  const targetNode = datePickerContainer.value.querySelector(".collector-datePicker");

  if (targetNode) {
    observer.value = new MutationObserver(async (mutations) => {
      observer.value.disconnect();

      await hideWeekdaysHandler(props.hideWeekdays);

      observer.value.observe(targetNode, { childList: true, subtree: true });
    });

    observer.value.observe(targetNode, { childList: true, subtree: true });
  }

  hideWeekdaysHandler(props.hideWeekdays);

  // flexible mode에서 년/월 초기 값 설정
  if (props.mode === "flexible") {
    const getYear = new Date(modelValue.value).getFullYear();

    const prevYear = [];
    const nextYear = [];
    for (let i = 1; i <= 10; ++i) {
      prevYear.push(getYear - i);
      nextYear.push(getYear + i);
    }

    yearList.value.push(...prevYear, ...nextYear);
    yearList.value = yearList.value.sort((a, b) => b - a);
  }
});
</script>
<template>
  <div ref="datePickerContainer" class="d-flex flex-column justify-content-center align-items-center" style="min-width: 290px">
    <!-- 커스텀 헤더 -->
    <slot v-if="slots.header" name="header" />
    <div v-else>
      <Card :style="{ backgroundColor: props.headerColor }">
        <template #text>
          <div style="pading: 16px; font-size: 18px; font-weight: bold; text-align: left; color: black">
            {{ formatDate(modelValue) }}
          </div>
        </template>
      </Card>
    </div>
    <VDatePicker
      v-model="modelValue"
      v-bind="attrs"
      class="collector-datePicker"
      hideHeader
      showAdjacentMonths
      :color="props.color"
      nextIcon="mdi-chevron-right"
      prevIcon="mdi-chevron-left"
    >
      <!-- Flexible Mode-->
      <template v-if="props.mode === 'flexible'" v-slot:controls="{ yearText, monthText }">
        <VRow>
          <VCol cols="4" class="d-flex justify-center">
            <VAutocomplete
              :model-value="yearText"
              :items="yearList"
              theme="light"
              style="max-height: 50px"
              variant="underlined"
              @update:modelValue="handleChangeYear"
            />
          </VCol>
          <VCol cols="4" class="d-flex justify-center">
            <VAutocomplete
              :model-value="getMonth(monthText)"
              theme="light"
              style="max-height: 50px"
              variant="underlined"
              :items="month"
              @update:modelValue="handleChangeMonth"
            />
          </VCol>
          <VCol cols="4" style="min-height: 80px" />
        </VRow>
      </template>
      <!-- Monthly Mode-->
      <template v-else-if="props.mode === 'monthly'" v-slot:controls="{ nextMonth, prevMonth, monthYearText, yearText, monthText }">
        <VRow>
          <VCol cols="2" class="d-flex justify-center">
            <Button color="primary" @click="() => handleChangeDate('prev', yearText, monthText)">
              <VIcon class="mdi mdi-chevron-triple-left" />
            </Button>
          </VCol>
          <VCol cols="2" class="d-flex justify-center">
            <Button color="primary" @click="prevMonth">
              <VIcon icon="$prev" />
            </Button>
          </VCol>
          <VCol cols="4" class="d-flex justify-center">
            <h4>{{ `${yearText}년 ${monthName[getMonth(monthText) - 1]}` }}</h4>
          </VCol>
          <VCol cols="2" class="d-flex justify-center">
            <Button color="primary" @click="nextMonth">
              <VIcon icon="$next" />
            </Button>
          </VCol>
          <VCol cols="2" class="d-flex justify-center">
            <Button color="primary" @click="() => handleChangeDate('next', yearText, monthText)">
              <VIcon class="mdi mdi-chevron-triple-right" />
            </Button>
          </VCol>
        </VRow>
      </template>
      <!-- None Mode-->
      <template v-else-if="props.mode === 'none'" v-slot:controls="" />
    </VDatePicker>
  </div>
</template>
<style lang="scss" scoped></style>
