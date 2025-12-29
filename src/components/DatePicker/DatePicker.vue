<script setup>
import { ref, computed, watch, onMounted, nextTick, useAttrs, useSlots } from "vue";
import { useI18n } from "vue-i18n";

import Card from "@/components/Card/Card.vue";
import Button from "@/components/Button/Button.vue";
import { VDatePicker } from "vuetify/components";

const { locale } = useI18n();

const props = defineProps({
  hideWeekdays: { type: Boolean, default: true },
  color: { type: String, default: "black" },
  headerColor: { type: String, default: "#dbdbdb" },
  mode: { type: String, default: "none" }, // none, flexible, monthly
  highlightSunday: { type: Boolean, default: true },
  minWidth: { type: String, default: "150px" },
  holidayList: { type: Array, default: () => ["2025-12-25", "2026-01-01", "2026-01-09", "2026-02-01", "2026-02-18", "2026-03-01", "2026-03-12"] },
});

const modelValue = defineModel({
  type: [String, Date],
  default: () => new Date(),
});

const attrs = useAttrs();
const slots = useSlots();
const observer = ref(null);
const datePickerContainer = ref(null);

// 데이터 정의
const monthsData = {
  ko: {
    simpleMonths: { "1월": 1, "2월": 2, "3월": 3, "4월": 4, "5월": 5, "6월": 6, "7월": 7, "8월": 8, "9월": 9, "10월": 10, "11월": 11, "12월": 12 },
    labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    days: ["일", "월", "화", "수", "목", "금", "토"],
  },
  en: {
    simpleMonths: { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 },
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
};

const currentLocaleData = computed(() => monthsData[locale.value] || monthsData.en);

const month = computed(() => Object.values(currentLocaleData.value.simpleMonths));
const monthName = computed(() => currentLocaleData.value.labels);
const daysOfWeekLabels = computed(() => currentLocaleData.value.days);
const yearList = ref([new Date(modelValue.value).getFullYear()]);

// Helper Functions
const getMonth = (dateVal) => {
  if (dateVal === undefined || dateVal === null || dateVal === "") return "";

  // 문자열 처리 (e.g., "1월", "Jan")
  if (typeof dateVal === "string") {
    const monthMap = currentLocaleData.value.simpleMonths;
    if (monthMap[dateVal] !== undefined) return monthMap[dateVal];

    // 숫자만 추출 (한국어 "1월" 대응)
    const numericOnly = dateVal.replace(/[^0-9]/g, "");
    if (numericOnly) return parseInt(numericOnly);
  }

  // 숫자 처리
  if (typeof dateVal === "number") {
    if (isNaN(dateVal) || dateVal < 1 || dateVal > 12) return "";
    return dateVal;
  }

  // Date 객체 처리
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "" : d.getMonth() + 1;
};

const formatDate = (dateVal, format = "-") => {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${format}${month}${format}${day}`;
};

// 헤더 텍스트 포맷팅 함수 (년도/월 순서 처리)
const formatHeaderTitle = (yearText, monthText) => {
  const monthIndex = getMonth(monthText) - 1;
  const currentMonthName = monthName.value && monthName.value[monthIndex] ? monthName.value[monthIndex] : "";

  if (locale.value === "ko") {
    return `${yearText}년 ${currentMonthName}`;
  } else {
    return `${currentMonthName} ${yearText}`;
  }
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
    if (daysOfWeekLabels.value) {
      daysOfWeekLabels.value.forEach((label) => {
        const div = document.createElement("div");
        div.className = "v-date-picker-month__day v-date-picker-month__weekday";
        div.style.alignItems = "center";
        div.style.fontSize = "0.875rem";
        div.textContent = label;
        fragment.appendChild(div);
      });
      container.insertBefore(fragment, container.firstChild);
    }
  } else {
    weeks.forEach((week, idx) => {
      if (daysOfWeekLabels.value && daysOfWeekLabels.value[idx]) {
        week.textContent = daysOfWeekLabels.value[idx];
      }
    });
  }
};

// 공휴일 지정
const applyHolidayStyles = async () => {
  await nextTick();
  if (!datePickerContainer.value) return;

  const dates = datePickerContainer.value.querySelectorAll(".v-date-picker-month__day");

  dates.forEach((date) => {
    // 상단 요일 제외
    const Weekdays = date.getAttribute("v-date-picker-month__day v-date-picker-month__weekday");
    if (Weekdays) return;

    // 이번달이 아닌 전/후 달의 날짜(회색)은 제외.
    const outsideDatedateAttr = date.classList.contains("v-date-picker-month__day--adjacent");
    if (outsideDatedateAttr) return;

    // 날짜
    const getDate = date.getAttribute("data-v-date");
    if (!getDate) return;

    // 초기화 (리렌더링 시 기존 스타일 제거)
    date.style.color = "";
    date.querySelector(".v-btn__content")?.classList.remove("holiday-text");

    const formattedDate = formatDate(new Date(getDate));

    // 조건부 스타일 적용
    if (props.holidayList && props.holidayList.includes(formattedDate)) {
      date.style.setProperty("color", "red", "important");
      // 날짜 밑에 점
      date.querySelector(".v-btn__content")?.classList.add("holiday-text");
    }

    // 일요일
    if (props.highlightSunday && date.classList.contains("v-date-picker-month__day--week-start")) {
      date.style.setProperty("color", "red", "important");
    }
  });
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

  const numericValue = +year.replace(/[^0-9]/g, "");

  getDate.setFullYear(type === "prev" ? numericValue - 1 : numericValue + 1);
  getDate.setMonth(getMonth(month) - 1);
  modelValue.value = getDate;
};

watch(
  () => props.hideWeekdays,
  (nVal) => hideWeekdaysHandler(nVal),
);

watch(locale, () => hideWeekdaysHandler(props.hideWeekdays));

onMounted(() => {
  const targetNode = datePickerContainer.value.querySelector(".collector-datePicker");

  if (targetNode) {
    observer.value = new MutationObserver(async () => {
      observer.value.disconnect();
      // 요일 숨기기 컨트롤
      await hideWeekdaysHandler(props.hideWeekdays);

      // 공휴일 스타일 적용
      await applyHolidayStyles();
      observer.value.observe(targetNode, { childList: true, subtree: true });
    });
    observer.value.observe(targetNode, { childList: true, subtree: true });
  }

  hideWeekdaysHandler(props.hideWeekdays);

  applyHolidayStyles();

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
  <div ref="datePickerContainer" class="d-flex flex-column justify-content-center align-items-center" :style="{ minWidth: props.minWidth }">
    <!-- 커스텀 헤더 -->
    <slot v-if="slots.header" name="header" />
    <div v-else>
      <Card :style="{ backgroundColor: props.headerColor }">
        <template #text>
          <div style="font-size: 18px; font-weight: bold; text-align: left; color: black">
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
      :style="{ minWidth: props.minWidth }"
      nextIcon="mdi-chevron-right"
      prevIcon="mdi-chevron-left"
    >
      <!-- Flexible Mode-->
      <template v-if="props.mode === 'flexible'" v-slot:controls="{ yearText, monthText }">
        <VRow>
          <VCol cols="5" class="d-flex justify-center">
            <VAutocomplete
              :model-value="yearText"
              :items="yearList"
              theme="light"
              style="min-width: 50px; max-height: 50px"
              variant="underlined"
              @update:modelValue="handleChangeYear"
            />
          </VCol>
          <VCol cols="5" class="d-flex justify-center">
            <VAutocomplete
              :model-value="getMonth(monthText)"
              theme="light"
              style="min-width: 50px; max-height: 50px"
              variant="underlined"
              :items="month"
              @update:modelValue="handleChangeMonth"
            />
          </VCol>
          <VCol cols="2" style="min-height: 80px" />
        </VRow>
      </template>
      <!-- Monthly Mode-->
      <template v-else-if="props.mode === 'monthly'" v-slot:controls="{ nextMonth, prevMonth, yearText, monthText }">
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
            <h4>{{ formatHeaderTitle(yearText, monthText) }}</h4>
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

<style lang="scss" scoped>
:deep(.v-date-picker-month__day) {
  .holiday-text {
    font-weight: bold;
    &::after {
      content: "•";
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      color: red !important;
      font-size: 10px;
    }
  }
}
</style>
