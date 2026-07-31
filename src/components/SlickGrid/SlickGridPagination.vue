<script setup>
import { ref, computed, onBeforeUnmount } from "vue";

/* ***************************************************************************************************************
SlickGrid 커스텀 페이지네이션

slickgrid-vue의 gridOptions.customPaginationComponent 로 등록됩니다.

--------------------------------------------------------------------------------------------------
반드시 지켜야 하는 제약 (slickgrid-vue 내부 구현을 확인한 결과)
--------------------------------------------------------------------------------------------------
slickgrid-vue는 이 컴포넌트를 이렇게 다룹니다.

  const el = document.createElement('section');
  const inst = createApp(customPaginationComponent).mount(el);
  container.appendChild(inst.$el);
  nextTick(() => { inst.init(grid, paginationService, pubSubService, translater); inst.renderPagination(container); });

여기서 나오는 제약 3가지 :

1) createApp() 으로 "별도의 Vue 앱"에 마운트된다.
   -> 부모 앱의 플러그인이 없다. 즉 Vuetify 컴포넌트(VBtn/VSelect 등)를 쓸 수 없다.
      그래서 순수 HTML + CSS로만 만든다. (여러 프로젝트에 이식할 때도 이 편이 안전하다)

2) props를 넘길 수 없다.
   -> 정렬 위치 같은 설정은 init()에서 받은 grid의 옵션(grid.getOptions())에서 읽어온다.
      SlickGrid 옵션 객체는 모르는 키를 그대로 보관하므로 sgPagination* 키를 심어서 전달한다.

3) inst.$el 을 컨테이너에 append 한다.
   -> 루트 엘리먼트가 반드시 1개여야 한다. 루트가 여러 개면 $el이 주석 앵커가 되어 화면에 아무것도 안 나온다.

4) init / dispose / renderPagination 을 인스턴스에서 호출한다.
   -> defineExpose로 반드시 노출해야 한다.
--------------------------------------------------------------------------------------------------
****************************************************************************************************************** */

/** 루트 엘리먼트 참조. renderPagination()에서 컨테이너 부착 여부를 확인하는 데 쓴다. */
const rootEl = ref(null);

const paginationService = ref(null);
const pubSubService = ref(null);

/** 정렬 위치 : left | center | right */
const align = ref("right");
/** 페이지당 건수 셀렉터 표시 여부 */
const showPageSize = ref(true);

const pageNumber = ref(1);
const pageCount = ref(1);
const pageSize = ref(20);
const pageSizes = ref([20, 50, 100, 500]);
const totalItems = ref(0);
const dataFrom = ref(0);
const dataTo = ref(0);

/** 커서 기반 페이징(GraphQL 등)일 때는 페이지 번호 직접 이동이 불가하다 */
const isCursorBased = ref(false);

let subscriptions = [];

/** paginationService의 현재 상태를 화면 상태로 복사 */
const syncFromService = () => {
  const svc = paginationService.value;
  if (!svc) return;

  pageNumber.value = svc.pageNumber ?? 1;
  pageCount.value = svc.pageCount ?? 1;
  pageSize.value = svc.itemsPerPage ?? pageSize.value;
  totalItems.value = svc.totalItems ?? 0;
  dataFrom.value = svc.dataFrom ?? 0;
  dataTo.value = svc.dataTo ?? 0;

  const sizes = svc.availablePageSizes;
  if (Array.isArray(sizes) && sizes.length > 0) pageSizes.value = sizes;
};

/* ---------------------------------------------------------------------------------------------------------------
표시할 페이지 번호 목록

전체 페이지가 많아도 버튼이 무한정 늘어나지 않도록 현재 페이지 주변만 보여주고
양끝은 ... 으로 줄인다. (1 ... 4 5 [6] 7 8 ... 20)
--------------------------------------------------------------------------------------------------------------- */
const MAX_VISIBLE_PAGES = 5;

const visiblePages = computed(() => {
  const total = pageCount.value;
  const current = pageNumber.value;

  if (total <= 1) return [1];
  if (total <= MAX_VISIBLE_PAGES + 2) return Array.from({ length: total }, (_, i) => i + 1);

  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + MAX_VISIBLE_PAGES - 1);

  // 끝에 붙었을 때 앞쪽으로 밀어 항상 MAX_VISIBLE_PAGES개가 보이도록
  if (end - start + 1 < MAX_VISIBLE_PAGES) start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);

  const pages = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let p = start; p <= end; p++) pages.push(p);

  if (end < total) {
    if (end < total - 1) pages.push("...");
    pages.push(total);
  }

  return pages;
});

const isFirstPage = computed(() => pageNumber.value <= 1);
const isLastPage = computed(() => pageNumber.value >= pageCount.value);

/** "1-20 / 총 120건" */
const rangeText = computed(() => {
  if (totalItems.value === 0) return "0건";
  return `${dataFrom.value.toLocaleString()}-${dataTo.value.toLocaleString()} / 총 ${totalItems.value.toLocaleString()}건`;
});

/* ---------------------------------------------------------------------------------------------------------------
이동
--------------------------------------------------------------------------------------------------------------- */
const goFirst = () => !isFirstPage.value && paginationService.value?.goToFirstPage();
const goPrev = () => !isFirstPage.value && paginationService.value?.goToPreviousPage();
const goNext = () => !isLastPage.value && paginationService.value?.goToNextPage();
const goLast = () => !isLastPage.value && paginationService.value?.goToLastPage();

const goPage = (page) => {
  if (page === "..." || page === pageNumber.value) return;
  paginationService.value?.goToPageNumber(Number(page));
};

const onChangePageSize = (event) => {
  const size = Number(event.target.value);
  if (Number.isFinite(size)) paginationService.value?.changeItemPerPage(size);
};

/* ---------------------------------------------------------------------------------------------------------------
BasePaginationModel 구현 (slickgrid-vue가 호출)
--------------------------------------------------------------------------------------------------------------- */

/**
 * @param {Object} grid SlickGrid 원본 객체
 * @param {Object} service PaginationService
 * @param {Object} pubSub EventPubSubService
 */
const init = (grid, service, pubSub) => {
  paginationService.value = service;
  pubSubService.value = pubSub;

  // props를 못 받으므로 그리드 옵션에서 설정을 읽는다 (위 주석 2번 참고)
  const options = grid?.getOptions?.() ?? {};
  if (["left", "center", "right"].includes(options.sgPaginationAlign)) align.value = options.sgPaginationAlign;
  if (options.sgPaginationShowPageSize === false) showPageSize.value = false;

  syncFromService();

  // 페이지 이동 / 건수 변경 / 필터로 총건수 변경 시 갱신
  subscriptions.push(
    pubSub?.subscribe?.("onPaginationRefreshed", () => syncFromService()),
    pubSub?.subscribe?.("onPaginationChanged", () => syncFromService()),
    pubSub?.subscribe?.("onPaginationSetCursorBased", () => {
      isCursorBased.value = true;
      syncFromService();
    }),
  );
};

/**
 * slickgrid-vue가 이미 $el을 컨테이너에 append한 뒤 호출한다.
 * 혹시 붙지 않은 경우를 대비해 방어적으로만 처리한다.
 *
 * @param {HTMLElement} containerElm
 */
const renderPagination = (containerElm) => {
  const el = rootEl.value;
  if (el && containerElm && !containerElm.contains(el)) containerElm.appendChild(el);
};

const dispose = () => {
  // 구독 해제를 안 하면 그리드를 여러 번 열고 닫을 때 콜백이 누적된다
  subscriptions.forEach((sub) => sub?.unsubscribe?.());
  subscriptions = [];
  paginationService.value = null;
  pubSubService.value = null;
};

onBeforeUnmount(dispose);

defineExpose({ init, dispose, renderPagination });
</script>

<template>
  <!-- 루트 엘리먼트는 반드시 1개 (위 주석 3번 참고) -->
  <div ref="rootEl" class="sg-pagination" :class="`sg-pagination--${align}`">
    <!-- 건수 정보 -->
    <div class="sg-pagination__info">{{ rangeText }}</div>

    <!-- 페이지 이동 -->
    <nav class="sg-pagination__nav" aria-label="페이지 이동">
      <button type="button" class="sg-pagination__btn" :disabled="isFirstPage" title="첫 페이지" aria-label="첫 페이지" @click="goFirst">
        <span aria-hidden="true">«</span>
      </button>
      <button type="button" class="sg-pagination__btn" :disabled="isFirstPage" title="이전 페이지" aria-label="이전 페이지" @click="goPrev">
        <span aria-hidden="true">‹</span>
      </button>

      <!-- 커서 기반 페이징은 임의 페이지로 점프할 수 없어 번호를 숨긴다 -->
      <template v-if="!isCursorBased">
        <button
          v-for="(page, i) in visiblePages"
          :key="`${page}-${i}`"
          type="button"
          class="sg-pagination__page"
          :class="{
            'is-active': page === pageNumber,
            'is-ellipsis': page === '...',
          }"
          :disabled="page === '...'"
          :aria-current="page === pageNumber ? 'page' : undefined"
          @click="goPage(page)"
        >
          {{ page }}
        </button>
      </template>
      <span v-else class="sg-pagination__cursor-page">{{ pageNumber }}</span>

      <button type="button" class="sg-pagination__btn" :disabled="isLastPage" title="다음 페이지" aria-label="다음 페이지" @click="goNext">
        <span aria-hidden="true">›</span>
      </button>
      <button type="button" class="sg-pagination__btn" :disabled="isLastPage" title="마지막 페이지" aria-label="마지막 페이지" @click="goLast">
        <span aria-hidden="true">»</span>
      </button>
    </nav>

    <!-- 페이지당 건수 -->
    <div v-if="showPageSize" class="sg-pagination__size">
      <label :for="`sg-page-size-${align}`">페이지당</label>
      <select :id="`sg-page-size-${align}`" class="sg-pagination__select" :value="pageSize" @change="onChangePageSize">
        <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
/* ***************************************************************************************************************
별도 Vue 앱에 마운트되므로 Vuetify 클래스를 쓸 수 없다. 전부 자체 스타일.
색은 SlickGrid 테마와 톤을 맞추기 위해 --sg-* 변수를 참조하고, 없을 때의 폴백을 함께 지정한다.
****************************************************************************************************************** */
.sg-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--sg-text, #212121);
  border-top: 1px solid var(--sg-border-color, #e0e0e0);
  background: #fff;
  box-sizing: border-box;
  width: 100%;
}

/* ----- 3가지 정렬 타입 ----- */

/* 왼쪽 : 정보 - 이동 - 건수 순서로 전부 좌측에 모음 */
.sg-pagination--left {
  justify-content: flex-start;
}

/* 오른쪽 : 전부 우측에 모음 */
.sg-pagination--right {
  justify-content: flex-end;
}

/*
 * 중앙 : 이동 버튼을 "화면 정중앙"에 두는 것이 핵심.
 * 단순히 justify-content:center 로 하면 좌우 텍스트 길이가 달라서 중앙이 어긋난다.
 * 양쪽 요소에 같은 flex 기저를 주고 nav를 가운데 고정한다.
 */
.sg-pagination--center {
  justify-content: space-between;
}

.sg-pagination--center .sg-pagination__info,
.sg-pagination--center .sg-pagination__size {
  flex: 1 1 0;
}

.sg-pagination--center .sg-pagination__size {
  justify-content: flex-end;
}

.sg-pagination--center .sg-pagination__nav {
  flex: 0 0 auto;
}

/* ----- 구성 요소 ----- */
.sg-pagination__info {
  color: #607d8b;
  white-space: nowrap;
}

.sg-pagination__nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

/*
 * 버튼 내용 정렬
 *
 * inline-flex + center 로 "박스 기준" 중앙 정렬을 한다.
 * 기본 inline-block 상태에서는 baseline 정렬이라 « ‹ › » 같은 글리프가
 * 숫자와 세로 위치가 어긋나 아래로 처져 보인다 (글리프마다 baseline 대비 위치가 다르기 때문).
 */
.sg-pagination__btn,
.sg-pagination__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid var(--sg-border-color, #e0e0e0);
  border-radius: 4px;
  background: #fff;
  color: inherit;
  font-size: 13px;
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

/*
 * 화살표 글리프
 *
 * 숫자(13px)와 나란히 놓았을 때 시각적 크기가 비슷하도록 조금 키우고,
 * line-height를 1로 고정해 글리프 박스가 버튼 안에서 정확히 중앙에 오게 한다.
 */
.sg-pagination__btn > span {
  display: block;
  font-size: 16px;
  line-height: 1;
}

.sg-pagination__btn:hover:not(:disabled),
.sg-pagination__page:hover:not(:disabled):not(.is-active) {
  background: var(--sg-row-hover, #f5f9ff);
  border-color: var(--sg-primary, #1867c0);
}

.sg-pagination__btn:disabled,
.sg-pagination__page:disabled {
  opacity: 0.4;
  cursor: default;
}

.sg-pagination__page.is-active {
  background: var(--sg-primary, #1867c0);
  border-color: var(--sg-primary, #1867c0);
  color: #fff;
  font-weight: 600;
}

/* ... 는 버튼처럼 보이지 않게 */
.sg-pagination__page.is-ellipsis {
  border-color: transparent;
  background: transparent;
  opacity: 0.6;
  cursor: default;
  min-width: 20px;
}

.sg-pagination__cursor-page {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.sg-pagination__size {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: #607d8b;
}

.sg-pagination__select {
  height: 30px;
  padding: 0 4px;
  border: 1px solid var(--sg-border-color, #e0e0e0);
  border-radius: 4px;
  background: #fff;
  color: var(--sg-text, #212121);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

/* ---------------------------------------------------------------------------------------------------------------
반응형

그리드는 좁은 컨테이너에 들어가는 일이 많아서 화면폭이 아닌 "컨테이너 폭"을 기준으로 줄여야 한다.
container query를 쓰면 그리드가 어떤 폭에 놓이든 동일하게 동작한다.
--------------------------------------------------------------------------------------------------------------- */
.sg-pagination {
  container-type: inline-size;
}

/* 좁아지면 : 세로 3단으로 쌓고 이동 버튼을 가운데 */
@container (max-width: 560px) {
  .sg-pagination {
    flex-direction: column;
    gap: 8px;
  }

  .sg-pagination--center .sg-pagination__info,
  .sg-pagination--center .sg-pagination__size {
    flex: 0 0 auto;
  }

  .sg-pagination--center .sg-pagination__size {
    justify-content: center;
  }

  .sg-pagination__nav {
    order: -1;
  }
}

/* 더 좁아지면 : 페이지 번호 버튼을 숨기고 이전/다음만 남긴다 */
@container (max-width: 380px) {
  .sg-pagination__page:not(.is-active) {
    display: none;
  }
}

/* container query를 지원하지 않는 환경 폴백 (화면폭 기준) */
@supports not (container-type: inline-size) {
  @media (max-width: 600px) {
    .sg-pagination {
      flex-direction: column;
      gap: 8px;
    }

    .sg-pagination__page:not(.is-active) {
      display: none;
    }
  }
}
</style>
